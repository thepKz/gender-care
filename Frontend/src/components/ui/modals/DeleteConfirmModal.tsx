import React, { useState } from 'react';
import { Modal, Form, Input, Typography, Space, Alert } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface DeleteConfirmModalProps {
  visible: boolean;
  onConfirm: (deleteNote: string) => Promise<void>;
  onCancel: () => void;
  title: string;
  itemName: string;
  description?: string;
  loading?: boolean;
  warningMessage?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  title,
  itemName,
  description,
  loading = false,
  warningMessage
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      setSubmitting(true);
      await onConfirm(values.deleteNote);
      form.resetFields();
    } catch (error) {
      console.error('Delete confirmation error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          {title}
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="Xóa"
      cancelText="Hủy"
      okType="danger"
      confirmLoading={submitting || loading}
      width={500}
    >
      <div className="space-y-4">
        <div>
          <Text strong>Bạn có chắc chắn muốn xóa:</Text>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <Text strong className="text-gray-900">{itemName}</Text>
          </div>
        </div>

        {description && (
          <Alert
            message={description}
            type="warning"
            showIcon
            className="mb-4"
          />
        )}

        {warningMessage && (
          <Alert
            message={warningMessage}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="deleteNote"
            label={
              <Text strong>
                Lý do xóa <span className="text-red-500">*</span>
              </Text>
            }
            rules={[
              { required: true, message: 'Vui lòng nhập lý do xóa' },
              { min: 10, message: 'Lý do xóa phải có ít nhất 10 ký tự' },
              { max: 500, message: 'Lý do xóa không được quá 500 ký tự' }
            ]}
          >
            <TextArea
              placeholder="Nhập lý do xóa (ít nhất 10 ký tự)..."
              rows={4}
              maxLength={500}
              showCount
              style={{ resize: 'none' }}
            />
          </Form.Item>
        </Form>

        <Alert
          message="Lưu ý: Hành động này sẽ ẩn item khỏi hệ thống. Bạn có thể khôi phục lại sau này."
          type="info"
          showIcon
          className="mt-4"
        />
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal; 