import React from 'react';
import { Dropdown, Button } from 'antd';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal, Settings, User, LogOut } from 'lucide-react';

const DropdownTestComponent: React.FC = () => {
  // Test data cho Antd dropdown
  const antdMenuItems = [
    {
      key: '1',
      label: 'Profile',
      icon: <User size={16} />,
    },
    {
      key: '2',
      label: 'Settings',
      icon: <Settings size={16} />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: '3',
      label: 'Logout',
      icon: <LogOut size={16} />,
      danger: true,
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Dropdown Test Components</h2>
      
      {/* Antd Dropdown with Hover */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Antd Dropdown (Hover)</h3>
        <Dropdown
          menu={{ items: antdMenuItems }}
          placement="bottomLeft"
          trigger={['hover']}
          mouseEnterDelay={0.1}
          mouseLeaveDelay={0.3}
          className="dropdown-hover-area"
          overlayClassName="test-dropdown-overlay"
        >
          <Button icon={<MoreHorizontal />}>
            Hover để xem dropdown
          </Button>
        </Dropdown>
      </div>

      {/* Antd Dropdown with Click */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Antd Dropdown (Click)</h3>
        <Dropdown
          menu={{ items: antdMenuItems }}
          placement="bottomLeft"
          trigger={['click']}
        >
          <Button icon={<MoreHorizontal />}>
            Click để xem dropdown
          </Button>
        </Dropdown>
      </div>

      {/* Radix UI Dropdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Radix UI Dropdown</h3>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button icon={<Settings />}>
              Radix Dropdown
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 text-sm z-50 min-w-[180px] editor-dropdown-content">
              <DropdownMenu.Item className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                <User size={16} />
                <span>Profile</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                <Settings size={16} />
                <span>Settings</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-gray-200 my-2" />
              <DropdownMenu.Item className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut size={16} />
                <span>Logout</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Test Instructions:</h4>
        <ul className="text-blue-700 space-y-1">
          <li>• Hover vào dropdown đầu tiên - nó sẽ mở sau 0.1s</li>
          <li>• Di chuyển chuột ra khỏi dropdown - nó sẽ đóng sau 0.3s</li>
          <li>• Click vào dropdown thứ hai để test click trigger</li>
          <li>• Test Radix UI dropdown để đảm bảo hover hoạt động tốt</li>
          <li>• Kiểm tra z-index không bị conflict</li>
        </ul>
      </div>
    </div>
  );
};

export default DropdownTestComponent; 