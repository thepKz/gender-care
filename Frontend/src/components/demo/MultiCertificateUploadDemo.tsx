import React, { useState } from 'react';
import { Upload, Button, message, Card, Image, Space, Typography } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;

interface MultiCertificateUploadDemoProps {
  initialCertificates?: string[];
  onCertificatesChange?: (certificates: string[]) => void;
  maxCount?: number;
}

const MultiCertificateUploadDemo: React.FC<MultiCertificateUploadDemoProps> = ({
  initialCertificates = [],
  onCertificatesChange,
  maxCount = 5
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>(() => {
    return initialCertificates.map((cert, index) => ({
      uid: `cert-${index}`,
      name: `certificate-${index + 1}`,
      status: 'done' as const,
      url: cert,
      thumbUrl: cert,
    }));
  });

  const [certificates, setCertificates] = useState<string[]>(initialCertificates);

  const handleUploadChange = (info: any) => {
    console.log('Upload change:', info);
    setFileList(info.fileList);

    // Extract successful uploads
    const successfulUploads = info.fileList
      .filter((file: UploadFile) => file.status === 'done')
      .map((file: UploadFile) => {
        if (file.response?.success) {
          return file.response.data.imageUrl;
        }
        return file.url || '';
      })
      .filter((url: string) => url);

    setCertificates(successfulUploads);
    onCertificatesChange?.(successfulUploads);

    // Handle upload status messages
    if (info.file.status === 'done') {
      if (info.file.response?.success) {
        message.success(`Upload chứng chỉ "${info.file.name}" thành công!`);
      } else {
        message.error(`Upload chứng chỉ "${info.file.name}" thất bại!`);
      }
    } else if (info.file.status === 'error') {
      message.error(`Upload chứng chỉ "${info.file.name}" thất bại!`);
    }
  };

  const handleRemove = (file: UploadFile) => {
    console.log('Remove certificate:', file);
    
    // Remove from certificates array
    const imageUrl = file.response?.data?.imageUrl || file.url;
    const newCertificates = certificates.filter(cert => cert !== imageUrl);
    setCertificates(newCertificates);
    onCertificatesChange?.(newCertificates);

    message.success('Đã xóa chứng chỉ!');
    return true;
  };

  const handlePreview = (file: UploadFile) => {
    console.log('Preview file:', file);
    const url = file.url || file.thumbUrl;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const beforeUpload = (file: File): boolean => {
    const isValidFormat = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
    if (!isValidFormat) {
      message.error('Chỉ hỗ trợ file JPG, PNG, WebP!');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Kích thước file phải nhỏ hơn 5MB!');
      return false;
    }

    return true;
  };

  return (
    <Card title="Demo Upload Nhiều Chứng Chỉ" style={{ maxWidth: 800, margin: '20px auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Chứng chỉ hành nghề</Title>
          <Text type="secondary">
            Có thể upload tối đa {maxCount} chứng chỉ. Hỗ trợ JPG, PNG, WebP (tối đa 5MB mỗi file).
          </Text>
        </div>

        <Upload
          name="image"
          listType="picture-card"
          multiple
          action="http://localhost:5000/api/doctors/upload-image" // Replace with your actual endpoint
          headers={{
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
          }}
          beforeUpload={beforeUpload}
          onChange={handleUploadChange}
          onRemove={handleRemove}
          onPreview={handlePreview}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          showUploadList={{
            showPreviewIcon: true,
            showDownloadIcon: false,
            showRemoveIcon: true,
          }}
          fileList={fileList}
          maxCount={maxCount}
        >
          {fileList.length >= maxCount ? null : (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Thêm chứng chỉ</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                JPG/PNG/WebP, tối đa 5MB
              </div>
            </div>
          )}
        </Upload>

        {/* Display current certificates as JSON */}
        <div>
          <Title level={5}>Dữ liệu chứng chỉ hiện tại:</Title>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {JSON.stringify(certificates, null, 2)}
          </pre>
        </div>

        {/* Preview grid */}
        {certificates.length > 0 && (
          <div>
            <Title level={5}>Xem trước chứng chỉ:</Title>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '16px' 
            }}>
              {certificates.map((cert, index) => (
                <Card
                  key={index}
                  size="small"
                  cover={
                    <Image
                      src={cert}
                      alt={`Chứng chỉ ${index + 1}`}
                      style={{ height: 150, objectFit: 'contain' }}
                      preview={{
                        mask: <EyeOutlined />
                      }}
                    />
                  }
                  actions={[
                    <Button 
                      key="view"
                      type="link" 
                      icon={<EyeOutlined />}
                      onClick={() => window.open(cert, '_blank')}
                    >
                      Xem
                    </Button>,
                    <Button 
                      key="delete"
                      type="link" 
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        const newCerts = certificates.filter((_, i) => i !== index);
                        setCertificates(newCerts);
                        onCertificatesChange?.(newCerts);
                        
                        // Update fileList
                        const newFileList = fileList.filter((_, i) => i !== index);
                        setFileList(newFileList);
                        
                        message.success('Đã xóa chứng chỉ!');
                      }}
                    >
                      Xóa
                    </Button>
                  ]}
                >
                  <Card.Meta 
                    title={`Chứng chỉ ${index + 1}`}
                    description="Nhấp để xem chi tiết"
                  />
                </Card>
              ))}
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default MultiCertificateUploadDemo;
