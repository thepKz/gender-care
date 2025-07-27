import { Empty, Input, message, Modal, Rate, Select, Timeline } from "antd";
import SimpleDatePicker from "../../components/ui/SimpleDatePicker";
import SimpleDateRangePicker from "../../components/ui/SimpleDateRangePicker";
import axios from "axios";
import type { Dayjs } from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect as useScrollEffect } from "react";

// Khai báo biến toàn cục để theo dõi trạng thái cảnh báo
declare global {
  interface Window {
    paymentWarningShown?: boolean;
  }
}
import {
  Activity,
  Calendar,
  Clock,
  CloseCircle,
  DocumentText,
  Eye,
  Heart,
  Location,
  MonitorMobbile,
  People,
  Refresh,
  SearchNormal1,
  Star,
  TickCircle,
  Timer,
  Trash,
  User,
} from "iconsax-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { consultationApi } from "../../api";
import axiosInstance from "../../api/axiosConfig";
import { appointmentApi } from "../../api/endpoints";
import ModernButton from "../../components/ui/ModernButton";
import ModernCard from "../../components/ui/ModernCard";
import { useAuth } from "../../hooks/useAuth";
import { useSystemConfig } from "../../hooks/useSystemConfig";
import paymentApi from "../../api/endpoints/payment";

const { Search } = Input;
const { Option } = Select;
// Removed DatePicker import

interface Appointment {
  id: string;
  type?: "appointment" | "consultation"; // ➕ Thêm để phân biệt loại
  serviceId: string;
  serviceName: string;
  packageName?: string;
  doctorName?: string;
  doctorAvatar?: string;
  patientName?: string; // ➕ Thêm cho consultations
  appointmentDate: string;
  appointmentTime: string;
  appointmentSlot?: string; // ➕ Thêm cho consultations
  typeLocation: string; // Backend có thể trả về bất kỳ string nào
  status: string; // Backend có thể trả về bất kỳ status nào
  price: number;
  createdAt: string;
  description?: string;
  notes?: string;
  address?: string;
  canCancel: boolean;
  canReschedule: boolean;
  rating?: number;
  feedback?: string;
  // ➕ Consultation-specific fields
  phone?: string;
  age?: number;
  gender?: string;
  question?: string;
  doctorNotes?: string;
}

