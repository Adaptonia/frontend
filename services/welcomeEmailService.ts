interface WelcomeEmailData {
  to: string;
  userName: string;
}

class WelcomeEmailService {
  /**
   * Generate welcome email content
   */
  generateWelcomeEmail(data: WelcomeEmailData): {
    to: string;
    subject: string;
    htmlContent: string;
    textContent: string;
  } {
    return {
      to: data.to,
      subject: 'Welcome to Adaptonia – Your Partner Accountability Platform 🎯',
      htmlContent: this.generateWelcomeHTML(data.userName),
      textContent: this.generateWelcomeText(data.userName)
    };
  }

  /**
   * HTML email template
   */
  private generateWelcomeHTML(userName: string): string {
    const displayName = userName || 'there';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #3b82f6; font-size: 28px; margin: 0;">Welcome to Adaptonia! 🎯</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Your Partner Accountability Platform</p>
          </div>

          <!-- Greeting -->
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Hi ${displayName},
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Welcome to <strong>Adaptonia</strong>! We&apos;re excited to help you achieve your goals through the power of accountability partnerships.
          </p>

          <!-- What is Adaptonia -->
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #1e40af; margin: 0 0 12px 0;">What is Adaptonia?</h3>
            <p style="color: #374151; margin: 0; line-height: 1.6;">
              Adaptonia matches you with like-minded individuals who help verify your progress and keep you on track. Together, you&apos;ll achieve more through mutual accountability and support.
            </p>
          </div>

          <!-- What You Can Do -->
          <h3 style="color: #374151; margin: 32px 0 16px 0;">What You Can Do:</h3>
          <ul style="color: #374151; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
            <li><strong>Set Meaningful Goals</strong> – Create goals across Schedule, Finance, Career, and Learning categories</li>
            <li><strong>Get Matched with a Partner</strong> – Our intelligent algorithm finds you a compatible accountability partner</li>
            <li><strong>Break Down Goals into Tasks</strong> – Turn big goals into actionable, verifiable tasks</li>
            <li><strong>Track Your Progress</strong> – See real-time progress for both you and your partner</li>
            <li><strong>Verify Each Other&apos;s Work</strong> – Approve or provide feedback on your partner&apos;s task completions</li>
            <li><strong>Stay Motivated</strong> – Receive email reminders and notifications to keep you accountable</li>
            <li><strong>Build Consistency</strong> – Create lasting habits with someone counting on you</li>
          </ul>

          <!-- How It Works -->
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #374151; margin: 0 0 16px 0;">How Partner Accountability Works:</h3>
            <ol style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li><strong>Create Your Goals</strong> – Define what you want to achieve and break it into tasks</li>
              <li><strong>Get Matched</strong> – We&apos;ll find you a compatible accountability partner</li>
              <li><strong>Share Progress</strong> – Both you and your partner can see each other&apos;s goals and tasks</li>
              <li><strong>Verify Completion</strong> – Review and verify your partner&apos;s completed tasks</li>
              <li><strong>Achieve Together</strong> – Celebrate wins and support each other through challenges</li>
            </ol>
          </div>

          <!-- Getting Started -->
          <h3 style="color: #374151; margin: 32px 0 16px 0;">Getting Started:</h3>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <ol style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li><strong>Set Your Preferences</strong> – Tell us what kind of support style works best for you</li>
              <li><strong>Create Your First Goal</strong> – Add a goal with a clear deadline and break it into tasks</li>
              <li><strong>Find Your Partner</strong> – Use auto-matching or search manually for a compatible partner</li>
              <li><strong>Start Verifying</strong> – Review your partner&apos;s completed tasks and provide feedback</li>
              <li><strong>Track Progress</strong> – Monitor your shared dashboard for insights and metrics</li>
            </ol>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'https://adaptonia.app'}/dashboard"
               style="background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Get Started Now
            </a>
          </div>

          <!-- Why It Works -->
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #065f46; margin: 0 0 16px 0;">Why Accountability Partners Work:</h3>
            <ul style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Someone is counting on you – increases commitment</li>
              <li>External verification – ensures you follow through</li>
              <li>Mutual support – both partners benefit and grow</li>
              <li>Structured feedback – get guidance when you need it</li>
              <li>Consistency builds habits – small wins lead to big results</li>
            </ul>
          </div>

