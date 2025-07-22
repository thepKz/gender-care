import React from 'react';
import { Card, Typography, Space, Divider } from 'antd';

const { Title, Text, Paragraph } = Typography;

const CertificateParseTest: React.FC = () => {
  // Test data from your actual doctors
  const testCases = [
    {
      name: "Thanh Long Nguyen Tran (Current - JSON Array)",
      data: "[\"https://res.cloudinary.com/dacbvhtgz/image/upload/v1753157639/doctors/srtwme4uad3r03hz1zse.jpg\"]"
    },
    {
      name: "Nguyễn Văn Minh (Current - Comma Separated)",
      data: "Screenshot 2025-05-20 180842.png, Screenshot 2025-05-20 195925.png"
    },
    {
      name: "Multiple Certificates (JSON Array)",
      data: "[\"https://example.com/cert1.jpg\",\"https://example.com/cert2.jpg\",\"https://example.com/cert3.jpg\"]"
    },
    {
      name: "Single Certificate (URL)",
      data: "https://example.com/single-cert.jpg"
    }
  ];

  // Enhanced parse certificates function (matches DoctorManagement logic)
  const parseCertificates = (certificateData: string): string[] => {
    console.log('🏥 [TEST PARSE] Raw certificate data:', certificateData);
    console.log('🏥 [TEST PARSE] Type:', typeof certificateData);

    if (typeof certificateData === 'string' && certificateData.trim()) {
      // Format 1: JSON array - ["url1", "url2"]
      if (certificateData.trim().startsWith('[') && certificateData.trim().endsWith(']')) {
        try {
          const parsed = JSON.parse(certificateData);
          if (Array.isArray(parsed)) {
            console.log('🏥 [TEST PARSE] Successfully parsed JSON array:', parsed);
            return parsed.filter(url => url && url.trim());
          }
        } catch (error) {
          console.error('🏥 [TEST PARSE] JSON parse error:', error);
        }
      }

      // Format 2: Comma-separated URLs - "url1, url2, url3"
      if (certificateData.includes(',')) {
        const urls = certificateData.split(',')
          .map(url => url.trim())
          .filter(url => url && (url.startsWith('http') || url.includes('.')));

        if (urls.length > 0) {
          console.log('🏥 [TEST PARSE] Parsed comma-separated URLs:', urls);
          return urls;
        }
      }

      // Format 3: Single certificate URL or filename
      if (certificateData.startsWith('http') || certificateData.includes('.')) {
        console.log('🏥 [TEST PARSE] Single certificate URL:', certificateData);
        return [certificateData];
      }

      // Format 4: Filename only (old format)
      console.log('🏥 [TEST PARSE] Treating as filename:', certificateData);
      return [certificateData];
    } else if (Array.isArray(certificateData)) {
      console.log('🏥 [TEST PARSE] Already an array:', certificateData);
      return certificateData.filter(url => url && url.trim());
    }

    console.log('🏥 [TEST PARSE] No certificates found');
    return [];
  };

  const formatCertificateUrl = (cert: string): string => {
    if (!cert) return '';
    return cert.startsWith('http') ? cert : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${cert}`;
  };

  // Test all cases
  const testResults = testCases.map(testCase => ({
    ...testCase,
    result: parseCertificates(testCase.data),
    count: parseCertificates(testCase.data).length
  }));

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>Certificate Parse Test</Title>
          
          <div>
            <Title level={4}>Test Results Summary:</Title>
            {testResults.map((test, index) => (
              <div key={index} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #d9d9d9', borderRadius: '8px' }}>
                <Title level={5}>{test.name}</Title>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Input:</Text>
                  <pre style={{
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    margin: '4px 0',
                    wordBreak: 'break-all'
                  }}>
                    {test.data}
                  </pre>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Output ({test.count} certificates):</Text>
                  <pre style={{
                    background: '#f0f8ff',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    margin: '4px 0'
                  }}>
                    {JSON.stringify(test.result, null, 2)}
                  </pre>
                </div>
                <div>
                  <Text type={test.count > 0 ? 'success' : 'danger'}>
                    Status: {test.count > 0 ? '✅ Parsed successfully' : '❌ No certificates found'}
                  </Text>
                </div>
              </div>
            ))}
          </div>

          <Divider />

          <div>
            <Title level={4}>Visual Preview:</Title>
            {parsedCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedCertificates.map((cert, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <img
                      src={formatCertificateUrl(cert)}
                      alt={`Chứng chỉ ${index + 1}`}
                      className="w-full h-48 object-contain rounded bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => window.open(formatCertificateUrl(cert), '_blank')}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Không+thể+tải+chứng+chỉ';
                      }}
                    />
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      Chứng chỉ {index + 1} - Nhấp để xem chi tiết
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary">Không có chứng chỉ nào được tìm thấy</Text>
            )}
          </div>

          <Divider />

          <div>
            <Title level={4}>Test Cases:</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {[
                {
                  name: 'Single Certificate (JSON Array)',
                  data: '["https://example.com/cert1.jpg"]',
                },
                {
                  name: 'Multiple Certificates (JSON Array)',
                  data: '["https://example.com/cert1.jpg","https://example.com/cert2.jpg"]',
                },
                {
                  name: 'Single Certificate (String)',
                  data: 'https://example.com/cert1.jpg',
                },
                {
                  name: 'Comma Separated',
                  data: 'https://example.com/cert1.jpg, https://example.com/cert2.jpg',
                },
                {
                  name: 'Your Actual Data',
                  data: testCertificateData,
                }
              ].map((testCase, index) => {
                const result = parseCertificates(testCase.data);
                return (
                  <div key={index} style={{ marginBottom: '16px' }}>
                    <Text strong>{testCase.name}:</Text>
                    <div style={{ marginLeft: '16px' }}>
                      <Text type="secondary">Input: </Text>
                      <Text code style={{ fontSize: '11px' }}>{testCase.data}</Text>
                      <br />
                      <Text type="secondary">Output: </Text>
                      <Text code>{JSON.stringify(result)}</Text>
                      <br />
                      <Text type="secondary">Count: </Text>
                      <Text>{result.length} certificate(s)</Text>
                    </div>
                  </div>
                );
              })}
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default CertificateParseTest;
