import React, { useEffect, useState } from "react";
import { Card, Button, Typography, Tag, Divider, Space, message, Spin } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DollarOutlined,
  HomeOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { appointmentApi } from "../../api";

const { Title, Paragraph, Text } = Typography;

interface AppointmentDetail {
  id: string;
  serviceName: string;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  timeSlot: string;
  totalAmount: number;
  status: string;
  location: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

// ✅ HELPER: Function để map location từ backend
const getLocationDisplayText = (typeLocation: string, location?: string) => {
  const locationMap: Record<string, string> = {
    clinic: "Tại phòng khám",
    home: "Tại nhà",
    Online: "Trực tuyến",
    online: "Trực tuyến",
  };

  return locationMap[typeLocation] || location || "Tại phòng khám";
};

// ✅ HELPER: Function để format service name với fallback cho null data và raw ID support
const getServiceDisplayName = (appointment: {
  packageId?: { name?: string } | null;
  serviceId?: { serviceName?: string } | null;
  serviceName?: string;
  bookingType?: string;
  _rawServiceId?: string;
  _rawPackageId?: string;
}) => {
  // Ưu tiên packageId.name trước, sau đó serviceId.serviceName
  if (appointment.packageId?.name) {
    return `Gói: ${appointment.packageId.name}`;
  }
  if (appointment.serviceId?.serviceName) {
    return appointment.serviceId.serviceName;
  }
  if (appointment.serviceName) {
    return appointment.serviceName;
  }

  // ✅ FALLBACK: Dựa vào bookingType và raw IDs
  if (appointment.bookingType === "service_only") {
    if (appointment._rawServiceId) {
      return `Dịch vụ (ID: ${appointment._rawServiceId.slice(-8)}) - Đang tải thông tin...`;
    }
    return "Dịch vụ khám bệnh (Thông tin chi tiết đang được tải...)";
  }
  if (appointment.bookingType === "purchased_package") {
    if (appointment._rawPackageId) {
      return `Gói dịch vụ (ID: ${appointment._rawPackageId.slice(-8)}) - Đang tải thông tin...`;
    }
    return "Gói dịch vụ đã mua (Thông tin chi tiết đang được tải...)";
  }

  return "Dịch vụ khám bệnh";
};

// ✅ HELPER: Function để lấy patient name với fallback và raw ID support
const getPatientDisplayName = (appointment: {
  profileId?: { fullName?: string } | null;
  patientName?: string;
  createdByUserId?: { fullName?: string } | null;
  _rawProfileId?: string;
}) => {
  // Ưu tiên profileId.fullName
  if (appointment.profileId?.fullName) {
    return appointment.profileId.fullName;
  }

  // Fallback sang patientName trực tiếp
  if (appointment.patientName) {
    return appointment.patientName;
  }

  // Fallback sang user tạo appointment (trong trường hợp đặt cho chính mình)
  if (appointment.createdByUserId?.fullName) {
    return `${appointment.createdByUserId.fullName} (Thông tin bệnh nhân đang được tải...)`;
  }

  // ✅ NEW: Nếu có raw ID nhưng populate thất bại
  if (appointment._rawProfileId) {
    return `Bệnh nhân (ID: ${appointment._rawProfileId.slice(-8)}) - Đang tải thông tin...`;
  }

  return "Bệnh nhân (Thông tin đang được tải...)";
};

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const appointmentId = searchParams.get("appointmentId");
  const code = searchParams.get("code");
  const cancel = searchParams.get("cancel");

  // ✅ FIX: Handle both 'orderCode' and 'id' parameters
  const orderCode = searchParams.get("orderCode") || searchParams.get("id");

  // ✅ FIX: Handle missing 'status' parameter - infer from 'code'
  let status = searchParams.get("status");
  if (!status && code === "00") {
    status = "PAID"; // Default to PAID when code=00
  }

  const [isLoading, setIsLoading] = useState(true);
  const [appointmentData, setAppointmentData] = useState<AppointmentDetail | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    const confirmAndFetch = async () => {
      if (!appointmentId || !orderCode || !status || !code) {
        console.error("❌ [PaymentSuccess] Missing required URL parameters:", {
          appointmentId,
          orderCode,
          status,
          code,
          fullURL: window.location.href,
        });
        message.error("Thiếu thông tin xác nhận thanh toán trong URL");
        navigate("/booking", { replace: true });
        return;
      }

      const isPaid = code === "00" && cancel === "false" && status === "PAID";

      if (!isPaid) {
        setConfirmError("Thanh toán không thành công hoặc đã bị hủy");
        setIsLoading(false);
        return;
      }

      try {
        const confirmResponse = await appointmentApi.fastConfirmPayment({
          appointmentId,
          orderCode,
          status,
        });

        if (confirmResponse.data.success) {
          message.success("Thanh toán thành công! Lịch hẹn đã được xác nhận.");
        } else {
          console.error("❌ [PaymentSuccess] Fast confirm failed:", confirmResponse.data);
          throw new Error(confirmResponse.data.message || "Không thể xác nhận thanh toán");
        }

        const response = await appointmentApi.getAppointmentById(appointmentId);

        if (response.success && response.data) {
          const appointment = response.data;

          // ✅ IMPROVED: Enhanced logging để debug data structure
          console.log("🔍 [PaymentSuccess] Raw appointment data from backend:", appointment);
          console.log("🔍 [PaymentSuccess] Detailed field analysis:", {
            // Service information
            hasServiceId: !!appointment.serviceId,
            hasPackageId: !!appointment.packageId,
            serviceIdData: appointment.serviceId,
            packageIdData: appointment.packageId,
            directServiceName: appointment.serviceName,

            // Doctor information
            hasDoctorId: !!appointment.doctorId,
            doctorIdData: appointment.doctorId,
            doctorUserId: appointment.doctorId?.userId,
            directDoctorName: appointment.doctorName,

            // Patient information
            hasProfileId: !!appointment.profileId,
            profileIdData: appointment.profileId,
            directPatientName: appointment.patientName,

            // Other fields
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            timeSlot: appointment.timeSlot,
            totalAmount: appointment.totalAmount,
            status: appointment.status,
            typeLocation: appointment.typeLocation,
            location: appointment.location,
          });

          // ✅ VALIDATION: Kiểm tra dữ liệu quan trọng
          const validationErrors = [];
          const hasServiceData = !!(appointment.serviceId || appointment.packageId);
          const hasProfileData = !!appointment.profileId;
          const hasDoctorData = !!appointment.doctorId;

          if (!hasServiceData) {
            validationErrors.push("Thiếu thông tin dịch vụ - serviceId và packageId đều null");
          }
          if (!hasProfileData) {
            validationErrors.push("Thiếu thông tin bệnh nhân - profileId null");
          }
          if (!hasDoctorData) {
            validationErrors.push("Thiếu thông tin bác sĩ - doctorId null");
          }

          if (validationErrors.length > 0) {
            console.warn("⚠️ [PaymentSuccess] Data validation warnings:", validationErrors);
            console.warn("⚠️ [PaymentSuccess] Có thể do populate thất bại hoặc dữ liệu bị xóa");
            // Không throw error, chỉ log warning và tiếp tục với fallback values
          }

          // ✅ FIXED: Improved data mapping với proper fallbacks
          const mappedData = {
            id: appointment._id || appointment.id || appointmentId,

            // ✅ Service name - sử dụng helper function
            serviceName: getServiceDisplayName(appointment),

            // ✅ Doctor name - đúng cấu trúc từ backend populate
            doctorName:
              appointment.doctorId?.userId?.fullName ||
              appointment.doctorName ||
              "Chưa chỉ định bác sĩ",

            // ✅ Patient name - sử dụng helper function với fallback tốt hơn
            patientName: getPatientDisplayName(appointment),

            // ✅ Date and time handling
            appointmentDate: appointment.appointmentDate || "Chưa xác định",
            timeSlot: appointment.appointmentTime || appointment.timeSlot || "Chưa xác định",

            // ✅ Amount and status
            totalAmount: appointment.totalAmount || 0,
            status: appointment.status || "confirmed",

            // ✅ Location handling - sử dụng helper function
            location: getLocationDisplayText(appointment.typeLocation, appointment.location),
          };

          console.log("✅ [PaymentSuccess] Mapped appointment data:", mappedData);
          setAppointmentData(mappedData);

          // ✅ ENHANCEMENT: Nếu có raw IDs, thử lấy thông tin chi tiết
          if (appointment._rawServiceId || appointment._rawProfileId) {
            console.log("🔄 [PaymentSuccess] Attempting to fetch detailed info for raw IDs...");
            // TODO: Implement separate API calls to get service and profile details
            // This will be implemented in a future enhancement
          }
        } else {
          console.error("❌ [PaymentSuccess] Failed to get appointment details:", response);
          throw new Error("Không thể lấy thông tin lịch hẹn");
        }
      } catch (error: unknown) {
        const err = error as ApiError;
        console.error("❌ [PaymentSuccess] Error confirming appointment payment:", error);
        console.error("❌ [PaymentSuccess] Error details:", {
          message: err?.message,
          response: err?.response,
          responseData: err?.response?.data,
          status: err?.response?.status,
        });
        const errorMessage =
          err?.response?.data?.message || err?.message || "Có lỗi khi xác nhận thanh toán";
        setConfirmError(errorMessage);
        message.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    confirmAndFetch();
  }, [appointmentId, orderCode, status, code, cancel, navigate, searchParams]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text className="text-lg text-gray-600">Đang xác nhận thanh toán...</Text>
          </div>
        </div>
      </div>
    );
  }
  if (confirmError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 px-4 py-12">
        <motion.div
          className="mx-auto max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="rounded-2xl border-0 text-center shadow-xl">
            <div className="mb-4 text-red-500">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <Title
              level={3}
              className="mb-4 text-red-600"
            >
              ❌ Thanh toán thất bại
            </Title>

            <Paragraph className="mb-6 text-gray-600">{confirmError}</Paragraph>

            <Space
              direction="vertical"
              className="w-full"
              size="middle"
            >
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/booking")}
                className="h-12 w-full rounded-xl border-none bg-blue-600 text-lg font-semibold hover:bg-blue-700"
                icon={<CalendarOutlined />}
              >
                Thử lại đặt lịch
              </Button>

              <Button
                size="large"
                onClick={() => navigate("/")}
                className="h-12 w-full rounded-xl border-gray-300 text-lg font-semibold"
                icon={<HomeOutlined />}
              >
                Về trang chủ
              </Button>
            </Space>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Success Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500"
            >
              <CheckCircleOutlined style={{ fontSize: "40px", color: "white" }} />
            </motion.div>
          </div>

          <Title
            level={2}
            className="mb-4 text-green-600"
          >
            🎉 Đặt lịch thành công!
          </Title>
          <Paragraph className="text-lg text-gray-600">
            Lịch hẹn của bạn đã được xác nhận và thanh toán thành công.
          </Paragraph>
        </motion.div>

        {/* Appointment Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="mb-6 rounded-lg shadow-lg">
            <div className="mb-4">
              <Title
                level={4}
                className="mb-0 text-gray-800"
              >
                📋 Thông tin lịch hẹn
              </Title>
            </div>

            <div className="space-y-4">
              {/* Mã lịch hẹn */}
              <div className="flex items-center justify-between rounded bg-gray-50 p-3">
                <Text className="text-gray-600">Mã lịch hẹn:</Text>
                <Text className="font-mono text-sm font-bold">{appointmentData?.id}</Text>
              </div>

              {/* Dịch vụ */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-blue-500" />
                  <Text className="text-gray-600">Dịch vụ:</Text>
                </div>
                <Text className="font-semibold">{appointmentData?.serviceName}</Text>
              </div>

              {/* Bệnh nhân */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-purple-500" />
                  <Text className="text-gray-600">Bệnh nhân:</Text>
                </div>
                <Text className="font-semibold">{appointmentData?.patientName}</Text>
              </div>

              {/* Bác sĩ */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-green-500" />
                  <Text className="text-gray-600">Bác sĩ:</Text>
                </div>
                <Text className="font-semibold">{appointmentData?.doctorName}</Text>
              </div>

              {/* Ngày khám */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarOutlined className="text-orange-500" />
                  <Text className="text-gray-600">Ngày khám:</Text>
                </div>
                <Text className="font-semibold">
                  {formatDate(appointmentData?.appointmentDate || "")}
                </Text>
              </div>

              {/* Giờ khám */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-red-500" />
                  <Text className="text-gray-600">Giờ khám:</Text>
                </div>
                <Text className="font-semibold">{appointmentData?.timeSlot}</Text>
              </div>

              {/* Hình thức */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HomeOutlined className="text-indigo-500" />
                  <Text className="text-gray-600">Hình thức:</Text>
                </div>
                <Text className="font-semibold">{appointmentData?.location}</Text>
              </div>

              <Divider />

              {/* Tổng tiền */}
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <DollarOutlined className="text-green-600" />
                  <Text className="font-semibold text-green-800">Tổng thanh toán:</Text>
                </div>
                <div className="text-right">
                  <Text className="text-xl font-bold text-green-600">
                    {formatPrice(appointmentData?.totalAmount || 0)}
                  </Text>
                  <div>
                    <Tag color="green">Đã thanh toán</Tag>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="mb-6 rounded-lg shadow-lg">
            <Title
              level={4}
              className="mb-4 text-gray-800"
            >
              📞 Bước tiếp theo
            </Title>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded bg-blue-50 p-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                  1
                </div>
                <div>
                  <Text className="font-semibold text-blue-900">Chúng tôi sẽ liên hệ xác nhận</Text>
                  <div className="text-sm text-blue-700">Trong vòng 2-4 giờ làm việc</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded bg-orange-50 p-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                  2
                </div>
                <div>
                  <Text className="font-semibold text-orange-900">Chuẩn bị khám bệnh</Text>
                  <div className="text-sm text-orange-700">
                    Mang theo CMND/CCCD và thẻ BHYT (nếu có)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded bg-green-50 p-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                  3
                </div>
                <div>
                  <Text className="font-semibold text-green-900">Đến khám đúng giờ</Text>
                  <div className="text-sm text-green-700">Có mặt trước 15 phút để làm thủ tục</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Space
            direction="vertical"
            className="w-full"
            size="middle"
          >
            <Button
              type="primary"
              size="large"
              icon={<HistoryOutlined />}
              className="h-12 w-full text-lg font-semibold"
              onClick={() => navigate("/booking-history")}
            >
              Xem lịch sử đặt hẹn
            </Button>

            <Button
              size="large"
              icon={<HomeOutlined />}
              className="h-12 w-full text-lg font-semibold"
              onClick={() => navigate("/")}
            >
              Về trang chủ
            </Button>
          </Space>
        </motion.div>

        {/* Support Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <Card className="rounded-lg bg-gradient-to-r from-blue-50 to-green-50 shadow-lg">
            <Title
              level={5}
              className="mb-3 text-gray-800"
            >
              💬 Cần hỗ trợ?
            </Title>
            <Text className="mb-4 block text-gray-600">
              Liên hệ với chúng tôi nếu có thắc mắc hoặc cần thay đổi lịch hẹn
            </Text>
            <Space size="large">
              <Text className="font-semibold text-blue-600">📞 Hotline: 1900-1234</Text>
              <Text className="font-semibold text-green-600">📧 Email: support@healthcare.com</Text>
            </Space>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
