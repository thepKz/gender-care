import React, { useState, useEffect } from "react";
import { Avatar, Layout, Menu, Typography, Button, Row, Col, Card, List } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
  HistoryOutlined,
  BarChartOutlined,
  SecurityScanOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  DollarOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  HomeOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import EnhancedStatsCard from "../widgets/EnhancedStatsCard";
import TableWidget from "../widgets/TableWidget";
import UserManagement from "../../../pages/dashboard/management/UserManagement";
import DoctorManagement from "../../../pages/dashboard/management/DoctorManagement";
import ServiceManagement from "../../../pages/dashboard/management/ServiceManagement";
import ServicePackageManagement from "../../../pages/dashboard/management/ServicePackageManagement";
import SystemLogManagement from "../../../pages/dashboard/management/SystemLogManagement";
import LoginHistoryManagement from "../../../pages/dashboard/management/LoginHistoryManagement";
import RefundManagement from "../../../pages/dashboard/management/RefundManagement";
import FeedbackManagement from "../../../pages/dashboard/management/FeedbackManagement";

import DoctorSchedulePage from "../../../pages/dashboard/management/DoctorSchedulePage";
import MedicineManagement from "../../../pages/dashboard/management/MedicineManagement";

import TestCategoriesManagement from "../../../pages/dashboard/management/TestCategoriesManagement";
import SystemConfigsManagement from "../../../pages/admin/SystemConfigsManagement";

import {
  type DashboardStat,
  type ActivityItem,
  type AppointmentItem,
} from "../../../types/dashboard";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { fetchManagementDashboard } from "../../../api/endpoints/dashboard";
import ReportsPage from "../../../pages/dashboard/management/ReportsPage";
import { filterMenuItemsByPermissions, type MenuItem } from "../../../utils/permissions";

const { Title, Text } = Typography;
const { Header, Sider, Content } = Layout;

// Define proper interfaces for API response data
interface ApiActivityItem {
  id: string;
  title?: string;
  user?: string;
  description?: string;
  action?: string;
  time: string | Date;
  status?: string;
  avatar?: string;
  type?: string;
}

interface ApiAppointmentItem {
  id: string;
  patientName: string;
  doctorName: string;
  time: string;
  status: string;
  service?: string;
  notes?: string;
  priority?: string;
  phone?: string;
}

interface ManagementTemplateProps {
  userRole: "admin" | "manager";
  userName?: string;
  welcomeMessage?: string;
}

// Xây dựng menu động theo vai trò với permission filtering
const getMenuItems = (role: "admin" | "manager"): MenuItem[] => {
  let baseMenuItems: MenuItem[];

  // Menu cho Admin - chỉ 5 mục như yêu cầu
  if (role === "admin") {
    baseMenuItems = [
      {
        key: "users",
        icon: <UserOutlined />,
        label: "Quản lý người dùng",
      },
      {
        key: "login-history",
        icon: <HistoryOutlined />,
        label: "Lịch sử đăng nhập",
      },
      {
        key: "system-logs",
        icon: <SecurityScanOutlined />,
        label: "System Logs",
      },
      {
        key: "reports",
        icon: <BarChartOutlined />,
        label: "Báo cáo",
      },
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: "System Configs",
      },
    ];
  } else {
    // Menu cho Manager - đầy đủ chức năng quản lý
    baseMenuItems = [
      {
        key: "dashboard",
        icon: <DashboardOutlined />,
        label: "Tổng quan",
      },
      {
        key: "users",
        icon: <UserOutlined />,
        label: "Quản lý người dùng",
      },
      {
        key: "doctors",
        icon: <MedicineBoxOutlined />,
        label: "Quản lý bác sĩ",
      },
      {
        key: "schedule",
        icon: <CalendarOutlined />,
        label: "Quản lý lịch làm việc",
      },
      {
        key: "services",
        icon: <SettingOutlined />,
        label: "Quản lý dịch vụ",
      },
      {
        key: "service-packages",
        icon: <AppstoreOutlined />,
        label: "Quản lý gói dịch vụ",
      },
      {
        key: "medicines",
        icon: <MedicineBoxOutlined />,
        label: "Quản lý thuốc",
      },
      {
        key: "test-categories",
        icon: <FileTextOutlined />,
        label: "Quản lý danh mục xét nghiệm",
      },
      {
        key: "refunds",
        icon: <DollarOutlined />,
        label: "Quản lý yêu cầu hoàn tiền",
      },
      {
        key: "feedbacks",
        icon: <CommentOutlined />,
        label: "Quản lý Feedback",
      },
      {
        key: "login-history",
        icon: <HistoryOutlined />,
        label: "Lịch sử đăng nhập",
      },
      {
        key: "system-logs",
        icon: <SecurityScanOutlined />,
        label: "System Logs",
      },
      {
        key: "reports",
        icon: <BarChartOutlined />,
        label: "Báo cáo",
      },
    ];
  }

  // Apply permission filtering to only show items the user has access to
  return filterMenuItemsByPermissions(baseMenuItems, role);
};

