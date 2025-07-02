"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { reminderService } from "@/services/appwrite/reminderService";

export function ReminderChecker() {
  const reminderToastShown = useRef<Set<string>>(new Set());

  const checkAndSendReminders = async () => {
    try {
      console.log("✅ LOG 2: Checking for due reminders...");
      const dueReminders = await reminderService.getDueReminders();

      console.log(`✅ LOG 2.1: Query returned ${dueReminders.documents.length} reminders. Current time: ${new Date().toISOString()}`);
      
      if (dueReminders.documents.length === 0) {
        console.log("✅ LOG 2.2: No due reminders found. Checking all pending reminders for debug...");
        
        // Debug: Let's see ALL pending reminders regardless of due date
        try {
          const allPendingReminders = await reminderService.getAllPendingReminders();
          console.log("✅ LOG 2.3: All pending reminders:", allPendingReminders.documents.map((r: any) => ({
            id: r.$id,
            sendDate: r.sendDate,
            status: r.status,
            userEmail: r.userEmail,
            title: r.title
          })));
        } catch (err) {
          console.log("✅ LOG 2.3: Could not fetch all pending reminders (method may not exist)");
        }
        
        return;
      }
      
      console.log(`Found ${dueReminders.documents.length} due reminders.`);

      await Promise.all(
        dueReminders.documents.map(async (reminder) => {
          try {
            console.log(`✅ LOG 3: Processing reminder ${reminder.$id} for user ${reminder.userEmail}`);
            // Directly call the API with the reminder data, like Salein
            const response = await fetch("/api/notifications/reminder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: reminder.userEmail,
                userName: reminder.userName,
                goalTitle: reminder.title,
                goalDescription: reminder.description,
                dueDate: reminder.dueDate,
              }),
            });

            if (!response.ok) {
              console.error("Failed to send reminder:", await response.text());
              throw new Error("Failed to send reminder");
            }

            await reminderService.updateReminderStatus(reminder.$id, "sent");

            if (!reminderToastShown.current.has(reminder.$id)) {
              toast.success("Goal reminder sent!", {
                description: `For your goal: "${reminder.title}"`,
              });
              reminderToastShown.current.add(reminder.$id);
            }
          } catch (error) {
            console.error(`Error processing reminder ${reminder.$id}:`, error);
            const newRetryCount = (reminder.retryCount || 0) + 1;

            if (newRetryCount >= 3) {
              await reminderService.updateReminderStatus(reminder.$id, "failed");
            } else {
              await reminderService.updateRetryCount(reminder.$id, newRetryCount);
            }

            if (!reminderToastShown.current.has(reminder.$id)) {
              toast.error("Failed to send reminder", {
                description: `Will retry for "${reminder.title}" later.`
              });
              reminderToastShown.current.add(reminder.$id);
            }
          }
        })
      );
    } catch (error) {
      console.error("Error checking for due reminders:", error);
    }
  };

  useEffect(() => {
    // 🚫 CLIENT-SIDE REMINDER CHECKING DISABLED
    // We now use Vercel Cron Jobs for server-side email reminders
    // This runs automatically every 5 minutes via /api/cron/email-reminders
    // See vercel.json and VERCEL_CRON_SETUP.md for configuration
    
    console.log("📌 Client-side reminder checking is disabled - using Vercel cron jobs instead");
    
    // Uncomment the lines below to re-enable client-side checking if needed:
    // checkAndSendReminders();
    // const interval = setInterval(checkAndSendReminders, 60 * 1000);
    // return () => { clearInterval(interval); };
  }, []);

  return null; // This is an invisible component
} 