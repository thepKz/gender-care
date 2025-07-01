import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Typography } from 'antd';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { fetchManagementReports, ReportsResponse } from '../../../api/endpoints/reports';

const { Title } = Typography;

const COLORS = ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'];

const ReportsPage: React.FC = () => {
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await fetchManagementReports();
        setData(resp);
      } catch (err) {
        console.error('Failed to fetch reports data', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) {
    return <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>;
  }

  // Transform data
  const revenueData = data.revenueByMonth;
  const appointments7d = data.appointmentsLast7Days.map((p) => ({ ...p, dateLabel: p.date.slice(5) }));
  const roleDistribution = Object.entries(data.userRoleDistribution).map(([role, count]) => ({ name: role, value: count }));
  const statusCounts = Object.entries(data.appointmentStatusCounts).map(([status, count]) => ({ name: status, value: count }));

  return (
    <div>
      <Title level={2}>Báo cáo & Thống kê</Title>
      <Row gutter={[24, 24]}>
        {/* Revenue Bar Chart */}
        <Col xs={24} lg={12}>
          <Card title="Doanh thu 12 tháng gần nhất">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => value.toLocaleString('vi-VN')} />
                <Bar dataKey="total" fill="#82ca9d" name="Doanh thu (VND)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Appointments line chart */}
        <Col xs={24} lg={12}>
          <Card title="Số lượng lịch hẹn 7 ngày qua">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={appointments7d}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dateLabel" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="Lịch hẹn" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* User role distribution pie */}
        <Col xs={24} lg={12}>
          <Card title="Phân bố vai trò người dùng">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie dataKey="value" data={roleDistribution} cx="50%" cy="50%" outerRadius={100} label>
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Appointment status pie */}
        <Col xs={24} lg={12}>
          <Card title="Tình trạng lịch hẹn (tổng)">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie dataKey="value" data={statusCounts} cx="50%" cy="50%" outerRadius={100} label>
                  {statusCounts.map((entry, index) => (
                    <Cell key={`cell2-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportsPage;