import {
    CalendarOutlined,
    EyeOutlined,
    ReloadOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Empty,
    message,
    Row,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import doctorScheduleApi, {
    type IDoctorSchedule
} from '../../../api/endpoints/doctorSchedule';

const { Title, Text } = Typography;

interface ScheduleViewData {
  key: string;
  doctorName: string;
  doctorId: string;
  specialization: string;
  dayOfWeek: string;
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  scheduleId: string;
}

const StaffDoctorSchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<IDoctorSchedule[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);

  // Load schedules for selected month
  useEffect(() => {
    loadSchedules();
  }, [selectedMonth]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await doctorScheduleApi.getSchedulesByMonth(
        selectedMonth.month() + 1,
        selectedMonth.year()
      );
      setSchedules(data);
    } catch (error: any) {
      console.error('Lỗi tải lịch làm việc:', error);
      message.error('Không thể tải lịch làm việc');
    } finally {
      setLoading(false);
    }
  };

  // Transform schedules data for table display
  const getTableData = (): ScheduleViewData[] => {
    const tableData: ScheduleViewData[] = [];

    schedules.forEach(schedule => {
      const doctor = schedule.doctorId;
      
      schedule.weekSchedule.forEach(weekDay => {
        // Filter by selected month
        const dayDate = dayjs(weekDay.dayOfWeek);
        if (!dayDate.isSame(selectedMonth, 'month')) {
          return;
        }

        const availableSlots = weekDay.slots.filter(slot => slot.status === 'Free').length;
        const bookedSlots = weekDay.slots.filter(slot => slot.status === 'Booked').length;

        tableData.push({
          key: `${schedule._id}_${weekDay._id}`,
          doctorName: doctor.userId.fullName,
          doctorId: doctor._id,
          specialization: doctor.specialization || 'Chưa xác định',
          dayOfWeek: dayDate.format('DD/MM/YYYY - dddd'),
          totalSlots: weekDay.slots.length,
          availableSlots,
          bookedSlots,
          scheduleId: schedule._id
        });
      });
    });

    return tableData.sort((a, b) => {
      // Sort by doctor name, then by date
      if (a.doctorName !== b.doctorName) {
        return a.doctorName.localeCompare(b.doctorName);
      }
      return a.dayOfWeek.localeCompare(b.dayOfWeek);
    });
  };

  const columns: ColumnsType<ScheduleViewData> = [
    {
      title: 'Bác sĩ',
      key: 'doctor',
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.doctorName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.specialization}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Ngày làm việc',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      render: (dayOfWeek) => (
        <Space>
          <CalendarOutlined />
          <Text>{dayOfWeek}</Text>
        </Space>
      ),
    },
    {
      title: 'Tổng slot',
      dataIndex: 'totalSlots',
      key: 'totalSlots',
      align: 'center',
      render: (total) => <Tag color="blue">{total}</Tag>,
    },
    {
      title: 'Slot trống',
      dataIndex: 'availableSlots',
      key: 'availableSlots',
      align: 'center',
      render: (available) => <Tag color="green">{available}</Tag>,
    },
    {
      title: 'Đã đặt',
      dataIndex: 'bookedSlots',
      key: 'bookedSlots',
      align: 'center',
      render: (booked) => <Tag color="red">{booked}</Tag>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        const { availableSlots, totalSlots } = record;
        if (availableSlots === totalSlots) {
          return <Tag color="green">Sẵn sàng</Tag>;
        } else if (availableSlots === 0) {
          return <Tag color="red">Hết slot</Tag>;
        } else {
          return <Tag color="orange">Một phần</Tag>;
        }
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                // TODO: Implement view details functionality
                message.info('Chức năng xem chi tiết sẽ được cập nhật');
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const tableData = getTableData();

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Lịch làm việc bác sĩ
        </Title>
        <Text type="secondary">
          Xem lịch làm việc của các bác sĩ (Staff)
        </Text>
      </div>

      {/* Controls */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Chọn tháng:</Text>
          </Col>
          <Col>
            <DatePicker.MonthPicker
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date || dayjs())}
              format="MM/YYYY"
              placeholder="Chọn tháng"
            />
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadSchedules}
              loading={loading}
            >
              Tải lại
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Schedule Table */}
      <Card title={`Lịch làm việc tháng ${selectedMonth.format('MM/YYYY')}`}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Đang tải dữ liệu...</div>
          </div>
        ) : tableData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">Không có dữ liệu lịch làm việc</Text>
                <br />
                <Text type="secondary">Chưa có bác sĩ nào tạo lịch làm việc</Text>
              </div>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={tableData}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Tổng cộng ${total} lịch làm việc`,
            }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>
    </div>
  );
};

export default StaffDoctorSchedulePage; 