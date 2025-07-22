import React from 'react';
import { Card, Typography } from 'antd';
import { formatCustomerName } from '../../utils/nameUtils';

const { Title, Text } = Typography;

const NameFormatDemo: React.FC = () => {
  const testNames = [
    'Trần Minh Trung',
    'Lê Châu Thành', 
    'Nguyễn Hồng Bích',
    'Võ Thị Mai',
    'Mai Anh',
    'Mai',
    'Nguyễn Thị Phương Lan',
    'Hoàng Văn An Khang'
  ];

  return (
    <Card>
      <Title level={3}>Demo Format Tên Khách Hàng</Title>
      <div className="space-y-2">
        {testNames.map((name, index) => (
          <div key={index} className="flex items-center gap-4 p-2 border-b border-gray-100">
            <Text className="w-48 font-medium">{name}</Text>
            <Text className="text-gray-500">→</Text>
            <Text className="font-bold text-blue-600">{formatCustomerName(name)}</Text>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default NameFormatDemo; 