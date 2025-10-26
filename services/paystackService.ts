// Paystack Payment Service
// Simple and clean implementation for subscription payments

export interface PaystackConfig {
  publicKey: string;
  secretKey: string;
}

export interface PaymentData {
  email: string;
  amount: number; // in kobo (multiply naira by 100)
  reference: string;
  plan: 'starter' | 'professional' | 'unlimited';
  metadata?: {
    userId: string;
    plan: string;
    [key: string]: any;
  };
}

export interface PaymentVerificationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
  };
}

class PaystackService {
  private publicKey: string;
  private secretKey: string;

  constructor() {
    this.publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
  }

  // Generate unique payment reference
  generateReference(userId: string): string {
    const timestamp = Date.now();
    return `adaptonia_${userId}_${timestamp}`;
  }

  // Initialize payment (client-side)
  initializePayment(paymentData: PaymentData): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Payment can only be initialized on client side'));
        return;
      }

      // @ts-ignore - PaystackPop is loaded from script tag
      const handler = window.PaystackPop.setup({
        key: this.publicKey,
        email: paymentData.email,
        amount: paymentData.amount,
        ref: paymentData.reference,
        metadata: paymentData.metadata,
        onClose: function() {
          reject(new Error('Payment cancelled'));
        },
        callback: function(response: any) {
          resolve(response);
        },
      });

      handler.openIframe();
    });
  }

  // Verify payment (server-side)
  async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const data: PaymentVerificationResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Get plan details
  getPlanDetails(plan: 'starter' | 'professional' | 'unlimited') {
    const plans = {
      starter: {
        name: '6 Weeks',
        amount: 40000, // Naira
        amountInKobo: 4000000, // Kobo (amount * 100)
        duration: 42, // days (6 weeks)
        description: '₦40,000 for 6 weeks',
        mentors: 1,
        mentorDescription: '1 dedicated mentor',
      },
      professional: {
        name: '12 Weeks',
        amount: 60000, // Naira
        amountInKobo: 6000000, // Kobo (amount * 100)
        duration: 84, // days (12 weeks)
        description: '₦60,000 for 12 weeks',
        mentors: 2,
        mentorDescription: '2 expert mentors',
      },
      unlimited: {
        name: '6 Months',
        amount: 100000, // Naira
        amountInKobo: 10000000, // Kobo (amount * 100)
        duration: 180, // days (6 months)
        description: '₦100,000 for 6 months',
        mentors: -1, // unlimited
        mentorDescription: 'Unlimited expert mentors',
      },
    };

    return plans[plan];
  }

  // Calculate subscription end date
  calculateEndDate(startDate: Date, plan: 'starter' | 'professional' | 'unlimited'): Date {
    const planDetails = this.getPlanDetails(plan);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planDetails.duration);
    return endDate;
  }
}

export const paystackService = new PaystackService();
