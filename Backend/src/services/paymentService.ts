import mongoose from 'mongoose';
import { Bills, User } from '../models';
import { NotFoundError } from '../errors/notFoundError';

// Assuming PayOS is configured and available
const PayOS = require('@payos/node');

/**
 * Creates a payment link for a given bill.
 * @param bill - The bill object containing all necessary details.
 * @param user - The user object for buyer information.
 * @returns The payment link URL.
 */
export const createPaymentLinkForBill = async (bill: any, user: any) => {
  if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
    console.error('❌ [PaymentService] Missing PayOS environment variables.');
    throw new Error('Payment service is not configured. Please contact the administrator.');
  }

  const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
  );

  // Use a shorter, more concise description for PayOS
  const description = `TT GD #${bill._id.toString().slice(-6)}`; // e.g., "TT GD #d2800a"

  const paymentData = {
    orderCode: parseInt(bill._id.toString().slice(-6), 16),
    amount: bill.totalAmount,
    description: description,
    buyerName: user.fullName || 'Khach hang',
    buyerEmail: user.email || '',
    buyerPhone: user.phone || '',
    returnUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/payment/success?order_id=${bill._id}`,
    cancelUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/payment/cancel?order_id=${bill._id}`,
    items: [{
      name: `Thanh toán cho hóa đơn ${bill.billNumber}`,
      quantity: 1,
      price: bill.totalAmount
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

    // Update the bill with the payment URL
    await Bills.findByIdAndUpdate(bill._id, {
      paymentUrl: paymentLinkResponse.checkoutUrl,
      paymentData: paymentData, // Storing for reference/debugging
    });

    return paymentLinkResponse.checkoutUrl;
  } catch (error: any) {
    console.error('❌ [PaymentService] Error creating PayOS payment link:', error);
    throw new Error(`PayOS service error: ${error.message}`);
  }
}; 