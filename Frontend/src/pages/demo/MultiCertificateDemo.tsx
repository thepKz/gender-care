import React, { useState } from 'react';
import { Card, Typography, Space, Button, message, Divider } from 'antd';
import MultiCertificateUploadDemo from '../../components/demo/MultiCertificateUploadDemo';

const { Title, Paragraph, Text } = Typography;

const MultiCertificateDemo: React.FC = () => {
  const [certificates, setCertificates] = useState<string[]>([]);

  const handleCertificatesChange = (newCertificates: string[]) => {
    console.log('Certificates changed:', newCertificates);
    setCertificates(newCertificates);
  };

  const handleSave = () => {
    if (certificates.length === 0) {
      message.warning('Chưa có chứng chỉ nào để lưu!');
      return;
    }

    // Simulate saving to backend
    const jsonData = JSON.stringify(certificates);
    console.log('Saving certificates as JSON:', jsonData);
    
    message.success(`Đã lưu ${certificates.length} chứng chỉ thành công!`);
  };

  const handleLoadDemo = () => {
    // Load demo certificates
    const demoCertificates = [
      'https://via.placeholder.com/400x300/4CAF50/white?text=Certificate+1',
      'https://via.placeholder.com/400x300/2196F3/white?text=Certificate+2',
      'https://via.placeholder.com/400x300/FF9800/white?text=Certificate+3'
    ];
    
    setCertificates(demoCertificates);
    message.info('Đã tải demo certificates!');
  };

  const handleClear = () => {
    setCertificates([]);
    message.info('Đã xóa tất cả certificates!');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>Demo Upload Nhiều Chứng Chỉ</Title>
            <Paragraph>
              Tính năng này cho phép bác sĩ upload nhiều chứng chỉ hành nghề thay vì chỉ một chứng chỉ.
              Dữ liệu sẽ được lưu dưới dạng JSON array trong database.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={3}>Tính năng chính:</Title>
            <ul>
              <li>✅ Upload nhiều chứng chỉ (tối đa 5 file)</li>
              <li>✅ Hỗ trợ JPG, PNG, WebP (tối đa 5MB mỗi file)</li>
              <li>✅ Preview và xóa từng chứng chỉ</li>
              <li>✅ Lưu trữ dưới dạng JSON array</li>
              <li>✅ Hiển thị grid layout trên trang doctor detail</li>
              <li>✅ Click để xem full size</li>
            </ul>
          </div>

          <Divider />

          <div>
            <Space>
              <Button type="primary" onClick={handleSave}>
                Lưu Chứng Chỉ ({certificates.length})
              </Button>
              <Button onClick={handleLoadDemo}>
                Tải Demo Data
              </Button>
              <Button danger onClick={handleClear}>
                Xóa Tất Cả
              </Button>
            </Space>
          </div>

          <MultiCertificateUploadDemo
            initialCertificates={certificates}
            onCertificatesChange={handleCertificatesChange}
            maxCount={5}
          />

          <Divider />

          <div>
            <Title level={4}>Cách hoạt động:</Title>
            <Paragraph>
              <Text strong>1. Frontend:</Text> Component upload sử dụng Ant Design Upload với listType="picture-card" 
              và multiple=true để hỗ trợ upload nhiều file.
            </Paragraph>
            <Paragraph>
              <Text strong>2. Backend:</Text> API endpoint /doctors/upload-image xử lý từng file và trả về URL.
              Các URL được collect thành array.
            </Paragraph>
            <Paragraph>
              <Text strong>3. Database:</Text> Field certificate trong Doctor model lưu JSON string của array URLs.
              Ví dụ: <Text code>["url1", "url2", "url3"]</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>4. Display:</Text> Trang doctor detail parse JSON string thành array và hiển thị 
              dưới dạng grid layout với khả năng click để xem full size.
            </Paragraph>
          </div>

          <div>
            <Title level={4}>JSON Data Structure:</Title>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '8px',
              fontSize: '14px',
              overflow: 'auto'
            }}>
{`// Database storage (certificate field):
"[\\"https://example.com/cert1.jpg\\",\\"https://example.com/cert2.jpg\\"]"

// Parsed for display:
[
  "https://example.com/cert1.jpg",
  "https://example.com/cert2.jpg"
]`}
            </pre>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default MultiCertificateDemo;
