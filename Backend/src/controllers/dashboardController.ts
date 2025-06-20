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

    console.log('🔍 Dashboard: Starting management dashboard query...');
    console.log('🔍 User role:', userRole);

    // Get current date info
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Debug database connection first
    console.log('🔍 Testing database connections...');
    
    // Test queries individually for better debugging
    try {
      console.log('🔍 Querying doctors...');
      // ❌ Old query that fails: const totalDoctors = await Doctor.countDocuments({ isDeleted: false });
      // ✅ New query that works - count active doctors (not deleted OR field doesn't exist)
      const totalDoctors = await Doctor.countDocuments({
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } },
          { isDeleted: null }
        ]
      });
      console.log('✅ Total doctors found:', totalDoctors);
      
      // Debug: Let's also check all doctors (including deleted)
      const allDoctors = await Doctor.countDocuments({});
      console.log('📊 All doctors in DB (including deleted):', allDoctors);
      
      // 🆕 Enhanced debugging: Test different isDeleted scenarios
      const doctorsWithoutDeletedField = await Doctor.countDocuments({ isDeleted: { $exists: false } });
      console.log('🔍 Doctors without isDeleted field:', doctorsWithoutDeletedField);
      
      const doctorsDeletedTrue = await Doctor.countDocuments({ isDeleted: true });
      console.log('🔍 Doctors with isDeleted=true:', doctorsDeletedTrue);
      
      const doctorsDeletedNull = await Doctor.countDocuments({ isDeleted: null });
      console.log('🔍 Doctors with isDeleted=null:', doctorsDeletedNull);
      
      const doctorsDeletedUndefined = await Doctor.countDocuments({ isDeleted: undefined });
      console.log('🔍 Doctors with isDeleted=undefined:', doctorsDeletedUndefined);
      
      // 🆕 Test alternative query - not deleted OR field doesn't exist
      const activeDoctors = await Doctor.countDocuments({
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } },
          { isDeleted: null }
        ]
      });
      console.log('🎯 Active doctors (alternative query):', activeDoctors);
      
      // 🆕 Get sample doctor to inspect structure
      const sampleDoctor = await Doctor.findOne().lean();
      console.log('🔍 Sample doctor structure:', JSON.stringify(sampleDoctor, null, 2));
      
      console.log('🔍 Querying services...');
      const totalServices = await Service.countDocuments({ isDeleted: 0 });
      console.log('✅ Total services found:', totalServices);
      
      console.log('🔍 Querying today appointments...');
      const todayAppointments = await Appointments.countDocuments({
        appointmentDate: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $in: ['pending', 'confirmed', 'completed'] }
      });
      console.log('✅ Today appointments found:', todayAppointments);
      
      // Debug: Check total appointments in DB
      const totalAppointments = await Appointments.countDocuments({});
      console.log('📊 Total appointments in DB:', totalAppointments);
      
      console.log('🔍 Querying recent appointments...');
      const recentAppointments = await Appointments.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
      .populate('createdByUserId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10);
      console.log('✅ Recent appointments found:', recentAppointments.length);
      
      console.log('🔍 Querying today appointments list...');
      const todayAppointmentsList = await Appointments.find({
        appointmentDate: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $in: ['pending', 'confirmed'] }
      })
      .populate('createdByUserId', 'fullName phone')
      .sort({ appointmentDate: 1 })
      .limit(10);
      console.log('✅ Today appointments list found:', todayAppointmentsList.length);

      // Format stats
      const stats = {
        totalDoctors,
        totalServices,
        todayAppointments,
        monthlyRevenue: 0 // Will implement proper revenue calculation later
      };

      console.log('📊 Final stats:', stats);

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

      const result = {
        stats,
        recentActivities,
        todayAppointments: todayAppointmentsFormatted
      };

      console.log('✅ Dashboard data prepared successfully');
      
      res.json({
        success: true,
        data: result
      });

    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      throw dbError;
    }

  } catch (error) {
    console.error('❌ Error fetching management dashboard:', error);
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