const ManagementTemplate: React.FC<ManagementTemplateProps> = ({
  userRole,
  userName = "Admin",
  welcomeMessage,
}) => {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  const location = useLocation();

  // ✅ UPDATED: Get initial selectedKey from URL params or default
  const getInitialSelectedKey = (): string => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");

    // Validate tab param against allowed menu items
    const allowedKeys = getMenuItems(userRole).map((item) => item.key);

    if (tabParam && allowedKeys.includes(tabParam)) {
      return tabParam;
    }

    // Return default based on role
    return userRole === "admin" ? "users" : "dashboard";
  };

  const [selectedKey, setSelectedKey] = useState(getInitialSelectedKey());
  const [collapsed, setCollapsed] = useState(false);

  // ✅ NEW: Update URL when selectedKey changes
  const updateSelectedKey = (key: string) => {
    setSelectedKey(key);

    // Update URL with tab parameter
    const searchParams = new URLSearchParams(location.search);
    if (key === (userRole === "admin" ? "users" : "dashboard")) {
      // Remove tab param for default pages
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", key);
    }

    const newUrl = searchParams.toString()
      ? `${location.pathname}?${searchParams.toString()}`
      : location.pathname;

    // Use replace to avoid adding to history stack
    navigate(newUrl, { replace: true });
  };

  // ✅ NEW: Sync selectedKey when URL changes (back/forward navigation)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");

    // Validate tab param against allowed menu items
    const allowedKeys = getMenuItems(userRole).map((item) => item.key);

    let newSelectedKey: string;
    if (tabParam && allowedKeys.includes(tabParam)) {
      newSelectedKey = tabParam;
    } else {
      // Return default based on role
      newSelectedKey = userRole === "admin" ? "users" : "dashboard";
    }

    if (newSelectedKey !== selectedKey) {
      setSelectedKey(newSelectedKey);
    }
  }, [location.search, userRole, selectedKey]);

  // Customize stats based on role
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [todayList, setTodayList] = useState<AppointmentItem[]>([]);

  // Scroll to top when component mounts or page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedKey]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchManagementDashboard();

        if (data?.stats) {
          const mapped = [
            {
              title: "Tổng bác sĩ",
              value: data.stats.totalDoctors,
              icon: "UserOutlined",
              color: "#3b82f6",
              change: "",
              trend: "up",
            },
            {
              title: "Tổng dịch vụ",
              value: data.stats.totalServices,
              icon: "StarOutlined",
              color: "#10b981",
              change: "",
              trend: "up",
            },
            {
              title: "Lịch hẹn hôm nay",
              value: data.stats.todayAppointments,
              icon: "CalendarOutlined",
              color: "#f59e0b",
              change: "",
              trend: "up",
            },
            {
              title: "Doanh thu tháng",
              value: data.stats.monthlyRevenue,
              icon: "DollarOutlined",
              color: "#ef4444",
              change: "",
              trend: "up",
            },
          ];
          setStats(mapped as DashboardStat[]);
        }

        if (data?.recentActivities) {
          const transformedActivities = (data.recentActivities as unknown as ApiActivityItem[]).map(
            (activity) => ({
              id: activity.id,
              user: activity.title || activity.user || "Unknown User",
              action: activity.description || activity.action || "Unknown Action",
              time:
                typeof activity.time === "string"
                  ? activity.time
                  : new Date(activity.time).toISOString(),
              status: (activity.status as ActivityItem["status"]) || "info",
              avatar: activity.avatar,
              type: (activity.type as ActivityItem["type"]) || "system",
            }),
          );
          setActivities(transformedActivities);
        }

        if (data?.todayAppointments) {
          const transformedAppointments = (
            data.todayAppointments as unknown as ApiAppointmentItem[]
          ).map((appointment) => ({
            id: appointment.id,
            patientName: appointment.patientName,
            doctorName: appointment.doctorName,
            time: appointment.time,
            status: appointment.status as AppointmentItem["status"],
            service: appointment.service || "Dịch vụ chưa xác định",
            notes: appointment.notes,
            priority: (appointment.priority as AppointmentItem["priority"]) || "medium",
            phone: appointment.phone,
          }));
          setTodayList(transformedAppointments);
        }
      } catch {
        // Fallback to demo data when API fails
        const demoStats = [
          {
            title: "Tổng bác sĩ",
            value: 12,
            icon: "UserOutlined",
            color: "#3b82f6",
            change: "+2 tuần này",
            trend: "up",
          },
          {
            title: "Tổng dịch vụ",
            value: 25,
            icon: "StarOutlined",
            color: "#10b981",
            change: "+3 dịch vụ mới",
            trend: "up",
          },
          {
            title: "Lịch hẹn hôm nay",
            value: 8,
            icon: "CalendarOutlined",
            color: "#f59e0b",
            change: "6/8 đã hoàn thành",
            trend: "up",
          },
          {
            title: "Doanh thu tháng",
            value: 45000000,
            icon: "DollarOutlined",
            color: "#ef4444",
            change: "+15% so với tháng trước",
            trend: "up",
          },
        ];
        setStats(demoStats as DashboardStat[]);

        const demoActivities = [
          {
            id: "1",
            user: "Nguyễn Văn A",
            action: "đã đặt lịch hẹn mới",
            time: new Date().toISOString(),
            status: "success" as const,
            type: "appointment" as const,
          },
          {
            id: "2",
            user: "BS. Trần Thị B",
            action: "đã cập nhật lịch làm việc",
            time: new Date(Date.now() - 1800000).toISOString(),
            status: "info" as const,
            type: "user" as const,
          },
        ];
        setActivities(demoActivities);

        const demoAppointments = [
          {
            id: "1",
            patientName: "Nguyễn Văn A",
            doctorName: "BS. Trần Thị B",
            time: "09:00",
            status: "confirmed" as const,
            service: "Khám phụ khoa",
            phone: "0901234567",
          },
          {
            id: "2",
            patientName: "Lê Thị C",
            doctorName: "BS. Phạm Văn D",
            time: "10:30",
            status: "pending" as const,
            service: "Tư vấn dinh dưỡng",
            phone: "0912345678",
          },
        ];
        setTodayList(demoAppointments);
      }
    })();
  }, []);

  const defaultWelcomeMessage =
    userRole === "admin"
      ? `Chào mừng trở lại, ${userName}! Bạn có toàn quyền quản lý hệ thống.`
      : `Chào mừng trở lại, ${userName}! Hôm nay có ${todayList.length} lịch hẹn cần theo dõi.`;

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      UserOutlined: <UserOutlined />,
      DollarOutlined: <DollarOutlined />,
      CalendarOutlined: <CalendarOutlined />,
      TrophyOutlined: <TrophyOutlined />,
      CheckCircleOutlined: <CheckCircleOutlined />,
      FileTextOutlined: <FileTextOutlined />,
      MedicineBoxOutlined: <MedicineBoxOutlined />,
    };
    return icons[iconName] || <UserOutlined />;
  };

  const renderDashboard = () => (
    <div style={{ padding: "0" }}>
      {/* Enhanced Welcome Section */}
      <div
        style={{
          marginBottom: "32px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "16px",
          padding: "24px",
          color: "white",
          boxShadow: "0 8px 32px rgba(102, 126, 234, 0.2)",
        }}
      >
        <Row
          align="middle"
          justify="space-between"
        >
          <Col flex="auto">
            <Title
              level={2}
              style={{ margin: 0, color: "white" }}
            >
              {userRole === "admin" ? "Bảng điều khiển Admin" : "Bảng điều khiển Manager"}
            </Title>
            <Text style={{ fontSize: "16px", color: "rgba(255,255,255,0.9)" }}>
              {welcomeMessage || defaultWelcomeMessage}
            </Text>
            <div style={{ marginTop: "8px" }}>
              <Text style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>
                {new Date().toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </div>
          </Col>
          <Col>
            <div
              style={{
                textAlign: "center",
                padding: "16px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                backdropFilter: "blur(10px)",
              }}
            >
              <Title
                level={4}
                style={{ margin: 0, color: "white" }}
              >
                {todayList.length}
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px" }}>
                Lịch hẹn hôm nay
              </Text>
            </div>
          </Col>
        </Row>
      </div>

      {/* Enhanced Stats Cards */}
      <Row
        gutter={[24, 24]}
        style={{ marginBottom: "32px" }}
      >
        {stats.map((stat, index) => (
          <Col
            xs={24}
            sm={12}
            lg={6}
            key={index}
          >
            <EnhancedStatsCard
              title={stat.title}
              value={stat.value}
              suffix={stat.suffix}
              icon={getIconComponent(typeof stat.icon === "string" ? stat.icon : "UserOutlined")}
              color={stat.color}
              change={stat.change || ""}
              trend={stat.trend || "up"}
              onClick={() => {
                // Navigate to specific stat detail page
              }}
            />
          </Col>
        ))}
      </Row>

      {/* Main Content - Simplified Layout */}
      <Row gutter={[24, 24]}>
        {/* Left Column - Today's Schedule & Quick Actions */}
        <Col
          xs={24}
          lg={16}
        >
          <Row gutter={[0, 24]}>
            {/* Today's Appointments */}
            <Col xs={24}>
              <TableWidget
                data={todayList.slice(0, 8)}
                title="Lịch hẹn hôm nay"
                pagination={false}
              />
            </Col>

            {/* Recent Activities - Compact Version */}
            {activities.length > 0 && (
              <Col xs={24}>
                <Card
                  title="Hoạt động gần đây"
                  size="small"
                  style={{
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <List
                    dataSource={activities.slice(0, 3)}
                    renderItem={(item: ActivityItem) => (
                      <List.Item style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              size="small"
                              icon={<UserOutlined />}
                            />
                          }
                          title={<Text style={{ fontSize: "14px" }}>{item.user}</Text>}
                          description={
                            <Text
                              type="secondary"
                              style={{ fontSize: "12px" }}
                            >
                              {item.action}
                            </Text>
                          }
                        />
                        <Text
                          type="secondary"
                          style={{ fontSize: "11px" }}
                        >
                          {item.time ? new Date(item.time).toLocaleTimeString("vi-VN") : ""}
                        </Text>
                      </List.Item>
                    )}
                  />
                  {activities.length > 3 && (
                    <div style={{ textAlign: "center", marginTop: "8px" }}>
                      <Button
                        type="link"
                        size="small"
                      >
                        Xem thêm {activities.length - 3} hoạt động
                      </Button>
                    </div>
                  )}
                </Card>
              </Col>
            )}
          </Row>
        </Col>


      </Row>  

      {/* Optional: Admin-only advanced   features */}
      {userRole === "admin" && (
        <Row
          gutter={[24, 24]}
          style={{ marginTop: "24px" }}
        >
          <Col xs={24}>
            <Card
              title="Quản trị nâng cao"
              size="small"
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Button
                    icon={<SettingOutlined />}
                    block
                    onClick={() => updateSelectedKey("users")}
                  >
                    Quản lý người dùng
                  </Button>
                </Col>
                <Col span={6}>
                  <Button
                    icon={<BarChartOutlined />}
                    block
                    onClick={() => updateSelectedKey("reports")}
                  >
                    Báo cáo & Thống kê
                  </Button>
                </Col>
                <Col span={6}>
                  <Button
                    icon={<SettingOutlined />}
                    block
                    onClick={() => updateSelectedKey("settings")}
                  >
                    Cấu hình hệ thống
                  </Button>
                </Col>
                <Col span={6}>
                  <Button
                    icon={<FileTextOutlined />}
                    block
                    onClick={() => updateSelectedKey("logs")}
                  >
                    Nhật ký hệ thống
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );

  const renderContent = () => {
    switch (selectedKey) {
      case "dashboard":
        return renderDashboard();
      case "users":
        if (userRole === "admin") return <UserManagement />;
        return (
          <div style={{ padding: "24px" }}>
            <Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title>
          </div>
        );
      case "doctors":
        return <DoctorManagement />;
      case "schedule":
        return <DoctorSchedulePage />;
      case "services":
        return <ServiceManagement />;
      case "service-packages":
        return <ServicePackageManagement />;

      case "medicines":
        return <MedicineManagement />;

      case "test-categories":
        return <TestCategoriesManagement />;

      case "refunds":
        return <RefundManagement />;

      case "feedbacks":
        return <FeedbackManagement />;

      case "login-history":
        return <LoginHistoryManagement />;
      case "system-logs":
        if (userRole === "admin") return <SystemLogManagement />;
        return (
          <div style={{ padding: "24px" }}>
            <Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title>
          </div>
        );
      case "reports":
        return <ReportsPage />;
      case "settings":
        if (userRole === "admin") return <SystemConfigsManagement />;
        return (
          <div style={{ padding: "24px" }}>
            <Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Title>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  const menuItems = getMenuItems(userRole);

  const onLogout = async () => {
    const result = await handleLogout();
    if (result.success) navigate("/");
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={250}
        style={{
          background: "#fff",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          overflow: "auto",
          zIndex: 100,
        }}
      >
        <div
          style={{
            padding: "16px",
            textAlign: "center",
            borderBottom: "1px solid #f0f0f0",
            marginBottom: "8px",
          }}
        >
          <Title
            level={4}
            style={{ margin: 0, color: "#1890ff" }}
          >
            {collapsed ? "GHC" : "Gender Healthcare"}
          </Title>
          {!collapsed && (
            <Text
              type="secondary"
              style={{ fontSize: "12px" }}
            >
              {userRole === "admin" ? "Quản trị viên" : "Quản lý"}
            </Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => {
            // Nếu manager chọn mục không có quyền (phòng trường hợp hard reload)
            const allowedKeys = menuItems.map((item) => item.key);
            if (allowedKeys.includes(key)) {
              updateSelectedKey(key);
            } else {
              updateSelectedKey("dashboard");
            }
          }}
          style={{
            border: "none",
            height: "calc(100vh - 100px)", // Trừ đi height của logo/header
            overflowY: "auto",
          }}
        />
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 250,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            position: "fixed",
            top: 0,
            right: 0,
            left: collapsed ? 80 : 250,
            zIndex: 99,
            transition: "left 0.2s",
          }}
        >
          <Button
            type="link"
            icon={<HomeOutlined />}
            onClick={() => navigate("/")}
          >
            Trang chủ
          </Button>
          <Button
            type="link"
            icon={<LogoutOutlined />}
            onClick={onLogout}
          >
            Đăng xuất
          </Button>
        </Header>
        <Content
          style={{
            padding: "24px",
            background: "#f5f5f5",
            overflow: "auto",
            marginTop: 64, // Height của header
            minHeight: "calc(100vh - 64px)",
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ManagementTemplate;
