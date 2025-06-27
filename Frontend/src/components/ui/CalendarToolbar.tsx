import {
  AppstoreOutlined,
  BarsOutlined,
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { Button, Space, Tooltip, Typography } from 'antd';
import React from 'react';
import type { CalendarToolbarProps, CalendarView } from '../../types/calendar';

const { Text } = Typography;

// View configurations
const VIEW_CONFIGS: Record<CalendarView, { 
  label: string; 
  icon: React.ReactNode; 
  tooltip: string;
}> = {
  month: {
    label: 'Tháng',
    icon: <AppstoreOutlined />,
    tooltip: 'Xem theo tháng'
  },
  week: {
    label: 'Tuần',
    icon: <BarsOutlined />,
    tooltip: 'Xem theo tuần'
  },
  day: {
    label: 'Ngày',
    icon: <CalendarOutlined />,
    tooltip: 'Xem theo ngày'
  },
  agenda: {
    label: 'Danh sách',
    icon: <UnorderedListOutlined />,
    tooltip: 'Xem dạng danh sách'
  }
};

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  onNavigate,
  onViewChange,
  onToday,
  currentDate,
  currentView,
  views = ['month', 'week', 'day', 'agenda']
}) => {
  
  // Generate label based on current date and view
  const getLabel = () => {
    const date = new Date(currentDate);
    
    switch (currentView) {
      case 'month':
        return date.toLocaleDateString('vi-VN', { 
          month: 'long', 
          year: 'numeric' 
        });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return `${weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'day':
        return date.toLocaleDateString('vi-VN', { 
          weekday: 'long',
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
      case 'agenda':
        return `Lịch trình - ${date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`;
      default:
        return date.toLocaleDateString('vi-VN');
    }
  };
  
  // Handle navigation
  const handlePrevious = () => onNavigate('prev');
  const handleNext = () => onNavigate('next');
  const handleToday = () => onToday();
  
  // Handle view change
  const handleViewChange = (newView: CalendarView) => {
    onViewChange(newView);
  };

  return (
    <div className="calendar-toolbar">
      <div className="calendar-toolbar-left">
        {/* Navigation Buttons */}
        <Space>
          <Tooltip title="Hôm nay">
            <Button
              type="primary"
              onClick={handleToday}
              className="today-btn"
            >
              Hôm nay
            </Button>
          </Tooltip>
          
          <Space.Compact>
            <Tooltip title="Trước">
              <Button
                icon={<LeftOutlined />}
                onClick={handlePrevious}
              />
            </Tooltip>
            <Tooltip title="Sau">
              <Button
                icon={<RightOutlined />}
                onClick={handleNext}
              />
            </Tooltip>
          </Space.Compact>
        </Space>
      </div>

      <div className="calendar-toolbar-center">
        {/* Calendar Label */}
        <Text className="calendar-label">
          {getLabel()}
        </Text>
      </div>

      <div className="calendar-toolbar-right">
        {/* View Switcher */}
        <Space className="calendar-view-switcher">
          {views.map((viewType: CalendarView) => {
            const config = VIEW_CONFIGS[viewType];
            const isActive = currentView === viewType;
            
            return (
              <Tooltip key={viewType} title={config.tooltip}>
                <Button
                  type={isActive ? 'primary' : 'default'}
                  icon={config.icon}
                  onClick={() => handleViewChange(viewType)}
                  className={`view-btn view-btn-${viewType} ${isActive ? 'active' : ''}`}
                >
                  {config.label}
                </Button>
              </Tooltip>
            );
          })}
        </Space>
      </div>
    </div>
  );
};

export default CalendarToolbar;
