import React from 'react';
import { Button, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { UnifiedAppointment } from '../../../types/appointment';

interface AppointmentCancelButtonProps {
  appointment: UnifiedAppointment;
  onCancelClick: (appointment: UnifiedAppointment) => void;
}

const AppointmentCancelButton: React.FC<AppointmentCancelButtonProps> = ({ 
  appointment, 
  onCancelClick 
}) => {
  
  // ✅ Logic 72h rule - được copy từ AppointmentManagement.tsx
  const canCancelAppointment = (appointmentDate: string, appointmentTime: string, status: string): boolean => {
    try {
      // ✅ THEO DOCS & USER REQUIREMENT: Allow cancel for paid, scheduled, consulting
      // ✅ EXPANDED: Include all possible status values để debug issue  
      if (!['paid', 'scheduled', 'consulting', 'confirmed', 'pending_payment'].includes(status)) {
        console.log('Cancel not allowed for status:', status);
        return false;
      }
      
      const now = new Date();
      
      // Parse appointment datetime
      const appointmentDateTime = new Date(`${appointmentDate} ${appointmentTime}`);
      
      // Check if appointment datetime is valid
      if (isNaN(appointmentDateTime.getTime())) {
        console.warn('Invalid appointment datetime:', { appointmentDate, appointmentTime });
        return false;
      }
      
      // Calculate deadline (current time + 72 hours)
      const deadline = new Date(now.getTime() + (72 * 60 * 60 * 1000));
      
      // Allow cancel only if deadline <= appointment time
      const canCancel = deadline <= appointmentDateTime;
      
      console.log('Cancel check:', {
        now: now.toISOString(),
        deadline: deadline.toISOString(), 
        appointmentDateTime: appointmentDateTime.toISOString(),
        status,
        canCancel,
        hoursUntilAppointment: (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      });
      
      return canCancel;
    } catch (error) {
      console.error('Error checking cancel deadline:', error);
      return false; // Không cho hủy nếu có lỗi
    }
  };

  // Check if can cancel this appointment
  const canCancel = canCancelAppointment(
    appointment.appointmentDate, 
    appointment.appointmentTime, 
    appointment.status
  );

  console.log('🎯 [AppointmentCancelButton] Final canCancel result:', {
    appointmentId: appointment._id,
    patientName: appointment.patientName,
    status: appointment.status,
    date: appointment.appointmentDate,
    time: appointment.appointmentTime,
    canCancel
  });

  // Không hiển thị nút nếu không thể cancel
  if (!canCancel) {
    console.log('❌ [AppointmentCancelButton] Not rendering button - canCancel:', canCancel);
    return null;
  }

  // Calculate hours until appointment for more detailed tooltip
  const getHoursUntilAppointment = (): number => {
    try {
      const now = new Date();
      const appointmentDateTime = new Date(`${appointment.appointmentDate} ${appointment.appointmentTime}`);
      return Math.round((appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    } catch {
      return 0;
    }
  };

  const hoursUntil = getHoursUntilAppointment();

  return (
    <Tooltip title={`Hủy lịch hẹn (còn ${hoursUntil}h - chỉ có thể hủy trước 72h)`}>
      <Button 
        type="text" 
        icon={<DeleteOutlined />} 
        size="small"
        danger
        onClick={() => onCancelClick(appointment)}
      >
        Hủy lịch hẹn
      </Button>
    </Tooltip>
  );
};

export default AppointmentCancelButton; 