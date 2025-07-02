import { NextResponse } from "next/server";
import { Resend } from "resend";

// Directly use Resend like Salein, removing the complex emailService
const resend = new Resend(process.env.RESEND_API_KEY);

interface GoalReminderBody {
  to: string;
  userName?: string;
  goalTitle: string;
  goalDescription?: string;
  dueDate?: string;
}

const getEmailContent = (data: GoalReminderBody) => {
  const { userName, goalTitle, goalDescription, dueDate } = data;
  
  const formattedDate = dueDate 
    ? new Date(dueDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) 
    : 'No due date set';

  return {
    subject: `🎯 Reminder: Time to work on your goal!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <h2 style="color: #333;">Hi ${userName || 'there'},</h2>
        <p style="font-size: 16px;">This is a friendly reminder to make progress on your goal:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0056b3;">${goalTitle}</h3>
          ${goalDescription ? `<p>${goalDescription}</p>` : ''}
          <p><strong>Due Date:</strong> ${formattedDate}</p>
        </div>
        <p>Keep up the great work! Every step forward counts.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            You are receiving this email because you set a reminder in the Adaptonia app.
          </p>
        </div>
      </div>
    `,
  };
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, userName, goalTitle, goalDescription, dueDate } = body as GoalReminderBody;

    if (!to || !goalTitle) {
      return NextResponse.json(
        { error: "Missing required fields: to, goalTitle" },
        { status: 400 }
      );
    }
    
    const { subject, html } = getEmailContent(body);

    const { data, error } = await resend.emails.send({
      from: "Adaptonia <reminders@olonts.site>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json(
        { error: "Failed to send email", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to send reminder email:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
