import cron from 'node-cron';
import { Appointments } from '../models';

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

// Start cron job - chạy mỗi 5 phút
export const startAutoTransitionService = () => {
  console.log('🤖 [AUTO-TRANSITION] Starting service...');
  
  // Chạy ngay lần đầu
  autoTransitionEligibleAppointments().then(count => {
    console.log(`🚀 [AUTO-TRANSITION] Initial run completed - transitioned ${count} appointments`);
  });
  
  // Schedule cron job - mỗi 5 phút
  cron.schedule('*/5 * * * *', async () => {
    try {
      const count = await autoTransitionEligibleAppointments();
      if (count > 0) {
        console.log(`🔄 [AUTO-TRANSITION] Scheduled run - transitioned ${count} appointments`);
      }
    } catch (error) {
      console.error('❌ [AUTO-TRANSITION] Scheduled run error:', error);
    }
  });
  
  console.log('✅ [AUTO-TRANSITION] Service started - checking every 5 minutes');
}; 