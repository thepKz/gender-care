import React, { ReactNode } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  Table,
  Statistic,
  Input,
  Select,
  Switch,
  Tooltip,
  Flex
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

export interface ManagementStat {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  suffix?: string;
  precision?: number;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'switch' | 'search';
  options?: { label: string; value: string }[];
  placeholder?: string;
  value?: any;
  onChange?: (value: any) => void;
}

export interface ActionButton {
  key: string;
  label: string;
  icon: ReactNode;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface StandardManagementPageProps {
  // Page Info
  title: string;
  subtitle?: string;
  
  // Stats Section
  stats?: ManagementStat[];
  
  // Filters & Search
  filters?: FilterOption[];
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  
  // Actions
  primaryAction?: ActionButton;
  secondaryActions?: ActionButton[];
  
  // Table
  children: ReactNode; // Table component
  
  // Loading states
  loading?: boolean;
  
  // Extra content
  extra?: ReactNode;
}

const StandardManagementPage: React.FC<StandardManagementPageProps> = ({
  title,
  subtitle,
  stats = [],
  filters = [],
  onSearch,
  searchPlaceholder = "Tìm kiếm...",
  primaryAction,
  secondaryActions = [],
  children,
  loading = false,
  extra
}) => {
  // Render stats cards
  const renderStats = () => {
    if (stats.length === 0) return null;
    
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                precision={stat.precision}
                suffix={stat.suffix}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // Render filters section
  const renderFilters = () => {
    if (filters.length === 0 && !onSearch) return null;

    return (
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle" style={{ width: '100%' }}>
          {/* Search */}
          {onSearch && (
            <Search
              placeholder={searchPlaceholder}
              allowClear
              onSearch={onSearch}
              style={{ width: 250 }}
              enterButton={<SearchOutlined />}
            />
          )}
          
          {/* Dynamic Filters */}
          {filters.map((filter) => {
            switch (filter.type) {
              case 'select':
                return (
                  <Select
                    key={filter.key}
                    placeholder={filter.placeholder || filter.label}
                    style={{ width: 150 }}
                    value={filter.value}
                    onChange={filter.onChange}
                    allowClear
                  >
                    {filter.options?.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                );
              
              case 'switch':
                return (
                  <Space key={filter.key} align="center">
                    <Text>{filter.label}:</Text>
                    <Switch
                      checked={filter.value}
                      onChange={filter.onChange}
                    />
                  </Space>
                );
              
              default:
                return null;
            }
          })}
        </Space>
      </Card>
    );
  };

  // Render action buttons
  const renderActions = () => {
    const hasActions = primaryAction || secondaryActions.length > 0;
    if (!hasActions) return null;

    return (
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <div>
          {primaryAction && (
            <Button
              type={primaryAction.type || 'primary'}
              icon={primaryAction.icon}
              onClick={primaryAction.onClick}
              loading={primaryAction.loading}
              disabled={primaryAction.disabled}
              size="large"
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
        
        <Space>
          {secondaryActions.map((action) => (
            <Button
              key={action.key}
              type={action.type || 'default'}
              icon={action.icon}
              onClick={action.onClick}
              loading={action.loading}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      </Flex>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          {title}
        </Title>
        {subtitle && (
          <Text type="secondary" style={{ fontSize: '16px' }}>
            {subtitle}
          </Text>
        )}
        {extra && <div style={{ marginTop: 8 }}>{extra}</div>}
      </div>

      {/* Stats Cards */}
      {renderStats()}

      {/* Filters & Search */}
      {renderFilters()}

      {/* Action Buttons */}
      {renderActions()}

      {/* Main Content (Table) */}
      <Card>
        {children}
      </Card>
    </div>
  );
};

export default StandardManagementPage; 