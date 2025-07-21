import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Space,
  Popconfirm,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { systemConfigApi, SystemConfig } from "../../api/endpoints/systemConfig";

const { Title, Text } = Typography;

interface SystemConfigsManagementProps {}

const SystemConfigsManagement: React.FC<SystemConfigsManagementProps> = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [form] = Form.useForm();

  // Fetch configs
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching system configs...');
      const response = await systemConfigApi.getAllConfigs();
      console.log('📊 API Response:', response);
      console.log('📊 Response success:', response.success);
      console.log('📊 Response data:', response.data);
      console.log('📊 Response keys:', Object.keys(response));

      if (response.success) {
        setConfigs(response.data);
        console.log('✅ Configs loaded:', response.data);
      } else {
        console.error('❌ API returned success: false');
        console.error('❌ Full response:', JSON.stringify(response, null, 2));
        message.error('API trả về lỗi: ' + ('Unknown error'));
      }
    } catch (error: any) {
      console.error('❌ Error fetching configs:', error);
      message.error(
        "Lỗi khi tải system configs: " + (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Handle create/update config
  const handleSaveConfig = async (values: { key: string; value: string }) => {
    try {
      // Check for duplicate key when creating new config
      if (!editingConfig) {
        const existingConfig = configs.find(config => config.key === values.key);
        if (existingConfig) {
          message.error(`Config key "${values.key}" đã tồn tại! Vui lòng sử dụng key khác.`);
          return;
        }
      }

      console.log('💾 Saving config:', values);
      const response = await systemConfigApi.setConfig(values.key, values.value);
      console.log('📊 Save response:', response);
      console.log('📊 Save response success:', response?.success);
      console.log('📊 Save response data:', response?.data);

      // Check if response exists and has success property
      if (response && (response.success === true || response.success === undefined)) {
        message.success(editingConfig ? "Cập nhật config thành công!" : "Tạo config thành công!");

        // Close modal and reset form
        setModalVisible(false);
        setEditingConfig(null);
        form.resetFields();

        // Refresh data sau khi save
        console.log('🔄 Refreshing configs after save...');
        await fetchConfigs();

        // Notify other components about config change
        console.log('🔔 Dispatching systemConfigChanged event');
        window.dispatchEvent(new CustomEvent('systemConfigChanged'));
        localStorage.setItem('system_config_updated', Date.now().toString());

        // Also clear the system config cache immediately
        localStorage.removeItem('system_config_cache');
      } else {
        console.error('❌ Save failed - response:', response);
        message.error('Lưu config thất bại: Unknown error');
      }
    } catch (error: any) {
      console.error('❌ Error saving config:', error);
      message.error("Lỗi khi lưu config: " + (error.response?.data?.message || error.message));
    }
  };

  // Handle delete config
  const handleDeleteConfig = async (key: string) => {
    try {
      const response = await systemConfigApi.deleteConfig(key);
      if (response.success) {
        message.success("Xóa config thành công!");
        // Refresh data sau khi delete
        await fetchConfigs();

        // Notify other components about config change
        console.log('🔔 Dispatching systemConfigChanged event');
        window.dispatchEvent(new CustomEvent('systemConfigChanged'));
        localStorage.setItem('system_config_updated', Date.now().toString());

        // Also clear the system config cache immediately
        localStorage.removeItem('system_config_cache');
      }
    } catch (error: any) {
      message.error("Lỗi khi xóa config: " + (error.response?.data?.message || error.message));
    }
  };

  // Handle clear cache
  const handleClearCache = async () => {
    try {
      const response = await systemConfigApi.clearCache();
      if (response.success) {
        message.success("Xóa cache thành công!");
        // Refresh data sau khi clear cache
        await fetchConfigs();

        // Notify other components about config change
        console.log('🔔 Dispatching systemConfigChanged event');
        window.dispatchEvent(new CustomEvent('systemConfigChanged'));
        localStorage.setItem('system_config_updated', Date.now().toString());

        // Also clear the system config cache immediately
        localStorage.removeItem('system_config_cache');
      }
    } catch (error: any) {
      message.error("Lỗi khi xóa cache: " + (error.response?.data?.message || error.message));
    }
  };

  // Open modal for create/edit
  const openModal = (config?: SystemConfig) => {
    setEditingConfig(config || null);
    setModalVisible(true);
    if (config) {
      form.setFieldsValue(config);
    } else {
      form.resetFields();
    }
  };

  // Get config type tag
  const getConfigTypeTag = (key: string) => {
    if (key.includes("timeout") && key.includes("minutes")) {
      return (
        <Tag
          color="orange"
          icon={<ClockCircleOutlined />}
        >
          Timeout (phút)
        </Tag>
      );
    }
    if (key.includes("seconds")) {
      return (
        <Tag
          color="blue"
          icon={<ClockCircleOutlined />}
        >
          Interval (giây)
        </Tag>
      );
    }
    if (key.includes("threshold")) {
      return <Tag color="purple">Threshold</Tag>;
    }
    return <Tag color="default">General</Tag>;
  };

  // Get config description
  const getConfigDescription = (key: string) => {
    const descriptions: { [key: string]: string } = {
      reservation_timeout_minutes: "Thời gian giữ chỗ cho appointment (phút)",
      consultation_timeout_minutes: "Thời gian giữ chỗ cho consultation (phút)",
      payment_reminder_threshold_minutes:
        "Thời gian còn lại để hiển thị cảnh báo thanh toán (phút)",
      auto_refresh_interval_seconds: "Khoảng thời gian tự động refresh trạng thái (giây)",
    };
    return descriptions[key] || "Cấu hình hệ thống";
  };

  const columns = [
    {
      title: "Config Key",
      dataIndex: "key",
      key: "key",
      render: (key: string) => (
        <div>
          <Text strong>{key}</Text>
          <br />
          <Text
            type="secondary"
            style={{ fontSize: "12px" }}
          >
            {getConfigDescription(key)}
          </Text>
        </div>
      ),
    },
    {
      title: "Giá trị",
      dataIndex: "value",
      key: "value",
      render: (value: string, record: SystemConfig) => (
        <div>
          <Text style={{ fontSize: "16px", fontWeight: "bold" }}>{value}</Text>
          <br />
          {getConfigTypeTag(record.key)}
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record: SystemConfig) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc muốn xóa config này?"
            description="Hành động này không thể hoàn tác!"
            onConfirm={() => handleDeleteConfig(record.key)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Tooltip title="Xóa">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Title
              level={3}
              className="mb-2"
            >
              <SettingOutlined className="mr-2" />
              Quản lý System Configs
            </Title>
            <Text type="secondary">
              Quản lý các cấu hình hệ thống như timeout, interval, threshold...
            </Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleClearCache}
              title="Xóa cache configs"
            >
              Clear Cache
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchConfigs}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              Thêm Config
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={configs}
          rowKey="key"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng ${total} configs`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingConfig ? "Chỉnh sửa Config" : "Thêm Config Mới"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingConfig(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveConfig}
          className="mt-4"
        >
          <Form.Item
            label="Config Key"
            name="key"
            rules={[
              { required: true, message: "Vui lòng nhập config key!" },
              { pattern: /^[a-z_]+$/, message: "Key chỉ được chứa chữ thường và dấu gạch dưới!" },
              {
                validator: (_, value) => {
                  if (!editingConfig && value && configs.find(config => config.key === value)) {
                    return Promise.reject(new Error(`Config key "${value}" đã tồn tại!`));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input
              placeholder="Ví dụ: reservation_timeout_minutes"
              disabled={!!editingConfig}
            />
          </Form.Item>

          <Form.Item
            label="Giá trị"
            name="value"
            rules={[
              { required: true, message: "Vui lòng nhập giá trị!" },
              { pattern: /^\d+$/, message: "Giá trị phải là số nguyên dương!" },
            ]}
          >
            <InputNumber
              placeholder="Nhập giá trị số"
              min={1}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
            >
              {editingConfig ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemConfigsManagement;
