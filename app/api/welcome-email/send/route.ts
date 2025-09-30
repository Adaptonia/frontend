import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { emailData } = await request.json();

    if (!emailData || !emailData.to || !emailData.subject) {
      return NextResponse.json(
        { success: false, error: 'Missing required email data' },
        { status: 400 }
      );
    }

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'Adaptonia <welcome@olonts.site>',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.htmlContent,
      text: emailData.textContent,
      headers: {
        'X-Email-Type': 'welcome-email'
      }
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }

    console.log('Welcome email sent successfully:', {
      emailId: emailResult.data?.id,
      recipient: emailData.to,
      subject: emailData.subject
    });

    return NextResponse.json({
      success: true,
      emailId: emailResult.data?.id,
      message: 'Welcome email sent successfully'
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending welcome email:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}