const BookingHistory: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { getReservationTimeout } = useSystemConfig();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const fetchAppointments = async (skipLoading = false) => {
    // Kiểm tra authentication trước khi gọi API
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    // Chỉ set loading nếu không phải là background refresh
    if (!skipLoading) {
      setLoading(true);
    }
    try {
      // Phân quyền: Admin/Staff/Manager có thể xem tất cả, Customer chỉ xem của mình
      const isManagementRole = ["admin", "staff", "manager"].includes(user.role);

      let response;
      if (isManagementRole) {
        // Lấy tất cả appointments không phân trang
        response = await appointmentApi.getAllAppointments({ limit: 100 });
      } else {
        // ✅ Customer sử dụng API mới để lấy cả appointments + consultations
        response = await appointmentApi.getUserBookingHistory({ limit: 50 });
      }

      // Handle different response structures for different APIs
      let appointmentsData = [];

      if (isManagementRole) {
        // appointmentApi.getAllAppointments() response structure: { success: true, data: { appointments, pagination } }
        appointmentsData = response.data?.appointments || [];
      } else {
        // ✅ API mới trả về structure khác
        appointmentsData = response.data?.data?.bookings || response.data?.bookings || [];
      }

      if (appointmentsData && appointmentsData.length >= 0) {
        const formattedAppointments = appointmentsData.map((apt: any) => ({
          id: apt._id,
          type: apt.type || "appointment", // ✅ Support API mới
          serviceId: apt.serviceId || apt.serviceId?._id || "",
          serviceName:
            apt.serviceName ||
            apt.serviceId?.serviceName ||
            apt.packageId?.name ||
            "Dịch vụ khám",
          packageName: apt.packageName || apt.packageId?.name,
          doctorName:
            apt.doctorName ||
            apt.doctorInfo?.fullName ||
            apt.doctorId?.userId?.fullName ||
            apt.doctorId?.fullName ||
            "Chưa chỉ định bác sĩ",
          doctorAvatar:
            apt.doctorAvatar ||
            apt.doctorInfo?.avatar ||
            apt.doctorId?.userId?.avatar ||
            apt.doctorId?.avatar ||
            "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150",
          patientName: apt.patientName || apt.fullName, // ✅ Hỗ trợ consultations
          appointmentDate: apt.appointmentDate
            ? new Date(apt.appointmentDate).toISOString().split("T")[0]
            : "",
          appointmentTime: apt.appointmentTime || apt.appointmentSlot || "",
          appointmentSlot: apt.appointmentSlot,
          typeLocation: apt.typeLocation || "clinic",
          status: apt.status,
          price: apt.price || apt.packageId?.price || apt.serviceId?.price || 0,
          createdAt: new Date(apt.createdAt).toISOString(),
          description: apt.description || apt.question, // ✅ question cho consultations
          notes: apt.notes,
          address: apt.address,
          canCancel:
            apt.canCancel ||
            (["pending", "pending_payment", "confirmed"].includes(apt.status) &&
              apt.status !== "expired"),
          canReschedule:
            apt.canReschedule ||
            (["pending", "confirmed"].includes(apt.status) && apt.status !== "expired"),
          rating: apt.rating,
          feedback: apt.feedback,
          // ✅ Consultation-specific fields
          phone: apt.phone,
          age: apt.age,
          gender: apt.gender,
          question: apt.question,
          doctorNotes: apt.doctorNotes,
        }));



        setAppointments(formattedAppointments);
        setFilteredAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error("❌ [Debug] Error fetching appointments:", error);

      // 🔥 HIỂN THỊ LỖI CHI TIẾT THAY VÌ FALLBACK TO MOCK DATA
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          message.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          navigate("/login");
          return;
        } else if (error.response?.status === 403) {
          message.error("Bạn không có quyền truy cập dữ liệu này.");
        } else if (error.response?.status === 404) {
          message.error("API endpoint không tồn tại.");
        } else if (error.response?.status >= 500) {
          message.error("Lỗi server. Vui lòng thử lại sau.");
        } else {
          message.error(`Lỗi API: ${error.response?.data?.message || error.message}`);
        }
      } else {
        message.error("Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng.");
      }

      // Set empty array when API error occurs
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to top when component mounts
  useScrollEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log("🔍 [Debug] User not authenticated, redirecting to login...");
      navigate("/login");
      return;
    }

    // Initial fetch
    fetchAppointments();
  }, [isAuthenticated, user, navigate]); // Bỏ appointments khỏi dependency để tránh vòng lặp

  // Separate useEffect for auto-polling pending payments
  useEffect(() => {
    if (!appointments.length) return;

    const autoCheckPayments = async () => {
      try {
        // Chỉ check nếu có appointments đang pending_payment
        const pendingPayments = appointments.filter((apt) => apt.status === "pending_payment");

        if (pendingPayments.length > 0) {
          console.log(
            "🔄 [Auto-Poll] Found pending payments, checking...",
            pendingPayments.map((apt) => apt.id),
          );

          for (const appointment of pendingPayments) {
            try {
              // Check payment status qua PayOS API
              const paymentStatusResponse = await axiosInstance.get(
                `/payments/appointments/${appointment.id}/status`,
              );

              if (paymentStatusResponse.data?.success && paymentStatusResponse.data?.data) {
                const paymentData = paymentStatusResponse.data.data;
                console.log(
                  "💳 [Auto-Poll] Payment status for",
                  appointment.id,
                  ":",
                  paymentData.status,
                );

                // Nếu payment đã thành công nhưng appointment vẫn pending_payment
                if (
                  paymentData.status === "success" &&
                  paymentData.appointmentStatus === "confirmed"
                ) {
                  console.log(
                    "✅ [Auto-Poll] Payment confirmed by backend, refreshing appointments...",
                  );
                  // Refresh appointments để lấy data mới (skip loading spinner)
                  fetchAppointments(true);
                  return; // Exit early after refresh
                }

                // Kiểm tra thời gian tạo lịch hẹn để cảnh báo sắp hết hạn
                const createdTime = new Date(appointment.createdAt).getTime();
                const currentTime = new Date().getTime();
                const elapsedMinutes = Math.floor((currentTime - createdTime) / (1000 * 60));
                const timeoutMinutes = getReservationTimeout();
                const remainingMinutes = Math.max(0, timeoutMinutes - elapsedMinutes);

                // Nếu còn dưới threshold phút và chưa hiển thị cảnh báo
                const reminderThreshold = 3; // Hardcode 3 phút thay vì dùng getPaymentReminderThreshold
                if (
                  remainingMinutes <= reminderThreshold &&
                  remainingMinutes > 0 &&
                  !window.paymentWarningShown
                ) {
                  message.warning({
                    content: `Lịch hẹn của bạn sẽ tự động hủy sau ${remainingMinutes} phút nếu không thanh toán!`,
                    duration: 10,
                    key: "payment-expiry-warning",
                  });
                  window.paymentWarningShown = true;

                  // Reset cảnh báo sau 1 phút
                  setTimeout(() => {
                    window.paymentWarningShown = false;
                  }, 60000);
                }

                // TỰ ĐỘNG HỦY nếu đã hết thời gian thanh toán
                if (elapsedMinutes >= timeoutMinutes) {
                  console.log(
                    "⏰ [Auto-Poll] Payment time expired for appointment",
                    appointment.id,
                    "auto-cancelling...",
                  );
                  try {
                    // Gọi API hủy cuộc hẹn để trả lại slot
                    await appointmentApi.deleteAppointment(appointment.id);
                    message.error({
                      content: `Cuộc hẹn đã bị hủy tự động do quá thời gian thanh toán (${timeoutMinutes} phút)`,
                      duration: 5,
                      key: "payment-expired-cancel",
                    });
                    // Refresh appointments để lấy status mới (có thể là "expired" hoặc "cancelled")
                    fetchAppointments(true);
                  } catch (cancelError) {
                    console.error(
                      "❌ [Auto-Poll] Error auto-cancelling expired appointment:",
                      cancelError,
                    );
                  }
                }
              }
            } catch (error) {
              console.log(
                "🔍 [Auto-Poll] Error checking payment for",
                appointment.id,
                ":",
                error.message,
              );
            }
          }
        }
      } catch (error) {
        console.log("🔍 [Auto-Poll] Auto-check error:", error.message);
      }
    };

    // Auto-check mỗi 30 giây thay vì 10 giây (ít aggressive hơn)
    const pollInterval = setInterval(autoCheckPayments, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [appointments]); // Separate useEffect cho auto-polling

  // ✅ NEW: Force check payment and assign doctor for stuck appointments
  const handleForceCheck = async (appointment: Appointment) => {
    try {
      console.log("🔧 [ForceCheck] Force checking appointment:", appointment.id);

      const loadingMessage = message.loading("Đang kiểm tra thanh toán và chỉ định bác sĩ...", 0);

      const response = await paymentApi.forceCheckPaymentAndAssignDoctor(appointment.id);

      loadingMessage();

      if (response.success && response.data) {
        const { paymentUpdated, doctorAssigned, doctorName, status, paymentStatus } = response.data;

        let successMessage = "Kiểm tra hoàn tất! ";
        if (paymentUpdated) successMessage += "Thanh toán đã được cập nhật. ";
        if (doctorAssigned) successMessage += `Đã chỉ định bác sĩ: ${doctorName}. `;

        message.success({
          content: successMessage,
          icon: (
            <TickCircle
              size={20}
              className="text-green-500"
            />
          ),
          duration: 5,
        });

        // Update local appointment data
        const updatedAppointments = appointments.map((apt) =>
          apt.id === appointment.id
            ? {
                ...apt,
                status: status,
                doctorName: doctorName || apt.doctorName,
              }
            : apt,
        );
        setAppointments(updatedAppointments);

        // Refresh full data to get latest state
        setTimeout(() => {
          fetchAppointments(true);
        }, 1000);
      } else {
        message.info(response.message || "Kiểm tra hoàn tất, không có thay đổi.");
      }
    } catch (error: any) {
      console.error("❌ [ForceCheck] Error:", error);
      message.error(`Lỗi kiểm tra: ${error.response?.data?.message || error.message}`);
    }
  };

  // Separate useEffect for window focus handler
  useEffect(() => {
    const handleFocus = () => {
      fetchAppointments();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Listen for navigation state to refresh data when coming from payment success
  useEffect(() => {
    const navigationState = location.state?.refreshData;
    const paymentCompleted = location.state?.paymentCompleted;
    if (navigationState || paymentCompleted) {
      console.log("🔄 [BookingHistory] Navigation state detected - refreshing appointments...", {
        refreshData: navigationState,
        paymentCompleted,
        locationState: location.state,
      });

      // Force refresh appointments data (skip loading spinner cho navigation refresh)
      fetchAppointments(true);

      // Clear navigation state after processing to prevent infinite refresh
      if (location.state) {
        console.log("🔄 [BookingHistory] Clearing navigation state to prevent infinite refresh");
        window.history.replaceState({}, "", location.pathname);
      }
    } else {
      console.log("🔄 [BookingHistory] No navigation state detected, normal load");
    }
  }, [location.state]);

  useEffect(() => {
    let filtered = appointments;

    // Filter by search term
    if (searchText) {
      filtered = filtered.filter(
        (apt) =>
          apt.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
          apt.doctorName?.toLowerCase().includes(searchText.toLowerCase()) ||
          apt.packageName?.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Filter by service
    if (serviceFilter !== "all") {
      filtered = filtered.filter((apt) => apt.serviceId === serviceFilter);
    }

    // Filter by date range
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return aptDate >= start && aptDate <= end;
      });
    }

    setFilteredAppointments(filtered);
  }, [searchText, statusFilter, serviceFilter, dateRange, appointments]);

  const statusConfig = {
    pending: { color: "#faad14", text: "Chờ xác nhận", icon: <Timer size={16} /> },
    pending_payment: { color: "#ff7f00", text: "Chờ thanh toán", icon: <Clock size={16} /> },
    confirmed: { color: "#52c41a", text: "Đã xác nhận", icon: <TickCircle size={16} /> },
    completed: { color: "#722ed1", text: "Hoàn thành", icon: <TickCircle size={16} /> },
    cancelled: { color: "#f5222d", text: "Đã hủy lịch", icon: <CloseCircle size={16} /> },
    payment_cancelled: { color: "#ff4d4f", text: "Đã hủy thanh toán", icon: <Trash size={16} /> },
    expired: { color: "#f5222d", text: "Hết hạn", icon: <CloseCircle size={16} /> },
  };

  const locationConfig = {
    online: { icon: <MonitorMobbile size={16} />, text: "Online" },
    Online: { icon: <MonitorMobbile size={16} />, text: "Online" }, // Backend trả về "Online" với O hoa
    clinic: { icon: <Location size={16} />, text: "Phòng khám" },
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const handleViewDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  const handleCancel = async (appointment: Appointment) => {
    try {
      // Hiển thị loading message
      const loadingMessage = message.loading("Đang hủy lịch hẹn...", 0);

      // Gọi API hủy lịch - API mới đã được cập nhật để tự động trả lại slot trống
      const response = await appointmentApi.deleteAppointment(appointment.id);

      // Đóng loading message
      loadingMessage();

      if (response.success) {
        message.success({
          content: "Hủy cuộc hẹn thành công! Lịch đã được trả lại.",
          icon: (
            <TickCircle
              size={20}
              className="text-green-500"
            />
          ),
          duration: 5,
        });

        // Cập nhật UI - đánh dấu lịch hẹn đã hủy
        const updatedAppointments = appointments.map((apt) =>
          apt.id === appointment.id
            ? { ...apt, status: "cancelled" as const, canCancel: false, canReschedule: false }
            : apt,
        );
        setAppointments(updatedAppointments);
        setFilteredAppointments(
          filteredAppointments.map((apt) =>
            apt.id === appointment.id
              ? { ...apt, status: "cancelled" as const, canCancel: false, canReschedule: false }
              : apt,
          ),
        );
      } else {
        // Xử lý trường hợp API trả về thành công nhưng không có success flag
        message.success({
          content: "Hủy cuộc hẹn thành công! Lịch đã được trả lại.",
          icon: (
            <TickCircle
              size={20}
              className="text-green-500"
            />
          ),
          duration: 5,
        });

        // Vẫn cập nhật UI
        const updatedAppointments = appointments.map((apt) =>
          apt.id === appointment.id
            ? { ...apt, status: "cancelled" as const, canCancel: false, canReschedule: false }
            : apt,
        );
        setAppointments(updatedAppointments);
        setFilteredAppointments(
          filteredAppointments.map((apt) =>
            apt.id === appointment.id
              ? { ...apt, status: "cancelled" as const, canCancel: false, canReschedule: false }
              : apt,
          ),
        );
      }
    } catch (error) {
      console.error("❌ [Debug] Error cancelling appointment:", error);

      // Trích xuất thông báo lỗi chi tiết từ API response
      let errorMessage = "Có lỗi xảy ra khi hủy cuộc hẹn. Vui lòng thử lại!";
      let errorType = "general";

      if (axios.isAxiosError(error) && error.response?.data) {
        // Trường hợp lỗi validation từ backend (400)
        if (error.response.status === 400 && error.response.data.errors) {
          const errorObj = error.response.data.errors;
          // Lấy message lỗi đầu tiên tìm được
          const firstErrorKey = Object.keys(errorObj)[0];
          const firstErrorMessage = Object.values(errorObj)[0];
          if (firstErrorMessage) {
            errorMessage = firstErrorMessage as string;
            errorType = firstErrorKey;
          }
        }
        // Trường hợp lỗi quyền truy cập (403)
        else if (error.response.status === 403) {
          errorMessage = "Bạn không có quyền hủy lịch hẹn này";
          errorType = "permission";
        }
        // Trường hợp có message lỗi trong response
        else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      // Hiển thị Modal thông báo thay vì message cho thông tin chi tiết hơn
      if (errorType === "time") {
        Modal.error({
          title: "Chưa thể hủy lịch",
          content: (
            <div>
              <p>{errorMessage}</p>
              <p className="mt-2">Bạn cần đợi đủ 10 phút sau khi đặt lịch mới có thể hủy.</p>
              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="font-medium text-yellow-800">Lưu ý:</p>
                <p className="text-yellow-700">
                  Quy định này nhằm đảm bảo bạn có đủ thời gian cân nhắc trước khi quyết định hủy
                  lịch, giúp hệ thống hoạt động ổn định.
                </p>
              </div>
            </div>
          ),
          okText: "Đã hiểu",
          className: "custom-error-modal",
        });
      }
      // Các lỗi khác hiển thị thông báo thông thường
      else {
        message.error({
          content: errorMessage,
          icon: (
            <CloseCircle
              size={20}
              className="text-red-500"
            />
          ),
          duration: 5,
        });
      }
    } finally {
      // Đóng modal và reset selected appointment
      setShowDetailModal(false);
      setSelectedAppointment(null);

      // Làm mới danh sách lịch hẹn sau 1 giây
      setTimeout(() => {
        fetchAppointments();
      }, 1000);
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    // 🎯 PACKAGE RESCHEDULE VALIDATION: Only allow direct reschedule for service appointments
    if (appointment.packageName) {
      // Package appointment → show modal requiring cancellation first
      Modal.info({
        title: "⚠️ Yêu cầu hủy lịch trước khi đổi lịch",
        content: (
          <div className="space-y-4">
            <p className="text-gray-700">
              Để đổi lịch gói dịch vụ <strong>"{appointment.packageName}"</strong>, bạn cần hủy lịch
              hiện tại trước và đặt lịch mới.
            </p>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <h4 className="mb-2 font-medium text-blue-800">Quy trình đổi lịch gói dịch vụ:</h4>
              <ol className="space-y-1 text-sm text-blue-700">
                <li>1. Hủy lịch hẹn hiện tại (số lượt sử dụng sẽ được hoàn lại)</li>
                <li>2. Đặt lịch mới với thời gian phù hợp</li>
                <li>3. Hệ thống sẽ tự động sử dụng lượt từ gói dịch vụ</li>
              </ol>
            </div>
            <p className="text-sm text-gray-600">
              💡 <strong>Lưu ý:</strong> Quy định này chỉ áp dụng cho gói dịch vụ để đảm bảo tính
              chính xác của việc quản lý lượt sử dụng.
            </p>
          </div>
        ),
        okText: "Đã hiểu",
        width: 600,
        className: "reschedule-package-modal",
        maskClosable: true,
        icon: null, // Remove default icon để sử dụng emoji trong title
      });

      console.log("🔍 [Package Reschedule] Blocked reschedule for package appointment:", {
        appointmentId: appointment.id,
        packageName: appointment.packageName,
        serviceName: appointment.serviceName,
      });
    } else {
      // Service appointment → navigate normally as before
      navigate(`/booking?reschedule=${appointment.id}&service=${appointment.serviceId}`);

      console.log("🔍 [Service Reschedule] Allowing direct reschedule for service appointment:", {
        appointmentId: appointment.id,
        serviceId: appointment.serviceId,
        serviceName: appointment.serviceName,
      });
    }
  };

  // const handleRebook = (appointment: Appointment) => {
  //   navigate(`/booking?service=${appointment.serviceId}`);
  // };

  // const confirmCancel = () => {
  //   // API call to cancel appointment
  //   console.log('Cancelling appointment:', selectedAppointment?.id);
  //   setShowDetailModal(false);
  //   setSelectedAppointment(null);
  // };

  const handleFeedback = (appointment: Appointment) => {
    navigate(`/feedback?appointment=${appointment.id}`);
  };

  const handlePayment = async (appointment: Appointment) => {
    try {
      console.log("💳 [BookingHistory] Starting payment for appointment:", appointment.id);

      // ✅ FIX: Check existing payment trước khi tạo mới
      try {
        const statusResponse = await axiosInstance.get(
          `/payments/appointments/${appointment.id}/status`,
        );

        if (statusResponse.data?.success && statusResponse.data?.data) {
          const paymentData = statusResponse.data.data;
          console.log("🔍 [BookingHistory] Found existing payment:", paymentData.status);

          // Nếu payment đã success thì không cần thanh toán lại
          if (paymentData.status === "success") {
            message.info("Lịch hẹn này đã được thanh toán thành công");
            return;
          }

          // Nếu có pending payment với paymentUrl, reuse nó
          if (paymentData.status === "pending" && paymentData.paymentUrl) {
            console.log("♻️ [BookingHistory] Reusing existing payment URL");
            window.location.href = paymentData.paymentUrl;
            return;
          }
        }
      } catch (error) {
        console.log("🔍 [BookingHistory] No existing payment found, creating new one...");
      }

      // Nếu không có existing payment hoặc expired, tạo mới
      navigate(`/payment/process?appointmentId=${appointment.id}`);
    } catch (error) {
      console.error("❌ [BookingHistory] Error in handlePayment:", error);
      message.error("Có lỗi xảy ra khi xử lý thanh toán");
    }
  };

  const handleCancelPayment = async (appointment: Appointment) => {
    try {
      console.log("🔄 [CancelPayment] Cancelling payment for appointment:", appointment.id);

      const response = await axiosInstance.post(`/payments/appointments/${appointment.id}/cancel`);

      if (response.data?.success) {
        message.success("Hủy thanh toán thành công!");
        // Refresh appointments để cập nhật status mới
        fetchAppointments();
      } else {
        message.error(response.data?.message || "Không thể hủy thanh toán");
      }
    } catch (error) {
      console.error("❌ [CancelPayment] Error:", error);
      if (axios.isAxiosError(error)) {
        message.error(error.response?.data?.message || "Lỗi khi hủy thanh toán");
      } else {
        message.error("Có lỗi xảy ra khi hủy thanh toán");
      }
    }
  };

  if (loading) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f0fdfa 50%, #ecfdf5 75%, #f0f9ff 100%)",
        }}
      >
        {/* Medical Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-teal-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center"
        >
          {/* Medical Loading Animation */}
          <div className="relative mb-8">
            {/* Outer Ring - Pulse Effect */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 mx-auto h-24 w-24 rounded-full border-4 border-teal-200"
            />

            {/* Middle Ring - Rotating */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-2 mx-auto h-20 w-20 rounded-full border-4 border-transparent border-r-[#00A693] border-t-[#006478]"
            />

            {/* Inner Heart Icon with Heartbeat */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative mx-auto flex h-24 w-24 items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#006478] to-[#00A693] shadow-lg"
              >
                <Heart
                  size={24}
                  className="text-white"
                  variant="Bold"
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Loading Text with Medical Theme */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-3"
          >
            <h3 className="mb-2 text-2xl font-bold text-[#006478]">Đang tải thông tin y tế</h3>
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg font-medium text-[#00A693]"
            >
              Lịch sử khám và tư vấn sức khỏe
            </motion.p>

            {/* Medical Progress Indicator */}
            <div className="mx-auto mt-6 w-64">
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatType: "reverse",
                  }}
                  className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#006478] to-[#00A693]"
                />
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Bảo mật thông tin y tế của bạn là ưu tiên hàng đầu
              </p>
            </div>

            {/* Medical Icons Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-8 flex items-center justify-center gap-6"
            >
              {[
                { icon: Activity, delay: 0 },
                { icon: People, delay: 0.2 },
                { icon: MonitorMobbile, delay: 0.4 },
              ].map(({ icon: Icon, delay }, index) => (
                <motion.div
                  key={index}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: delay,
                    ease: "easeInOut",
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
                >
                  <Icon
                    size={20}
                    className="text-[#006478]"
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="mb-6 lg:mb-0">
              <h1 className="mb-4 text-4xl font-bold text-gray-900">Lịch sử Đặt lịch</h1>
              <p className="text-xl text-gray-600">
                {user && ["admin", "staff", "manager"].includes(user.role)
                  ? `Quản lý tất cả các lịch hẹn trong hệ thống (${user.role.toUpperCase()})`
                  : "Quản lý và theo dõi tất cả các lịch hẹn của bạn"}
              </p>
              {user && ["admin", "staff", "manager"].includes(user.role) && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    🛡️ Quyền quản lý: {user.role.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Có thể xem và quản lý lịch hẹn của tất cả người dùng
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <ModernButton
                variant="outline"
                icon={<Refresh size={20} />}
                onClick={() => {
                  console.log("🔄 [Debug] Manual refresh button clicked");
                  fetchAppointments();
                }}
                loading={loading}
              >
                Làm mới
              </ModernButton>
              <ModernButton
                variant="primary"
                icon={<Calendar size={20} />}
                onClick={() => navigate("/booking")}
              >
                Đặt lịch mới
              </ModernButton>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-4 lg:flex-row"
          >
            {/* Search */}
            <div className="max-w-md flex-1">
              <Search
                placeholder="Tìm kiếm theo tên dịch vụ, bệnh nhân hoặc mã đặt lịch..."
                size="large"
                prefix={
                  <SearchNormal1
                    size={20}
                    className="text-gray-400"
                  />
                }
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              size="large"
              className="min-w-[150px]"
              placeholder="Trạng thái"
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>

            {/* Service Filter */}
            <Select
              value={serviceFilter}
              onChange={setServiceFilter}
              size="large"
              className="min-w-[150px]"
              placeholder="Dịch vụ"
            >
              <Option value="all">Tất cả dịch vụ</Option>
              <Option value="consultation">Tư vấn sức khỏe</Option>
              <Option value="sti-testing">Xét nghiệm STI/STD</Option>
              <Option value="health-checkup">Khám sức khỏe</Option>
              <Option value="cycle-tracking">Theo dõi chu kỳ</Option>
            </Select>

            {/* Date Range */}
            <SimpleDateRangePicker
              placeholder={["Từ ngày", "Đến ngày"]}
              value={dateRange}
              onChange={setDateRange}
              style={{ height: '40px' }}
            />

            {/* View Mode Toggle - Only show on desktop */}
            <div className="hidden items-center gap-2 rounded-lg border p-1 lg:flex">
              <button
                onClick={() => setViewMode("table")}
                className={`rounded p-2 transition-colors ${viewMode === "table" ? "bg-blue-500 text-white" : "text-gray-500 hover:text-gray-700"}`}
                title="Xem dạng bảng"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`rounded p-2 transition-colors ${viewMode === "cards" ? "bg-blue-500 text-white" : "text-gray-500 hover:text-gray-700"}`}
                title="Xem dạng thẻ"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
                </svg>
              </button>
            </div>

            {/* Clear Filters */}
            {(searchText || statusFilter !== "all" || serviceFilter !== "all" || dateRange) && (
              <ModernButton
                variant="outline"
                icon={<CloseCircle size={20} />}
                onClick={() => {
                  setSearchText("");
                  setStatusFilter("all");
                  setServiceFilter("all");
                  setDateRange(null);
                }}
              >
                Xóa bộ lọc
              </ModernButton>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4"
        >
          {[
            {
              label: "Tổng lịch hẹn",
              value: appointments.length,
              color: "blue",
              icon: <Calendar size={24} />,
            },
            {
              label: "Hoàn thành",
              value: appointments.filter((a) => a.status === "completed").length,
              color: "green",
              icon: <TickCircle size={24} />,
            },
            {
              label: "Đã xác nhận",
              value: appointments.filter((a) => a.status === "confirmed").length,
              color: "green",
              icon: <TickCircle size={24} />,
            },
            {
              label: "Đã hủy",
              value: appointments.filter((a) => a.status === "cancelled").length,
              color: "red",
              icon: <Trash size={24} />,
            },
          ].map((stat, index) => (
            <ModernCard
              key={index}
              variant="default"
              className="text-center"
            >
              <div className={`text-${stat.color}-500 mb-3 flex justify-center`}>{stat.icon}</div>
              <div className="mb-1 text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </ModernCard>
          ))}
        </motion.div>

        {/* Appointments List */}
        <AnimatePresence>
          {filteredAppointments.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {viewMode === "table" ? (
                /* Table View - Desktop Only */
                <div className="hidden overflow-hidden rounded-xl border bg-white shadow-sm lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="p-4 text-left font-semibold text-gray-900">Dịch vụ</th>
                          <th className="p-4 text-left font-semibold text-gray-900">Ngày & Giờ</th>
                          <th className="p-4 text-left font-semibold text-gray-900">Bác sĩ</th>
                          <th className="p-4 text-left font-semibold text-gray-900">Hình thức</th>
                          <th className="p-4 text-left font-semibold text-gray-900">Trạng thái</th>
                          <th className="p-4 text-left font-semibold text-gray-900">Chi phí</th>
                          <th className="p-4 text-right font-semibold text-gray-900">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((appointment, index) => (
                          <motion.tr
                            key={appointment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                          >
                            {/* Service */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                                  <Heart
                                    size={16}
                                    className="text-white"
                                  />
                                </div>
                                <div>
                                  <div className="mb-1 font-semibold text-gray-900">
                                    {appointment.serviceName}
                                  </div>
                                  {appointment.packageName && (
                                    <div className="text-sm text-blue-600">
                                      {appointment.packageName}
                                    </div>
                                  )}
                                  <div className="font-mono text-xs text-gray-500">
                                    ID: {appointment.id.slice(-8)}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Date & Time */}
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                  <Calendar size={14} />
                                  {formatDate(appointment.appointmentDate)}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock size={14} />
                                  {appointment.appointmentTime}
                                </div>
                              </div>
                            </td>

                            {/* Doctor */}
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                                  {appointment.doctorAvatar ? (
                                    <img
                                      src={appointment.doctorAvatar}
                                      alt={appointment.doctorName}
                                      className="h-full w-full rounded-full object-cover"
                                    />
                                  ) : (
                                    <User
                                      size={14}
                                      className="text-gray-500"
                                    />
                                  )}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.doctorName}
                                </div>
                              </div>
                            </td>

                            {/* Location */}
                            <td className="p-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                {locationConfig[appointment.typeLocation]?.icon || (
                                  <Location size={14} />
                                )}
                                <span>
                                  {locationConfig[appointment.typeLocation]?.text ||
                                    appointment.typeLocation}
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-4">
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                                style={{
                                  backgroundColor: `${statusConfig[appointment.status]?.color}20`,
                                  color: statusConfig[appointment.status]?.color,
                                }}
                              >
                                {statusConfig[appointment.status]?.icon}
                                {statusConfig[appointment.status]?.text}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="p-4">
                              <div className="text-right">
                                <div className="font-bold text-blue-600">
                                  {formatPrice(appointment.price)}
                                </div>
                                {appointment.rating && (
                                  <div className="mt-1 flex items-center justify-end gap-1">
                                    <Star
                                      size={12}
                                      className="fill-current text-yellow-400"
                                    />
                                    <span className="text-xs text-gray-500">
                                      {appointment.rating}/5
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-4">
                              <div className="flex flex-wrap items-center justify-end gap-2 min-h-[40px]">
                                <button
                                  onClick={() => handleViewDetail(appointment)}
                                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                  title="Xem chi tiết"
                                >
                                  <Eye size={16} />
                                </button>
                                {appointment.canReschedule && (
                                  <button
                                    onClick={() => handleReschedule(appointment)}
                                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                    title="Đổi lịch"
                                  >
                                    <Refresh size={16} />
                                  </button>
                                )}
                                {appointment.canCancel && (
                                  <button
                                    onClick={() => {
                                      Modal.confirm({
                                        title: "Xác nhận hủy lịch",
                                        content: "Bạn có chắc chắn muốn hủy lịch hẹn này?",
                                        okText: "Đồng ý",
                                        okButtonProps: { danger: true },
                                        cancelText: "Hủy",
                                        onOk: () => handleCancel(appointment),
                                      });
                                    }}
                                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                    title="Hủy lịch"
                                  >
                                    <Trash size={16} />
                                  </button>
                                )}
                                {appointment.status === "pending_payment" && (
                                  <>
                                    <button
                                      onClick={() => handlePayment(appointment)}
                                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                      title="Thanh toán"
                                    >
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleForceCheck(appointment)}
                                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-orange-50 hover:text-orange-600 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                      title="Kiểm tra thanh toán và chỉ định bác sĩ"
                                    >
                                      <Refresh size={16} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        Modal.confirm({
                                          title: "Xác nhận hủy thanh toán",
                                          content: "Bạn có chắc chắn muốn hủy thanh toán? Lịch hẹn sẽ bị hủy.",
                                          okText: "Đồng ý hủy",
                                          okButtonProps: { danger: true },
                                          cancelText: "Không",
                                          onOk: () => handleCancelPayment(appointment),
                                        });
                                      }}
                                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                    >
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                                {appointment.status === "completed" && !appointment.rating && (
                                  <button
                                    onClick={() => handleFeedback(appointment)}
                                    className="rounded-lg p-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center font-medium"
                                    title="Đánh giá"
                                  >
                                    <Star size={16} className="mr-1 text-yellow-400" />
                                    <span className="hidden xl:inline">Đánh giá</span>
                                  </button>
                                )}
                                {appointment.status === "completed" && appointment.rating && (
                                  <div className="flex items-center gap-1 px-3 py-2 text-xs bg-green-50 text-green-600 rounded-lg min-h-[36px] min-w-[80px] font-medium">
                                    <Star size={12} className="fill-current text-yellow-400" />
                                    <span>{appointment.rating}/5</span>
                                    <span className="hidden xl:inline">Đã đánh giá</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {/* Mobile/Tablet Cards View - Always show on smaller screens */}
              <div className="space-y-4 lg:hidden">
                {filteredAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="p-4">
                      {/* Mobile Header */}
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex flex-1 items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                            <Heart
                              size={16}
                              className="text-white"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold text-gray-900">
                              {appointment.serviceName}
                            </h3>
                            {appointment.packageName && (
                              <p className="truncate text-xs font-medium text-blue-600">
                                {appointment.packageName}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className="ml-2 inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${statusConfig[appointment.status]?.color}20`,
                            color: statusConfig[appointment.status]?.color,
                          }}
                        >
                          {statusConfig[appointment.status]?.icon}
                          <span className="hidden sm:inline">
                            {statusConfig[appointment.status]?.text}
                          </span>
                        </span>
                      </div>

                      {/* Mobile Content - 2 columns */}
                      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={12} />
                            <span className="text-xs">
                              {formatDate(appointment.appointmentDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={12} />
                            <span className="text-xs">{appointment.appointmentTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User size={12} />
                            <span className="truncate text-xs">{appointment.doctorName}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {locationConfig[appointment.typeLocation]?.icon || (
                              <Location size={12} />
                            )}
                            <span className="text-xs">
                              {locationConfig[appointment.typeLocation]?.text ||
                                appointment.typeLocation}
                            </span>
                          </div>
                          <div className="text-right sm:text-left">
                            <div className="text-lg font-bold text-blue-600">
                              {formatPrice(appointment.price)}
                            </div>
                            {appointment.rating && (
                              <div className="flex items-center justify-end gap-1 sm:justify-start">
                                <Star
                                  size={12}
                                  className="fill-current text-yellow-400"
                                />
                                <span className="text-xs text-gray-500">
                                  {appointment.rating}/5
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex flex-wrap gap-2 border-t pt-3 justify-end min-h-[40px]">
                        <button
                          onClick={() => handleViewDetail(appointment)}
                          className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs transition-colors hover:bg-gray-200 min-w-[36px] min-h-[36px]"
                        >
                          <Eye size={12} />
                          <span>Chi tiết</span>
                        </button>
                        {appointment.canReschedule && (
                          <button
                            onClick={() => handleReschedule(appointment)}
                            className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs text-green-700 transition-colors hover:bg-green-200 min-w-[36px] min-h-[36px]"
                          >
                            <Refresh size={12} />
                            <span>Đổi lịch</span>
                          </button>
                        )}
                        {appointment.canCancel && (
                          <button
                            onClick={() => {
                              Modal.confirm({
                                title: "Xác nhận hủy lịch",
                                content: "Bạn có chắc chắn muốn hủy lịch hẹn này?",
                                okText: "Đồng ý",
                                okButtonProps: { danger: true },
                                cancelText: "Hủy",
                                onOk: () => handleCancel(appointment),
                              });
                            }}
                            className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs text-red-700 transition-colors hover:bg-red-200 min-w-[36px] min-h-[36px]"
                          >
                            <Trash size={12} />
                            <span>Hủy</span>
                          </button>
                        )}
                        {appointment.status === "pending_payment" && (
                          <>
                            <button
                              onClick={() => handlePayment(appointment)}
                              className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs text-green-700 transition-colors hover:bg-green-200 min-w-[36px] min-h-[36px]"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              <span>Thanh toán</span>
                            </button>
                            <button
                              onClick={() => handleForceCheck(appointment)}
                              className="flex items-center gap-1 rounded-lg bg-orange-100 px-3 py-1.5 text-xs text-orange-700 transition-colors hover:bg-orange-200 min-w-[36px] min-h-[36px]"
                              title="Kiểm tra thanh toán và chỉ định bác sĩ"
                            >
                              <Refresh size={12} />
                              <span>Kiểm tra</span>
                            </button>
                            <button
                              onClick={() => {
                                Modal.confirm({
                                  title: "Xác nhận hủy thanh toán",
                                  content: "Bạn có chắc chắn muốn hủy thanh toán? Lịch hẹn sẽ bị hủy.",
                                  okText: "Đồng ý hủy",
                                  okButtonProps: { danger: true },
                                  cancelText: "Không",
                                  onOk: () => handleCancelPayment(appointment),
                                });
                              }}
                              className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs text-red-700 transition-colors hover:bg-red-200 min-w-[36px] min-h-[36px]"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Hủy thanh toán</span>
                            </button>
                          </>
                        )}
                        {appointment.status === 'completed' && !appointment.rating && (
                          <button
                            onClick={() => handleFeedback(appointment)}
                            className="flex items-center gap-1 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs text-yellow-600 hover:bg-yellow-100 transition-colors min-w-[36px] min-h-[36px] font-medium"
                          >
                            <Star size={12} className="mr-1 text-yellow-400" />
                            <span>Đánh giá</span>
                          </button>
                        )}
                        {appointment.status === 'completed' && appointment.rating && (
                          <div className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg min-h-[36px] min-w-[80px] font-medium">
                            <Star size={12} className="fill-current text-yellow-400" />
                            <span>{appointment.rating}/5</span>
                            <span className="hidden sm:inline">Đã đánh giá</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Cards View - Only show when cards mode is selected */}
              {viewMode === "cards" && (
                <div className="hidden space-y-4 lg:block">
                  {filteredAppointments.map((appointment, index) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                              <Heart
                                size={20}
                                className="text-white"
                              />
                            </div>
                            <div>
                              <h3 className="mb-1 font-bold text-gray-900">
                                {appointment.serviceName}
                              </h3>
                              {appointment.packageName && (
                                <p className="text-sm font-medium text-blue-600">
                                  {appointment.packageName}
                                </p>
                              )}
                              <p className="font-mono text-xs text-gray-500">
                                ID: {appointment.id.slice(-8)}
                              </p>
                            </div>
                          </div>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
                            style={{
                              backgroundColor: `${statusConfig[appointment.status]?.color}20`,
                              color: statusConfig[appointment.status]?.color,
                            }}
                          >
                            {statusConfig[appointment.status]?.icon}
                            {statusConfig[appointment.status]?.text}
                          </span>
                        </div>

                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar size={14} />
                              <span>{formatDate(appointment.appointmentDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock size={14} />
                              <span>{appointment.appointmentTime}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User size={14} />
                              <span>{appointment.doctorName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {locationConfig[appointment.typeLocation]?.icon || (
                                <Location size={14} />
                              )}
                              <span>
                                {locationConfig[appointment.typeLocation]?.text ||
                                  appointment.typeLocation}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="mb-1 text-xl font-bold text-blue-600">
                              {formatPrice(appointment.price)}
                            </div>
                            {appointment.rating && (
                              <div className="flex items-center justify-end gap-1">
                                <Rate
                                  disabled
                                  defaultValue={appointment.rating}
                                  className="text-xs"
                                />
                                <span className="text-xs text-gray-500">
                                  ({appointment.rating}/5)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t pt-4">
                          <ModernButton
                            variant="outline"
                            className="text-sm"
                            icon={<Eye size={14} />}
                            onClick={() => handleViewDetail(appointment)}
                          >
                            Chi tiết
                          </ModernButton>

                          {appointment.canReschedule && (
                            <ModernButton
                              variant="outline"
                              className="text-sm"
                              icon={<Refresh size={14} />}
                              onClick={() => handleReschedule(appointment)}
                            >
                              Đổi lịch
                            </ModernButton>
                          )}

                          {appointment.canCancel && (
                            <ModernButton
                              variant="danger"
                              className="text-sm"
                              icon={<Trash size={14} />}
                              onClick={() => {
                                Modal.confirm({
                                  title: "Xác nhận hủy lịch",
                                  content: "Bạn có chắc chắn muốn hủy lịch hẹn này?",
                                  okText: "Đồng ý",
                                  okButtonProps: { danger: true },
                                  cancelText: "Hủy",
                                  onOk: () => handleCancel(appointment),
                                });
                              }}
                            >
                              Hủy lịch
                            </ModernButton>
                          )}

                          {appointment.status === "pending_payment" && (
                            <>
                              <ModernButton
                                variant="primary"
                                className="bg-green-600 text-sm hover:bg-green-700"
                                icon={
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                  </svg>
                                }
                                onClick={() => handlePayment(appointment)}
                              >
                                Thanh toán
                              </ModernButton>

                              <ModernButton
                                variant="danger"
                                className="text-sm"
                                icon={
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                }
                                onClick={() => {
                                  Modal.confirm({
                                    title: "Xác nhận hủy thanh toán",
                                    content:
                                      "Bạn có chắc chắn muốn hủy thanh toán? Lịch hẹn sẽ bị hủy.",
                                    okText: "Đồng ý hủy",
                                    okButtonProps: { danger: true },
                                    cancelText: "Không",
                                    onOk: () => handleCancelPayment(appointment),
                                  });
                                }}
                              >
                                Hủy thanh toán
                              </ModernButton>
                            </>
                          )}



                          
                          {appointment.status === 'completed' && appointment.rating && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                              <Star size={14} className="fill-current text-yellow-400" />
                              <span className="text-sm font-medium">{appointment.rating}/5</span>
                              <span className="text-sm text-green-600">Đã đánh giá</span>
                            </div>

                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <Empty
                description={
                  <div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-600">
                      Không tìm thấy lịch hẹn nào
                    </h3>
                    <p className="mb-6 text-gray-500">
                      {searchText || statusFilter !== "all" || serviceFilter !== "all" || dateRange
                        ? "Hãy thử thay đổi bộ lọc tìm kiếm"
                        : "Bạn chưa có lịch hẹn nào. Hãy đặt lịch ngay!"}
                    </p>
                    <ModernButton
                      variant="primary"
                      icon={<Calendar size={20} />}
                      onClick={() => navigate("/booking")}
                    >
                      Đặt lịch ngay
                    </ModernButton>
                  </div>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết lịch hẹn"
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={null}
        width={600}
      >
        {selectedAppointment && (
          <div className="space-y-6">
            {/* Service Info */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                <Heart
                  size={20}
                  className="text-blue-500"
                />
                Thông tin dịch vụ
              </h4>
              <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dịch vụ:</span>
                  <span className="font-medium">{selectedAppointment.serviceName}</span>
                </div>
                {selectedAppointment.packageName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gói:</span>
                    <span className="font-medium">{selectedAppointment.packageName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày hẹn:</span>
                  <span className="font-medium">
                    {formatDate(selectedAppointment.appointmentDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giờ hẹn:</span>
                  <span className="font-medium">{selectedAppointment.appointmentTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hình thức:</span>
                  <span className="font-medium">
                    {locationConfig[selectedAppointment.typeLocation]?.text ||
                      selectedAppointment.typeLocation}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chi phí:</span>
                  <span className="font-medium text-blue-600">
                    {formatPrice(selectedAppointment.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Doctor Info */}
            {selectedAppointment.doctorName && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                  <User
                    size={20}
                    className="text-green-500"
                  />
                  Bác sĩ phụ trách
                </h4>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 font-semibold text-white">
                      {selectedAppointment.doctorAvatar ? (
                        <img
                          src={selectedAppointment.doctorAvatar}
                          alt={selectedAppointment.doctorName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        selectedAppointment.doctorName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedAppointment.doctorName}
                      </div>
                      <div className="text-sm text-gray-600">Bác sĩ chuyên khoa</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            {selectedAppointment.address && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                  <Location
                    size={20}
                    className="text-orange-500"
                  />
                  Địa chỉ
                </h4>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-gray-700">{selectedAppointment.address}</p>
                </div>
              </div>
            )}

            {/* Description & Notes */}
            {(selectedAppointment.description || selectedAppointment.notes) && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                  <DocumentText
                    size={20}
                    className="text-purple-500"
                  />
                  Ghi chú
                </h4>
                <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                  {selectedAppointment.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                      <p className="text-gray-700">{selectedAppointment.description}</p>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Ghi chú:</span>
                      <p className="text-gray-700">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feedback Section - Only show if appointment is completed and has rating/feedback */}
            {selectedAppointment.status === 'completed' && (selectedAppointment.rating || selectedAppointment.feedback) && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Star size={20} className="text-yellow-500" />
                  Đánh giá dịch vụ
                </h4>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  {selectedAppointment.rating && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">Đánh giá:</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, index) => (
                          <Star 
                            key={index}
                            size={16} 
                            className={index < selectedAppointment.rating! ? "text-yellow-400 fill-current" : "text-gray-300"}
                          />
                        ))}
                        <span className="text-sm font-medium text-gray-700 ml-1">
                          ({selectedAppointment.rating}/5)
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedAppointment.feedback && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Nhận xét:</span>
                      <p className="text-sm text-gray-600 mt-1 italic">"{selectedAppointment.feedback}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                <Activity
                  size={20}
                  className="text-indigo-500"
                />
                Trạng thái
              </h4>
              <div className="rounded-lg bg-gray-50 p-4">
                <Timeline
                  items={[
                    {
                      color: "green",
                      children: `Đặt lịch - ${formatDate(selectedAppointment.createdAt)}`,
                    },
                    ...(selectedAppointment.status !== "cancelled"
                      ? [
                          {
                            color: selectedAppointment.status === "pending" ? "blue" : "green",
                            children:
                              selectedAppointment.status === "pending"
                                ? "Chờ xác nhận"
                                : "Đã xác nhận",
                          },
                        ]
                      : []),
                    ...(selectedAppointment.status === "confirmed" ||
                    selectedAppointment.status === "in_progress" ||
                    selectedAppointment.status === "completed"
                      ? [
                          {
                            color: "green",
                            children: "Đã thanh toán & xác nhận",
                          },
                        ]
                      : []),
                    ...(selectedAppointment.status === "completed"
                      ? [
                          {
                            color: "green",
                            children: "Hoàn thành",
                          },
                        ]
                      : []),
                    ...(selectedAppointment.status === "cancelled"
                      ? [
                          {
                            color: "red",
                            children: "Đã hủy",
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingHistory;
