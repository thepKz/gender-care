import React, { useState, useCallback } from 'react';
import { 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Space, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Badge,
  Collapse
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

// Interface cho filter options
export interface SearchFilterOptions {
  doctorSearch: string;
  selectedDoctorIds: string[];
  selectedTimeSlots: string[];
  selectedDaysOfWeek: number[];
  dateRange: [Dayjs, Dayjs] | null;
  status: ('Free' | 'Booked' | 'Absent')[];
  specializations: string[];
}

// Interface cho doctor data từ API
export interface DoctorOption {
  id: string;
  name: string;
  fullName: string;
  specialization: string;
  totalSlots: number;
  availableSlots: number;
}

export interface AdvancedSearchFilterProps {
  onFilterChange: (filters: SearchFilterOptions) => void;
  onDoctorSearch: (searchTerm: string) => Promise<DoctorOption[]>;
  availableTimeSlots: string[];
  availableSpecializations: string[];
  loading?: boolean;
  totalResults?: number;
  className?: string;
}

// Default time slots
const DEFAULT_TIME_SLOTS = [
  '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
];

// Days of week options
const DAYS_OF_WEEK = [
  { value: 1, label: 'Thứ 2', shortLabel: 'T2' },
  { value: 2, label: 'Thứ 3', shortLabel: 'T3' },
  { value: 3, label: 'Thứ 4', shortLabel: 'T4' },
  { value: 4, label: 'Thứ 5', shortLabel: 'T5' },
  { value: 5, label: 'Thứ 6', shortLabel: 'T6' },
  { value: 6, label: 'Thứ 7', shortLabel: 'T7' },
  { value: 0, label: 'Chủ nhật', shortLabel: 'CN' }
];

// Status options
const STATUS_OPTIONS = [
  { value: 'Free', label: 'Có thể đặt', color: 'green' },
  { value: 'Booked', label: 'Đã đặt lịch', color: 'blue' },
  { value: 'Absent', label: 'Không có mặt', color: 'red' }
];

const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  onFilterChange,
  onDoctorSearch,
  availableTimeSlots = DEFAULT_TIME_SLOTS,
  availableSpecializations = [],
  loading = false,
  totalResults = 0,
  className = ''
}) => {
  // State cho filters
  const [filters, setFilters] = useState<SearchFilterOptions>({
    doctorSearch: '',
    selectedDoctorIds: [],
    selectedTimeSlots: [],
    selectedDaysOfWeek: [],
    dateRange: null,
    status: [],
    specializations: []
  });

  // State cho doctor search
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [doctorSearchLoading, setDoctorSearchLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounced doctor search
  const handleDoctorSearch = useCallback(
    async (searchValue: string) => {
      if (!searchValue.trim()) {
        setDoctorOptions([]);
        return;
      }

      setDoctorSearchLoading(true);
      try {
        const results = await onDoctorSearch(searchValue);
        setDoctorOptions(results);
      } catch (error) {
        console.error('Error searching doctors:', error);
        setDoctorOptions([]);
      } finally {
        setDoctorSearchLoading(false);
      }
    },
    [onDoctorSearch]
  );

  // Update filters và notify parent
  const updateFilters = useCallback((newFilters: Partial<SearchFilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  }, [filters, onFilterChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const emptyFilters: SearchFilterOptions = {
      doctorSearch: '',
      selectedDoctorIds: [],
      selectedTimeSlots: [],
      selectedDaysOfWeek: [],
      dateRange: null,
      status: [],
      specializations: []
    };
    setFilters(emptyFilters);
    setDoctorOptions([]);
    onFilterChange(emptyFilters);
  }, [onFilterChange]);

  // Count active filters
  const activeFilterCount = 
    (filters.selectedDoctorIds.length > 0 ? 1 : 0) +
    (filters.selectedTimeSlots.length > 0 ? 1 : 0) +
    (filters.selectedDaysOfWeek.length > 0 ? 1 : 0) +
    (filters.dateRange ? 1 : 0) +
    (filters.status.length > 0 ? 1 : 0) +
    (filters.specializations.length > 0 ? 1 : 0);

  return (
    <Card className={`advanced-search-filter ${className}`} bodyStyle={{ padding: '16px' }}>
      {/* Main Search Bar */}
      <Row gutter={[16, 16]} align="middle">
        <Col flex="auto">
          <Input.Search
            placeholder="Tìm kiếm bác sĩ theo tên hoặc chuyên khoa..."
            size="large"
            value={filters.doctorSearch}
            onChange={(e) => updateFilters({ doctorSearch: e.target.value })}
            onSearch={handleDoctorSearch}
            loading={doctorSearchLoading}
            prefix={<UserOutlined />}
            allowClear
          />
        </Col>
        
        <Col>
          <Space>
            <Badge count={activeFilterCount} size="small">
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setIsExpanded(!isExpanded)}
                type={isExpanded ? 'primary' : 'default'}
              >
                Bộ lọc
              </Button>
            </Badge>
            
            {activeFilterCount > 0 && (
              <Button 
                icon={<ClearOutlined />}
                onClick={clearAllFilters}
                type="text"
                danger
              >
                Xóa bộ lọc
              </Button>
            )}
            
            <div style={{ fontSize: '14px', color: '#666' }}>
              {totalResults > 0 && `${totalResults} kết quả`}
            </div>
          </Space>
        </Col>
      </Row>

      {/* Advanced Filters - Collapsible */}
      {isExpanded && (
        <Collapse 
          bordered={false} 
          style={{ marginTop: '16px', background: '#fafafa' }}
          defaultActiveKey={['1']}
        >
          <Panel header="Bộ lọc chi tiết" key="1">
            <Row gutter={[16, 16]}>
              {/* Doctor Selection */}
              <Col xs={24} md={8}>
                <label style={{ fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                  <UserOutlined /> Chọn bác sĩ:
                </label>
                <Select
                  mode="multiple"
                  placeholder="Chọn bác sĩ..."
                  value={filters.selectedDoctorIds}
                  onChange={(value) => updateFilters({ selectedDoctorIds: value })}
                  style={{ width: '100%' }}
                  showSearch
                >
                  {doctorOptions.map(doctor => (
                    <Option key={doctor.id} value={doctor.id}>
                      {doctor.fullName} - {doctor.specialization}
                    </Option>
                  ))}
                </Select>
              </Col>

              {/* Time Slots Filter */}
              <Col xs={24} md={8}>
                <label style={{ fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                  <ClockCircleOutlined /> Khung giờ:
                </label>
                <Select
                  mode="multiple"
                  placeholder="Chọn khung giờ..."
                  value={filters.selectedTimeSlots}
                  onChange={(value) => updateFilters({ selectedTimeSlots: value })}
                  style={{ width: '100%' }}
                >
                  {availableTimeSlots.map(slot => (
                    <Option key={slot} value={slot}>{slot}</Option>
                  ))}
                </Select>
              </Col>

              {/* Days of Week Filter */}
              <Col xs={24} md={8}>
                <label style={{ fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                  <CalendarOutlined /> Thứ:
                </label>
                <Select
                  mode="multiple"
                  placeholder="Chọn thứ..."
                  value={filters.selectedDaysOfWeek}
                  onChange={(value) => updateFilters({ selectedDaysOfWeek: value })}
                  style={{ width: '100%' }}
                >
                  {DAYS_OF_WEEK.map(day => (
                    <Option key={day.value} value={day.value}>
                      {day.label}
                    </Option>
                  ))}
                </Select>
              </Col>

              {/* Specialization Filter */}
              <Col xs={24} md={8}>
                <label style={{ fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                  <SearchOutlined /> Chuyên khoa:
                </label>
                <Select
                  mode="multiple"
                  placeholder="Chọn chuyên khoa..."
                  value={filters.specializations}
                  onChange={(value) => updateFilters({ specializations: value })}
                  style={{ width: '100%' }}
                >
                  {availableSpecializations.map(spec => (
                    <Option key={spec} value={spec}>{spec}</Option>
                  ))}
                </Select>
              </Col>

              {/* Status Filter */}
              <Col xs={24} md={8}>
                <label style={{ fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                  <FilterOutlined /> Trạng thái:
                </label>
                <Select
                  mode="multiple"
                  placeholder="Chọn trạng thái..."
                  value={filters.status}
                  onChange={(value) => updateFilters({ status: value })}
                  style={{ width: '100%' }}
                >
                  {STATUS_OPTIONS.map(status => (
                    <Option key={status.value} value={status.value}>
                      <Tag color={status.color}>{status.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Col>

              {/* Date Range Filter */}
              <Col xs={24} md={8}>
                <label style={{ fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                  <CalendarOutlined /> Khoảng thời gian:
                </label>
                <RangePicker
                  value={filters.dateRange}
                  onChange={(dates) => updateFilters({ dateRange: dates })}
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
          </Panel>
        </Collapse>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Row style={{ marginTop: '12px' }}>
          <Col span={24}>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              Bộ lọc đang áp dụng:
            </div>
            <Space wrap>
              {filters.selectedDoctorIds.length > 0 && (
                <Tag closable onClose={() => updateFilters({ selectedDoctorIds: [] })}>
                  {filters.selectedDoctorIds.length} bác sĩ
                </Tag>
              )}
              {filters.selectedTimeSlots.length > 0 && (
                <Tag closable onClose={() => updateFilters({ selectedTimeSlots: [] })}>
                  {filters.selectedTimeSlots.length} khung giờ
                </Tag>
              )}
              {filters.selectedDaysOfWeek.length > 0 && (
                <Tag closable onClose={() => updateFilters({ selectedDaysOfWeek: [] })}>
                  {filters.selectedDaysOfWeek.map(day => 
                    DAYS_OF_WEEK.find(d => d.value === day)?.shortLabel
                  ).join(', ')}
                </Tag>
              )}
              {filters.dateRange && (
                <Tag closable onClose={() => updateFilters({ dateRange: null })}>
                  {filters.dateRange[0].format('DD/MM')} - {filters.dateRange[1].format('DD/MM')}
                </Tag>
              )}
              {filters.status.length > 0 && (
                <Tag closable onClose={() => updateFilters({ status: [] })}>
                  {filters.status.length} trạng thái
                </Tag>
              )}
              {filters.specializations.length > 0 && (
                <Tag closable onClose={() => updateFilters({ specializations: [] })}>
                  {filters.specializations.length} chuyên khoa
                </Tag>
              )}
            </Space>
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default AdvancedSearchFilter; 