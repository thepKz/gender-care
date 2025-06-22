import PayOS from '@payos/node';
import crypto from 'crypto';

// PayOS configuration interface
interface PayOSConfig {
  clientId: string;
  apiKey: string;
  checksumKey: string;
}

// Payment request interface
interface CreatePaymentRequest {
  appointmentId: string;
  amount: number;
  description: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl: string;
  cancelUrl: string;
}

// Payment link response interface
interface PaymentLinkResponse {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
}

// Webhook data interface
interface WebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
}

class PayOSService {
  private payOS: PayOS | null = null;
  private isConfigured = false;

  constructor() {
    this.initializePayOS();
  }

  /**
   * Initialize PayOS với environment variables
   */
  private initializePayOS(): void {
    try {
      const config: PayOSConfig = {
        clientId: process.env.PAYOS_CLIENT_ID || '',
        apiKey: process.env.PAYOS_API_KEY || '',
        checksumKey: process.env.PAYOS_CHECKSUM_KEY || ''
      };

      // Debug log environment variables
      console.log('🔍 PayOS Environment Check:', {
        clientId: config.clientId ? `${config.clientId.substring(0, 4)}***` : 'MISSING',
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 4)}***` : 'MISSING',
        checksumKey: config.checksumKey ? `${config.checksumKey.substring(0, 4)}***` : 'MISSING'
      });

      // Validate configuration
      if (!config.clientId || !config.apiKey || !config.checksumKey) {
        console.warn('⚠️ PayOS credentials not configured. Payment features will be disabled.');
        console.warn('Missing credentials:', {
          clientId: !config.clientId,
          apiKey: !config.apiKey,
          checksumKey: !config.checksumKey
        });
        this.isConfigured = false;
        return;
      }

      this.payOS = new PayOS(config.clientId, config.apiKey, config.checksumKey);
      this.isConfigured = true;
      console.log('PayOS service initialized successfully');

    } catch (error) {
      console.error('PayOS initialization failed:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Kiểm tra PayOS có được cấu hình không
   */
  public isPayOSConfigured(): boolean {
    return this.isConfigured && this.payOS !== null;
  }

  /**
   * Tạo payment link cho appointment
   */
  public async createPaymentLink(request: CreatePaymentRequest): Promise<PaymentLinkResponse> {
    if (!this.isPayOSConfigured()) {
      throw new Error('PayOS chưa được cấu hình. Vui lòng kiểm tra environment variables.');
    }

    try {
      // Validate required fields
      if (!request.amount || request.amount <= 0) {
        throw new Error('Amount phải lớn hơn 0');
      }

      if (!request.description || request.description.trim() === '') {
        throw new Error('Description không được để trống');
      }

      if (!request.returnUrl || !request.cancelUrl) {
        throw new Error('Return URL và Cancel URL là bắt buộc');
      }

      // Generate unique order code
      const orderCode = this.generateOrderCode(request.appointmentId);

      // Ensure description is within PayOS limits (max 25 characters)
      const description = request.description.length > 25
        ? request.description.substring(0, 22) + '...'
        : request.description;

      const paymentData = {
        orderCode: orderCode,
        amount: request.amount,
        description: description,
        items: [
          {
            name: description,
            quantity: 1,
            price: request.amount
          }
        ],
        returnUrl: request.returnUrl,
        cancelUrl: request.cancelUrl,
        buyerName: request.customerName || 'Khách hàng',
        buyerEmail: request.customerEmail || '',
        buyerPhone: request.customerPhone || '',
        buyerAddress: '',
        expiredAt: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes expiry
      };

      console.log('Creating PayOS payment link with data:', {
        orderCode: paymentData.orderCode,
        amount: paymentData.amount,
        description: paymentData.description,
        appointmentId: request.appointmentId,
        returnUrl: paymentData.returnUrl,
        cancelUrl: paymentData.cancelUrl
      });

      const response = await this.payOS!.createPaymentLink(paymentData);

      console.log('PayOS payment link created successfully:', {
        orderCode: response.orderCode,
        checkoutUrl: response.checkoutUrl,
        paymentLinkId: response.paymentLinkId
      });

      return response;

    } catch (error: any) {
      console.error('Error creating PayOS payment link:', error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        requestData: {
          appointmentId: request.appointmentId,
          amount: request.amount,
          description: request.description,
          returnUrl: request.returnUrl,
          cancelUrl: request.cancelUrl
        }
      });
      throw new Error(`Không thể tạo link thanh toán: ${error.message || 'Lỗi không xác định'}`);
    }
  }

  /**
   * Verify webhook signature
   */
  public verifyWebhookSignature(
    rawBody: string,
    signature: string
  ): boolean {
    if (!this.isPayOSConfigured()) {
      console.error('PayOS not configured for signature verification');
      return false;
    }

    try {
      const checksumKey = process.env.PAYOS_CHECKSUM_KEY!;
      const computedSignature = crypto
        .createHmac('sha256', checksumKey)
        .update(rawBody)
        .digest('hex');

      const isValid = computedSignature === signature;

      console.log('Webhook signature verification:', {
        computed: computedSignature.substring(0, 10) + '...',
        received: signature.substring(0, 10) + '...',
        isValid
      });

      return isValid;

    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Xử lý webhook data từ PayOS
   */
  public async processWebhook(webhookData: WebhookData): Promise<{
    appointmentId: string;
    isSuccessful: boolean;
    transactionInfo: any;
  }> {
    try {
      console.log('Processing PayOS webhook:', {
        orderCode: webhookData.orderCode,
        amount: webhookData.amount,
        code: webhookData.code,
        desc: webhookData.desc
      });

      // Extract appointment ID từ order code
      const appointmentId = this.extractAppointmentIdFromOrderCode(webhookData.orderCode);

      if (!appointmentId) {
        throw new Error(`Không thể extract appointment ID từ order code: ${webhookData.orderCode}`);
      }

      // Check payment status
      const isSuccessful = webhookData.code === '00'; // PayOS success code

      const transactionInfo = {
        orderCode: webhookData.orderCode,
        amount: webhookData.amount,
        description: webhookData.description,
        reference: webhookData.reference,
        transactionDateTime: webhookData.transactionDateTime,
        paymentLinkId: webhookData.paymentLinkId,
        counterAccountInfo: {
          bankId: webhookData.counterAccountBankId,
          bankName: webhookData.counterAccountBankName,
          accountName: webhookData.counterAccountName,
          accountNumber: webhookData.counterAccountNumber
        },
        virtualAccount: {
          name: webhookData.virtualAccountName,
          number: webhookData.virtualAccountNumber
        }
      };

      console.log(`${isSuccessful ? '✅' : '❌'} Payment ${isSuccessful ? 'successful' : 'failed'} for appointment ${appointmentId}`);

      return {
        appointmentId,
        isSuccessful,
        transactionInfo
      };

    } catch (error) {
      console.error('Error processing PayOS webhook:', error);
      throw error;
    }
  }

  /**
   * Query payment status từ PayOS
   */
  public async getPaymentStatus(orderCode: number): Promise<any> {
    if (!this.isPayOSConfigured()) {
      throw new Error('PayOS chưa được cấu hình');
    }

    try {
      const paymentInfo = await this.payOS!.getPaymentLinkInformation(orderCode);
      console.log('PayOS payment status query result:', {
        orderCode,
        status: paymentInfo.status,
        amount: paymentInfo.amount
      });

      return paymentInfo;

    } catch (error) {
      console.error('Error querying PayOS payment status:', error);
      throw error;
    }
  }

  /**
   * Cancel payment link
   */
  public async cancelPaymentLink(orderCode: number, reason?: string): Promise<any> {
    if (!this.isPayOSConfigured()) {
      throw new Error('PayOS chưa được cấu hình');
    }

    try {
      const result = await this.payOS!.cancelPaymentLink(orderCode, reason);
      console.log('PayOS payment link cancelled:', { orderCode, reason });
      return result;

    } catch (error) {
      console.error('Error cancelling PayOS payment link:', error);
      throw error;
    }
  }

  /**
   * Generate unique order code từ appointment ID
   */
  private generateOrderCode(appointmentId: string): number {
    // Tạo order code unique từ timestamp và appointment ID hash
    const timestamp = Math.floor(Date.now() / 1000);
    const hash = crypto.createHash('md5').update(appointmentId).digest('hex');
    const hashNumber = parseInt(hash.substring(0, 6), 16);

    // Combine timestamp và hash để tạo order code unique
    // Giới hạn trong range 1-999999999 (PayOS requirement)
    const orderCode = (timestamp % 100000) * 10000 + (hashNumber % 10000);

    console.log('🔢 Generated order code:', {
      appointmentId,
      orderCode,
      timestamp,
      hashNumber
    });

    return orderCode;
  }

  /**
   * Extract appointment ID từ order code
   */
  private extractAppointmentIdFromOrderCode(orderCode: number): string | null {
    // Lưu mapping orderCode -> appointmentId vào database hoặc cache
    // Hiện tại return null vì cần implement mapping storage

    console.log('🔍 Extracting appointment ID from order code:', orderCode);

    // TODO: Implement proper mapping storage
    // For now, this will be handled by the payment creation process
    // that stores the orderCode -> appointmentId mapping

    return null;
  }
}

// Export singleton instance
export default new PayOSService(); 