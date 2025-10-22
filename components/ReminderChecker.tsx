"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { reminderService } from "@/services/appwrite/reminderService";

export function ReminderChecker() {
  const reminderToastShown = useRef<Set<string>>(new Set());

  const checkAndSendReminders = async () => {
    try {
      const dueReminders = await reminderService.getDueReminders();

      
      if (dueReminders.documents.length === 0) {
        
        // Debug: Let's see ALL pending reminders regardless of due date
        try {
          const allPendingReminders = await reminderService.getAllPendingReminders();
        
        } catch (err) {
        }
        
        return;
      }
      

      await Promise.all(
        dueReminders.documents.map(async (reminder) => {
          try {
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