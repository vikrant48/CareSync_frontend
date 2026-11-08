import { Injectable } from '@angular/core';
import { RazorpayCheckout } from './payment.service';

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export type RazorpayResult = { status: 'success'; response: RazorpaySuccess } | { status: 'dismissed' };

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

@Injectable({ providedIn: 'root' })
export class RazorpayCheckoutService {
  private loading?: Promise<void>;

  private load(): Promise<void> {
    if ((window as any).Razorpay) return Promise.resolve();
    if (!this.loading) {
      this.loading = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = CHECKOUT_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
          this.loading = undefined;
          script.remove();
          reject(new Error('Could not load Razorpay checkout. Check your connection and try again.'));
        };
        document.body.appendChild(script);
      });
    }
    return this.loading;
  }

  async open(checkout: RazorpayCheckout, method?: 'upi' | 'card'): Promise<RazorpayResult> {
    await this.load();
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    return new Promise<RazorpayResult>((resolve) => {
      const rzp = new (window as any).Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        order_id: checkout.orderId,
        name: 'CareSync',
        description: checkout.description || 'CareSync payment',
        prefill: method ? { method } : {},
        timeout: 900,
        theme: primary ? { color: primary } : undefined,
        handler: (response: RazorpaySuccess) => resolve({ status: 'success', response }),
        modal: {
          ondismiss: () => resolve({ status: 'dismissed' }),
          confirm_close: true,
        },
      });
      rzp.open();
    });
  }
}
