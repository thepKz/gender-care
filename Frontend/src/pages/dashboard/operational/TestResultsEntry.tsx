import React, { useState, useEffect } from 'react';
import { Card, Select, Spin, Empty, notification, DatePicker, Input } from 'antd';
import { TestResultsForm } from '../../../components/feature/medical/TestResultsForm';
import { appointmentApi } from '../../../api/endpoints/appointment';
import ModernButton from '../../../components/ui/ModernButton';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  service: {
    _id: string;
    serviceName: string;
  };
  userProfile: {
    fullName: string;
    phoneNumber: string;
  };
  status: string;
}

const TestResultsEntry: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [showTestForm, setShowTestForm] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      // Lấy appointments của ngày đã chọn
      const response = await appointmentApi.getAllAppointments({
        page: 1,
        limit: 1000
      });
      
      // Lọc chỉ các appointments đã completed và trong ngày được chọn
      const targetDate = selectedDate?.format('YYYY-MM-DD');
      const completedAppointments = response.data.appointments.filter(
        apt => apt.status === 'completed' && 
        dayjs(apt.appointmentDate).format('YYYY-MM-DD') === targetDate
      );
      setAppointments(completedAppointments);
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tải danh sách cuộc hẹn'
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentSelect = (appointmentId: string) => {
    const appointment = appointments.find(apt => apt._id === appointmentId);
    setSelectedAppointment(appointment || null);
    setShowTestForm(false);
  };

  const handleStartTest = () => {
    if (selectedAppointment) {
      setShowTestForm(true);
    }
  };

  const handleTestSuccess = () => {
    notification.success({
      message: 'Thành công',
      description: 'Đã lưu kết quả xét nghiệm thành công!'
    });
    setShowTestForm(false);
    setSelectedAppointment(null);
    loadAppointments(); // Reload để cập nhật status
  };

  // Filter appointments based on search text
  const filteredAppointments = appointments.filter(apt =>
    apt.userProfile.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
    apt.userProfile.phoneNumber.includes(searchText) ||
    apt.service.serviceName.toLowerCase().includes(searchText.toLowerCase())
  );

  if (showTestForm && selectedAppointment) {
    return (
      <div className="testResultsEntry p-6">
        <TestResultsForm
          serviceId={selectedAppointment.service._id}
          testResultId={selectedAppointment._id} // Sử dụng appointmentId
          patientName={selectedAppointment.userProfile.fullName}
          onSuccess={handleTestSuccess}
          onCancel={() => setShowTestForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="testResultsEntry p-6">
      <div className="testResultsEntry__header mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Nhập kết quả xét nghiệm
        </h1>
        <p className="text-gray-600">
          Chọn cuộc hẹn đã hoàn thành để nhập kết quả xét nghiệm
        </p>
      </div>

      <Card className="mb-6">
        <div className="testResultsEntry__filters space-y-4">
          <h3 className="text-lg font-semibold">Lọc cuộc hẹn</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chọn ngày
              </label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                className="w-full"
                size="large"
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm
              </label>
              <Search
                placeholder="Tìm theo tên, SĐT, dịch vụ..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="large"
                allowClear
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="testResultsEntry__appointmentList">
          <h3 className="text-lg font-semibold mb-4">
            Danh sách cuộc hẹn ({filteredAppointments.length})
          </h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Spin size="large" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Empty
              description="Không có cuộc hẹn nào đã hoàn thành trong ngày được chọn"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAppointment?._id === appointment._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAppointmentSelect(appointment._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {appointment.userProfile.fullName}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {appointment.userProfile.phoneNumber}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Dịch vụ:</strong> {appointment.service.serviceName}
                        </p>
                        <p>
                          <strong>Thời gian:</strong>{' '}
                          {dayjs(appointment.appointmentDate).format('DD/MM/YYYY')} lúc{' '}
                          {appointment.appointmentTime}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Đã hoàn thành
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {selectedAppointment && (
        <Card>
          <div className="testResultsEntry__selectedAppointment">
            <h3 className="text-lg font-semibold mb-4">Cuộc hẹn được chọn</h3>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Bệnh nhân</p>
                  <p className="font-medium">{selectedAppointment.userProfile.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-medium">{selectedAppointment.userProfile.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dịch vụ</p>
                  <p className="font-medium">{selectedAppointment.service.serviceName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Thời gian</p>
                  <p className="font-medium">
                    {dayjs(selectedAppointment.appointmentDate).format('DD/MM/YYYY')} lúc{' '}
                    {selectedAppointment.appointmentTime}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <ModernButton
                onClick={handleStartTest}
                variant="primary"
                size="large"
              >
                Bắt đầu nhập kết quả
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAppointment(null)}
                variant="ghost"
                size="large"
              >
                Hủy chọn
              </ModernButton>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TestResultsEntry; 