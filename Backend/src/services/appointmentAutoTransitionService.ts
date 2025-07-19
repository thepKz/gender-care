import cron from 'node-cron';
import { Appointments, PaymentTracking } from '../models';
import { releaseSlot } from './doctorScheduleService';

const combineDateTime = (appointmentDate: Date, appointmentTime: string): Date => {
  const date = new Date(appointmentDate);
  const [hours, minutes] = appointmentTime.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const autoTransitionEligibleAppointments = async (): Promise<number> => {
  try {
    const now = new Date();
    console.log('🤖 [AUTO-TRANSITION] Checking appointments at:', now.toISOString());
    
    // Tìm appointments cần chuyển status
    const appointmentsToCheck = await Appointments.find({
      status: 'confirmed',
      appointmentDate: { 
        $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // từ 1 ngày trước
        $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000)  // đến 1 ngày sau
      }
    });
    
    console.log(`🔍 [AUTO-TRANSITION] Found ${appointmentsToCheck.length} confirmed appointments to check`);
    
    let transitionedCount = 0;
    
    for (const appointment of appointmentsToCheck) {
      const appointmentDateTime = combineDateTime(appointment.appointmentDate, appointment.appointmentTime);
      
      // Chuyển status nếu đã đến giờ (hoặc quá giờ)
      if (now >= appointmentDateTime) {
        await Appointments.findByIdAndUpdate(appointment._id, {
          $set: { status: 'consulting' }
        });
        
        console.log(`✅ [AUTO-TRANSITION] ${appointment._id} -> consulting (${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime})`);
        transitionedCount++;
      }
    }
    
    if (transitionedCount > 0) {
      console.log(`🎯 [AUTO-TRANSITION] Successfully transitioned ${transitionedCount} appointments to consulting`);
    }
    
    return transitionedCount;
  } catch (error) {
    console.error('❌ [AUTO-TRANSITION] Error in autoTransitionEligibleAppointments:', error);
    return 0;
  }
};

