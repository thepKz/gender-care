import { Response } from 'express';
import Appointments from '../models/Appointments';
import Doctor from '../models/Doctor';
import Service from '../models/Service';
import { AuthRequest } from '../types';

// GET /dashboard/management - Dashboard data for managers and admins
export const getManagementDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    if (!userRole || !['admin', 'manager'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Admin role required.'
      });
    }

    // Get current date info
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries for better performance
    const [
      totalDoctors,
      totalServices,
      todayAppointments,
      monthlyRevenue,
      recentAppointments,
      todayAppointmentsList
    ] = await Promise.all([
      // Total doctors
      Doctor.countDocuments({ isDeleted: false }),
      
      // Total services
      Service.countDocuments({ isDeleted: { $ne: 1 } }),
      
      // Today's appointments count
      Appointments.countDocuments({
        appointmentDate: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $in: ['pending', 'confirmed', 'completed'] }
      }),
      
      // Monthly revenue (simplified - appointments don't have totalAmount field)
      Promise.resolve(0), // Will implement proper revenue calculation later
      
      // Recent appointments for activity feed
      Appointments.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })
      .populate('createdByUserId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10),
      
      // Today's appointments list
      Appointments.find({
        appointmentDate: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $in: ['pending', 'confirmed'] }
      })
      .populate('createdByUserId', 'fullName phone')
      .sort({ appointmentDate: 1 })
      .limit(10)
    ]);

    // Format stats
    const stats = {
      totalDoctors,
      totalServices,
      todayAppointments,
      monthlyRevenue: monthlyRevenue || 0
    };

    // Format recent activities
    const recentActivities = recentAppointments.map((appointment: any) => ({
      id: appointment._id,
      type: 'appointment',
      title: `Lịch hẹn mới từ ${appointment.createdByUserId?.fullName || 'N/A'}`,
      description: `Ngày: ${appointment.appointmentDate.toLocaleDateString('vi-VN')} - ${appointment.appointmentTime}`,
      time: appointment.createdAt,
      icon: 'CalendarOutlined',
      color: '#1890ff'
    }));

    // Format today's appointments
    const todayAppointmentsFormatted = todayAppointmentsList.map((appointment: any) => ({
      id: appointment._id,
      patientName: appointment.createdByUserId?.fullName || 'N/A',
      doctorName: 'Chưa phân công',
      time: appointment.appointmentTime,
      status: appointment.status,
      phone: appointment.createdByUserId?.phone || 'N/A'
    }));

    res.json({
      success: true,
      data: {
        stats,
        recentActivities,
        todayAppointments: todayAppointmentsFormatted
      }
    });

  } catch (error) {
    console.error('Error fetching management dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /dashboard/operational - Dashboard data for staff and doctors
export const getOperationalDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?._id;
    
    if (!userRole || !['staff', 'doctor'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff or Doctor role required.'
      });
    }

    // Get current date info
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let query: any = {
      appointmentDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    };

    // If doctor, filter by their appointments (would need doctor linking logic)
    if (userRole === 'doctor') {
      // For now, show all appointments since we don't have doctor linking
    }

    const [
      todayAppointments,
      pendingAppointments,
      completedToday,
      myAppointments
    ] = await Promise.all([
      // Today's total appointments
      Appointments.countDocuments({
        ...query,
        status: { $in: ['pending', 'confirmed', 'completed'] }
      }),
      
      // Pending appointments
      Appointments.countDocuments({
        ...query,
        status: 'pending'
      }),
      
      // Completed today
      Appointments.countDocuments({
        ...query,
        status: 'completed'
      }),
      
      // Appointments list
      Appointments.find(query)
        .populate('createdByUserId', 'fullName phone')
        .sort({ appointmentDate: 1 })
        .limit(10)
    ]);

    const stats = {
      todayAppointments,
      pendingAppointments,
      completedToday,
      efficiency: todayAppointments > 0 ? Math.round((completedToday / todayAppointments) * 100) : 0
    };

    const appointmentsList = myAppointments.map((appointment: any) => ({
      id: appointment._id,
      patientName: appointment.createdByUserId?.fullName || 'N/A',
      doctorName: 'Chưa phân công',
      time: appointment.appointmentTime,
      status: appointment.status,
      phone: appointment.createdByUserId?.phone || 'N/A'
    }));

    res.json({
      success: true,
      data: {
        stats,
        appointments: appointmentsList,
        recentActivities: [] // Can be expanded later
      }
    });

  } catch (error) {
    console.error('Error fetching operational dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 