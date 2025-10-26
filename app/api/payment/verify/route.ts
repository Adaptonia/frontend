import { NextRequest, NextResponse } from 'next/server';
import { paystackService } from '@/services/paystackService';
import { subscriptionService } from '@/services/appwrite/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, userId, plan } = body;

    if (!reference || !userId || !plan) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const verification = await paystackService.verifyPayment(reference);

    if (!verification.status) {
      return NextResponse.json(
        { success: false, message: 'Payment verification failed' },
        { status: 400 }
      );
    }

    if (verification.data.status !== 'success') {
      return NextResponse.json(
        { success: false, message: 'Payment was not successful' },
        { status: 400 }
      );
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = paystackService.calculateEndDate(startDate, plan);

    // Create subscription in database
    const subscription = await subscriptionService.createSubscription({
      userId,
      plan,
      amount: verification.data.amount / 100, // Convert from kobo to naira
      currency: verification.data.currency,
      paymentReference: verification.data.reference,
      paymentChannel: verification.data.channel,
      startDate,
      endDate,
      autoRenew: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription created',
      data: {
        subscription,
        payment: verification.data,
      },
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
