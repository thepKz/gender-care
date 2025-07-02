import mongoose from 'mongoose';
import PaymentTracking from '../models/PaymentTracking';
import { User } from '../models';
import { NotFoundError } from '../errors/notFoundError';

// Assuming PayOS is configured and available
const PayOS = require('@payos/node');

/**
 * Creates a payment link for a given PaymentTracking record.
 * @param payment - The PaymentTracking object containing all necessary details.
 * @param user - The user object for buyer information.
 * @returns The payment link URL.
 */
export const createPaymentLinkForPayment = async (payment: any, user: any) => {
  if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
    console.error('❌ [PaymentService] Missing PayOS environment variables.');
    throw new Error('Payment service is not configured. Please contact the administrator.');
  }

  const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
  );

  // Create a short description for PayOS (max 25 chars)
  let shortDescription = payment.description;
  if (shortDescription.length > 25) {
    shortDescription = payment.billNumber;
  }

  const paymentData = {
    orderCode: payment.orderCode,
    amount: payment.totalAmount,
    description: shortDescription,
    buyerName: user.fullName || 'Khach hang',
    buyerEmail: user.email || '',
    buyerPhone: user.phone || '',
    returnUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/payment/success?payment_id=${payment._id}`,
    cancelUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/payment/cancel?payment_id=${payment._id}`,
    items: [{
      name: payment.description, // Use full description for item name
      quantity: 1,
      price: payment.totalAmount
    }]
  };

  console.log('🔍 [PaymentService] Creating PayOS payment link with data:', JSON.stringify(paymentData, null, 2));

  try {
    const paymentLinkResponse = await payos.createPaymentLink(paymentData);
    console.log('✅ [PaymentService] PayOS response:', paymentLinkResponse);

    if (!paymentLinkResponse || !paymentLinkResponse.checkoutUrl) {
      console.error('❌ [PaymentService] PayOS returned an invalid response:', paymentLinkResponse);
      throw new Error('Failed to create payment link from payment provider.');
    }

    // Update the PaymentTracking with the payment URL
    await PaymentTracking.findByIdAndUpdate(payment._id, {
      paymentUrl: paymentLinkResponse.checkoutUrl,
      paymentData: paymentData, // Storing for reference/debugging
    });

    return paymentLinkResponse.checkoutUrl;
  } catch (error: any) {
    console.error('❌ [PaymentService] Error creating PayOS payment link:', error);
    throw new Error(`PayOS service error: ${error.message}`);
  }
};

/**
 * ❌ DEPRECATED: Use createPaymentLinkForPayment instead
 * @deprecated Bills model has been replaced by PaymentTracking
 */
export const createPaymentLinkForBill = async (bill: any, user: any) => {
  throw new Error('Bills model is deprecated. Use createPaymentLinkForPayment with PaymentTracking instead.');
}; 