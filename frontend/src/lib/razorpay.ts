import axios from 'axios';
import { axiosClient, getErrorMessage } from '../api/axiosClient';
import { PaymentInit } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Razorpay?: any;
  }
}

export type PaymentOutcome =
  | { status: 'paid' }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string }
  | { status: 'unavailable'; message: string };

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** Loads Razorpay's checkout script if index.html's copy failed (e.g. blocked or offline at first load). */
const ensureCheckoutScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * Runs Razorpay checkout for an existing order. The order is only ever marked paid by the server after it
 * verifies Razorpay's signature - there is no client-side "success" fallback.
 */
export const payForOrder = async (orderId: number, brandName = 'AASHA Foundation Marketplace'): Promise<PaymentOutcome> => {
  let pay: PaymentInit;
  try {
    pay = (await axiosClient.post(`/payments/initiate/${orderId}`)).data.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 503) {
      return { status: 'unavailable', message: getErrorMessage(e) };
    }
    return { status: 'failed', message: getErrorMessage(e, 'Could not start the payment.') };
  }

  if (!(await ensureCheckoutScript())) {
    return { status: 'failed', message: 'The Razorpay payment window could not be loaded. Check your connection or ad-blocker and try again.' };
  }

  return new Promise<PaymentOutcome>((resolve) => {
    let settled = false;
    const finish = (outcome: PaymentOutcome) => {
      if (!settled) {
        settled = true;
        resolve(outcome);
      }
    };

    const rzp = new window.Razorpay({
      key: pay.razorpayKeyId,
      amount: pay.amountInPaise,
      currency: pay.currency,
      order_id: pay.razorpayOrderId,
      name: brandName,
      description: `Order ${pay.orderNumber}`,
      prefill: {
        name: pay.customerName,
        email: pay.customerEmail,
        contact: pay.customerPhone || '',
      },
      theme: { color: '#16a34a' },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          await axiosClient.post('/payments/verify', {
            orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          finish({ status: 'paid' });
        } catch (e) {
          finish({
            status: 'failed',
            message: `${getErrorMessage(e, 'Payment verification failed.')} If money was deducted, use "Check payment status" in My Account or contact us with order ${pay.orderNumber}.`,
          });
        }
      },
      modal: {
        ondismiss: () => {
          axiosClient.post('/payments/failure', { orderId, reason: 'Checkout closed by customer' }).catch(() => {});
          finish({ status: 'cancelled' });
        },
      },
    });

    // Razorpay keeps its window open after a failed attempt so the customer can retry; just record it.
    rzp.on('payment.failed', (resp: { error?: { description?: string } }) => {
      axiosClient.post('/payments/failure', { orderId, reason: resp?.error?.description || 'payment.failed' }).catch(() => {});
    });

    rzp.open();
  });
};