// NEW: Auto-cancel expired payments after 10 minutes
export const autoCancelExpiredPayments = async (): Promise<number> => {
  try {
    const now = new Date();
    console.log('💳 [AUTO-CANCEL] Checking expired payments at:', now.toISOString());
    
    // Find expired payment trackings
    const expiredPayments = await PaymentTracking.find({
      status: 'pending',
      expiresAt: { $lt: now }, // Expired
      $or: [
        { serviceType: 'appointment' },
        { serviceType: 'consultation' }
      ]
    });
    
    console.log(`🔍 [AUTO-CANCEL] Found ${expiredPayments.length} expired payments to cancel`);
    
    let cancelledCount = 0;
    
    for (const payment of expiredPayments) {
      try {
        // Update payment status to expired
        await PaymentTracking.findByIdAndUpdate(payment._id, {
          $set: { 
            status: 'expired',
            expiresAt: null // Remove TTL after manual expiry
          }
        });
        
        if (payment.serviceType === 'appointment') {
          // Cancel appointment if still pending_payment
          const appointment = await Appointments.findById(payment.recordId);
          if (appointment && appointment.status === 'pending_payment') {
            // 1. Update appointment status and payment status
            await Appointments.findByIdAndUpdate(appointment._id, {
              $set: { 
                status: 'expired',
                paymentStatus: 'expired'
              }
            });
            
            // 2. Release slot if slotId exists
            if (appointment.slotId) {
              try {
                await releaseSlot(appointment.slotId.toString());
                console.log(`✅ [AUTO-CANCEL] Released slot ${appointment.slotId} for appointment ${appointment._id}`);
              } catch (slotError) {
                console.error(`❌ [AUTO-CANCEL] Error releasing slot ${appointment.slotId}:`, slotError);
              }
            } else {
              console.log(`⚠️ [AUTO-CANCEL] Appointment ${appointment._id} has no slotId, skipping slot release`);
            }
            
            console.log(`🚫 [AUTO-CANCEL] Appointment ${appointment._id} cancelled due to payment timeout`);
          }
        } else if (payment.serviceType === 'consultation') {
          // Cancel consultation if still pending_payment
          const consultation = await require('../models/DoctorQA').default.findById(payment.recordId);
          if (consultation && consultation.status === 'pending_payment') {
            await consultation.updateOne({ status: 'cancelled' });
            console.log(`🚫 [AUTO-CANCEL] Consultation ${consultation._id} cancelled due to payment timeout`);
          }
        }
        
        cancelledCount++;
        console.log(`✅ [AUTO-CANCEL] Payment ${payment._id} (${payment.serviceType}) expired and cancelled`);
        
      } catch (error) {
        console.error(`❌ [AUTO-CANCEL] Error cancelling payment ${payment._id}:`, error);
      }
    }
    
    // ✅ NEW: Also check appointments without PaymentTracking (created but not paid)
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago
    
    const expiredAppointments = await Appointments.find({
      status: 'pending_payment',
      createdAt: { $lt: tenMinutesAgo }, // Created more than 10 minutes ago
      $or: [
        { paymentTrackingId: null },
        { paymentTrackingId: { $exists: false } }
      ]
    });
    
    console.log(`🔍 [AUTO-CANCEL] Found ${expiredAppointments.length} expired appointments without PaymentTracking to cancel`);
    
    for (const appointment of expiredAppointments) {
      try {
        // 1. Update appointment status and payment status
        await Appointments.findByIdAndUpdate(appointment._id, {
          $set: { 
            status: 'expired',
            paymentStatus: 'expired'
          }
        });
        
        // 2. Release slot if slotId exists
        if (appointment.slotId) {
          try {
            await releaseSlot(appointment.slotId.toString());
            console.log(`✅ [AUTO-CANCEL] Released slot ${appointment.slotId} for appointment ${appointment._id} (no PaymentTracking)`);
          } catch (slotError) {
            console.error(`❌ [AUTO-CANCEL] Error releasing slot ${appointment.slotId}:`, slotError);
          }
        } else {
          console.log(`⚠️ [AUTO-CANCEL] Appointment ${appointment._id} has no slotId, skipping slot release`);
        }
        
        console.log(`🚫 [AUTO-CANCEL] Appointment ${appointment._id} cancelled due to timeout (no PaymentTracking)`);
        cancelledCount++;
        
      } catch (error) {
        console.error(`❌ [AUTO-CANCEL] Error cancelling appointment ${appointment._id}:`, error);
      }
    }
    
    if (cancelledCount > 0) {
      console.log(`🎯 [AUTO-CANCEL] Successfully cancelled ${cancelledCount} expired payments/appointments`);
    }
    
    return cancelledCount;
    
  } catch (error) {
    console.error('❌ [AUTO-CANCEL] Error in autoCancelExpiredPayments:', error);
    return 0;
  }
};

// Combined service runner
export const runAutomatedServices = async (): Promise<void> => {
  try {
    console.log('🔄 [AUTOMATED-SERVICES] Running all automated services...');
    
    const [transitionedAppointments, cancelledPayments] = await Promise.all([
      autoTransitionEligibleAppointments(),
      autoCancelExpiredPayments()
    ]);
    
    console.log(`✅ [AUTOMATED-SERVICES] Completed: ${transitionedAppointments} transitions, ${cancelledPayments} cancellations`);
    
  } catch (error) {
    console.error('❌ [AUTOMATED-SERVICES] Error running automated services:', error);
  }
};

// Start cron job - chạy mỗi 5 phút
export const startAutoTransitionService = () => {
  console.log('🤖 [AUTO-SERVICES] Starting automated services...');
  
  // Chạy ngay lần đầu
  runAutomatedServices().then(() => {
    console.log(`🚀 [AUTO-SERVICES] Initial run completed`);
  });
  
  // Schedule cron job - mỗi 5 phút
  cron.schedule('*/5 * * * *', async () => {
    try {
      await runAutomatedServices();
    } catch (error) {
      console.error('❌ [AUTO-SERVICES] Scheduled run error:', error);
    }
  });
  
  console.log('✅ [AUTO-SERVICES] All automated services started - running every 5 minutes');
}; 