          <!-- Pro Tips -->
          <h3 style="color: #374151; margin: 32px 0 16px 0;">Pro Tips:</h3>
          <ul style="color: #374151; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
            <li>Set realistic deadlines – consistency beats perfection</li>
            <li>Break big goals into small, verifiable tasks</li>
            <li>Provide thoughtful feedback when verifying your partner&apos;s work</li>
            <li>Choose a partner with similar availability and commitment level</li>
            <li>Use evidence uploads to make verification easier</li>
          </ul>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 24px;">
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 0 0 16px 0;">
              Need help? Contact us at <a href="mailto:adaptonia@gmail.com" style="color: #3b82f6;">support@adaptonia.app</a>
            </p>
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 0;">
              <strong>The Adaptonia Team</strong><br>
              <em>Achieve more together through accountability</em>
            </p>
          </div>

        </div>
      </div>
    `;
  }

  /**
   * Plain text email template
   */
  private generateWelcomeText(userName: string): string {
    const displayName = userName || 'there';

    return `
Welcome to Adaptonia – Your Partner Accountability Platform 🎯

Hi ${displayName},

Welcome to Adaptonia! We're excited to help you achieve your goals through the power of accountability partnerships.

WHAT IS ADAPTONIA?

Adaptonia matches you with like-minded individuals who help verify your progress and keep you on track. Together, you'll achieve more through mutual accountability and support.

WHAT YOU CAN DO:

✅ Set Meaningful Goals – Create goals across Schedule, Finance, Career, and Learning categories
✅ Get Matched with a Partner – Our intelligent algorithm finds you a compatible accountability partner
✅ Break Down Goals into Tasks – Turn big goals into actionable, verifiable tasks
✅ Track Your Progress – See real-time progress for both you and your partner
✅ Verify Each Other's Work – Approve or provide feedback on your partner's task completions
✅ Stay Motivated – Receive email reminders and notifications to keep you accountable
✅ Build Consistency – Create lasting habits with someone counting on you

HOW PARTNER ACCOUNTABILITY WORKS:

1. Create Your Goals – Define what you want to achieve and break it into tasks
2. Get Matched – We'll find you a compatible accountability partner based on your preferences
3. Share Progress – Both you and your partner can see each other's goals and tasks
4. Verify Completion – When your partner completes a task, review and verify their work
5. Achieve Together – Celebrate wins and support each other through challenges

GETTING STARTED:

1. Set Your Preferences – Tell us what kind of support style works best for you (encouraging, structured, collaborative)
2. Create Your First Goal – Add a goal with a clear deadline and break it into tasks
3. Find Your Partner – Use auto-matching or search manually for a compatible accountability partner
4. Start Verifying – Review your partner's completed tasks and provide feedback
5. Track Progress – Monitor your shared dashboard for insights and metrics

KEY FEATURES:

🎯 Smart Matching – 60%+ compatibility scoring based on goals, experience, and preferences
📊 Progress Dashboard – Real-time stats on goals completed, verification queue, and partnership metrics
✅ Task Verification – Approve, reject, or request redo with comments and feedback
📧 Email Notifications – Stay updated on partner assignments, task completions, and verification requests
📈 Analytics – Track completion rates, response times, and accountability insights
🔄 Goal Categories – Schedule, Finance, Career, and Learning goals supported

WHY ACCOUNTABILITY PARTNERS WORK:

✅ Someone is counting on you – increases commitment
✅ External verification – ensures you follow through
✅ Mutual support – both partners benefit and grow
✅ Structured feedback – get guidance when you need it
✅ Consistency builds habits – small wins lead to big results

PRO TIPS:

🔹 Set realistic deadlines – consistency beats perfection
🔹 Break big goals into small, verifiable tasks
🔹 Provide thoughtful feedback when verifying your partner's work
🔹 Choose a partner with similar availability and commitment level
🔹 Use evidence uploads to make verification easier

Ready to achieve your goals with accountability? Create your first goal and find your partner today!

Get started: ${process.env.NEXTAUTH_URL || 'https://adaptonia.app'}/dashboard

---

Need Help?
Support: support@adaptonia.app
Partnership Issues: Check your dashboard for partner status and metrics
Goal Ideas: Browse categories to find inspiration for your next goal

---

The Adaptonia Team
Achieve more together through accountability
    `.trim();
  }

  /**
   * Send welcome email via API route
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const emailData = this.generateWelcomeEmail(data);

      const response = await fetch('/api/welcome-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailData }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Welcome email sent successfully to:', data.to);
        return true;
      } else {
        console.error('Failed to send welcome email:', result.error);
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error sending welcome email:', errorMessage);
      return false;
    }
  }
}

export const welcomeEmailService = new WelcomeEmailService();
export default welcomeEmailService;