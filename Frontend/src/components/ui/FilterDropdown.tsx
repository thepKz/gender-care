import { ClearOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, DatePicker, Dropdown, Form, Select } from 'antd';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

const { RangePicker } = DatePicker;

interface FilterValues {
  gender?: 'all' | 'male' | 'female' | 'other';
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null;
}

interface FilterDropdownProps {
  onFilter: (filters: FilterValues) => void;
  onReset: () => void;
  currentFilters?: FilterValues;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  onFilter,
  onReset,
  currentFilters = {}
}) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);

  const handleApplyFilter = () => {
    form.validateFields().then((values) => {
      onFilter(values);
      setVisible(false);
    });
  };

  const handleResetFilter = () => {
    form.resetFields();
    onReset();
    setVisible(false);
  };

  const hasActiveFilters = () => {
    return (
      (currentFilters.gender && currentFilters.gender !== 'all') ||
      (currentFilters.dateRange && currentFilters.dateRange.length === 2)
    );
  };

  const dropdownContent = (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white p-4 rounded-lg shadow-lg border min-w-[280px] max-w-[320px]"
    >
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Bộ lọc hồ sơ</h4>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          gender: currentFilters.gender || 'all',
          dateRange: currentFilters.dateRange
        }}
        size="small"
      >
        <Form.Item
          name="gender"
          label="Giới tính"
        >
          <Select
            placeholder="Tất cả giới tính"
            allowClear
            options={[
              { value: 'all', label: 'Tất cả giới tính' },
              { value: 'male', label: 'Nam' },
              { value: 'female', label: 'Nữ' },
              { value: 'other', label: 'Khác' }
            ]}
          />
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Ngày tạo"
        >
          <RangePicker
            placeholder={['Từ ngày', 'Đến ngày']}
            format="DD/MM/YYYY"
            className="w-full"
            disabledDate={(current) => current && current > dayjs().endOf('day')}
          />
        </Form.Item>

        <div className="flex gap-2 mt-4">
          <Button
            type="primary"
            size="small"
            onClick={handleApplyFilter}
            className="flex-1"
          >
            Áp dụng
          </Button>
          <Button
            size="small"
            onClick={handleResetFilter}
            icon={<ClearOutlined />}
            className="flex-1"
          >
            Xóa bộ lọc
          </Button>
        </div>
      </Form>
    </motion.div>
  );

  return (
    <Dropdown
      open={visible}
      onOpenChange={setVisible}
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      overlayClassName="filter-dropdown-overlay"
      getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
    >
      <Button
        size="large"
        className={`
          ${hasActiveFilters() 
            ? 'bg-[#0C3C54] text-white border-[#0C3C54]' 
            : 'bg-white text-[#0C3C54] border border-[#0C3C54] hover:bg-[#0C3C54]/10'
          } 
          font-medium px-5 py-2 rounded-lg shadow-md relative transition-all duration-200 whitespace-nowrap flex-shrink-0
        `}
        icon={<FilterOutlined />}
      >
        Bộ lọc
        {hasActiveFilters() && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </Button>
    </Dropdown>
  );
};

export default FilterDropdown; 