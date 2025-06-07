import React from 'react';
import { Button, Space, Typography, Tooltip } from 'antd';
import { 
  LeftOutlined, 
  RightOutlined, 
  CalendarOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  BarsOutlined
} from '@ant-design/icons';
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
  onView,
  onToday,
  label,
  view,
  views,
  date
}) => {
  
  // Handle navigation
  const handlePrevious = () => onNavigate('PREV');
  const handleNext = () => onNavigate('NEXT');
  const handleToday = () => onToday();
  
  // Handle view change
  const handleViewChange = (newView: CalendarView) => {
    onView(newView);
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
          {label}
        </Text>
      </div>

      <div className="calendar-toolbar-right">
        {/* View Switcher */}
        <Space className="calendar-view-switcher">
          {views.map((viewType) => {
            const config = VIEW_CONFIGS[viewType];
            const isActive = view === viewType;
            
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
