import React, { useEffect, useState } from 'react';
import { Input, message, Modal, Pagination, Select, Tag, Button } from 'antd';
import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    MoneyRecive,
    Profile2User,
    SearchNormal1,
    TickCircle,
    Timer
} from 'iconsax-react';
import { getAllRefundRequests, updateRefundStatus, RefundRequest } from '../../../api/endpoints/refund';

const { Search, TextArea } = Input;
const { Option } = Select;

// RefundRequest interface is imported from API endpoint

const RefundManagement: React.FC = () => {
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RefundRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [managerNotes, setManagerNotes] = useState('');
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Fetch refund requests
  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      
      const response = await getAllRefundRequests({
        page: currentPage,
        limit: pageSize,
        status: statusFilter !== 'all' ? (statusFilter as 'pending' | 'processing' | 'completed' | 'rejected') : undefined
      });
      
      setRefundRequests(response.data.refundRequests);
      setFilteredRequests(response.data.refundRequests);
          } catch {
        message.error('Không thể tải danh sách yêu cầu hoàn tiền');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  // Filter requests
  useEffect(() => {
    let filtered = refundRequests;

    if (searchText) {
      filtered = filtered.filter(req =>
        req.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
        req.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
        req.appointmentId.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchText, statusFilter, refundRequests]);

  // Status configuration
  const statusConfig = {
    pending: { color: '#faad14', text: 'Chờ xử lý', icon: <Timer size={16} /> },
    processing: { color: '#1890ff', text: 'Đang xử lý', icon: <Clock size={16} /> },
    completed: { color: '#52c41a', text: 'Đã hoàn thành', icon: <TickCircle size={16} /> },
    rejected: { color: '#f5222d', text: 'Từ chối', icon: <Calendar size={16} /> }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'Chưa có thông tin';
    }
    try {
      const parsedDate = new Date(dateString);
      if (isNaN(parsedDate.getTime())) {
        return 'Chưa có thông tin';
      }
      return parsedDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Chưa có thông tin';
    }
  };

  const formatAppointmentDateTime = (appointmentDate: string, appointmentTime: string) => {
    if (!appointmentDate || !appointmentTime || 
        appointmentDate === 'null' || appointmentTime === 'null' ||
        appointmentDate === 'undefined' || appointmentTime === 'undefined') {
      return 'Chưa có thông tin lịch hẹn';
    }
    try {
      // Combine date and time properly
      const dateTimeString = `${appointmentDate} ${appointmentTime}`;
      const parsedDate = new Date(dateTimeString);
      if (isNaN(parsedDate.getTime())) {
        return 'Chưa có thông tin lịch hẹn';
      }
      return parsedDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Chưa có thông tin lịch hẹn';
    }
  };

  const handleViewDetail = (request: RefundRequest) => {
    setSelectedRequest(request);
    setManagerNotes(request.notes || '');
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'processing' | 'completed' | 'rejected', notes?: string) => {
    try {
      setProcessing(true);
      
      if (!requestId) {
        throw new Error('Request ID is missing');
      }
      
      await updateRefundStatus(requestId, newStatus, notes);
      
      // Refresh data after update
      await fetchRefundRequests();
      
      const statusText = statusConfig[newStatus].text.toLowerCase();
      message.success(`Đã cập nhật trạng thái thành "${statusText}"`);
      
      setShowDetailModal(false);
      setManagerNotes('');
    } catch {
      message.error('Không thể cập nhật trạng thái');
    } finally {
      setProcessing(false);
    }
  };

  // Get current page requests
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách yêu cầu hoàn tiền...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý yêu cầu hoàn tiền</h1>
          <p className="text-gray-600">Xử lý các yêu cầu hoàn tiền từ khách hàng</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <Search
                placeholder="Tìm theo tên khách hàng, dịch vụ, mã lịch hẹn..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchNormal1 size={16} className="text-gray-400" />}
                allowClear
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full"
                placeholder="Chọn trạng thái"
              >
                <Option value="all">Tất cả</Option>
                <Option value="pending">Chờ xử lý</Option>
                <Option value="processing">Đang xử lý</Option>
                <Option value="completed">Đã hoàn thành</Option>
                <Option value="rejected">Từ chối</Option>
              </Select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchRefundRequests}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors h-fit"
              >
                <MoneyRecive size={16} />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = refundRequests.filter(req => req.status === status).length;
            return (
              <div key={status} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{config.text}</p>
                    <p className="text-2xl font-bold" style={{ color: config.color }}>{count}</p>
                  </div>
                  <div style={{ color: config.color }}>
                    {config.icon}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} trong {filteredRequests.length} yêu cầu
          </p>
        </div>

        {/* Requests Table */}
        {currentRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có yêu cầu hoàn tiền nào</h3>
            <p className="text-gray-600">Khi khách hàng yêu cầu hoàn tiền, chúng sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <motion.div 
            className="bg-white rounded-xl shadow-sm overflow-hidden"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dịch vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày yêu cầu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRequests.map((request) => (
                    <motion.tr
                      key={request.id}
                      variants={item}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Profile2User size={32} className="text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.customerName}</div>
                            <div className="text-sm text-gray-500">{request.customerEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.serviceName}</div>
                        <div className="text-sm text-gray-500">
                          {formatAppointmentDateTime(request.appointmentDate, request.appointmentTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Tag
                          color={statusConfig[request.status as keyof typeof statusConfig]?.color}
                          className="flex items-center gap-1 w-fit"
                        >
                          {statusConfig[request.status as keyof typeof statusConfig]?.icon}
                          {statusConfig[request.status as keyof typeof statusConfig]?.text}
                        </Tag>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.requestedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetail(request)}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                          title="Xem chi tiết và xử lí"
                        >
                          Xem chi tiết và xử lí
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Pagination */}
        {filteredRequests.length > pageSize && (
          <div className="flex justify-center mt-8">
            <Pagination
              current={currentPage}
              total={filteredRequests.length}
              pageSize={pageSize}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => 
                `${range[0]}-${range[1]} trong ${total} yêu cầu`
              }
            />
          </div>
        )}

        {/* Detail Modal */}
        <Modal
          title="Chi tiết yêu cầu hoàn tiền"
          open={showDetailModal}
          onCancel={() => setShowDetailModal(false)}
          footer={null}
          width={900}
        >
          {selectedRequest && (
            <div className="space-y-4">
              {/* Customer & Appointment Info - Combined */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Customer Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Profile2User size={18} className="text-gray-600" />
                      Thông tin khách hàng
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Tên khách hàng</label>
                        <p className="text-sm text-gray-900">{selectedRequest.customerName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Email</label>
                        <p className="text-sm text-gray-900">{selectedRequest.customerEmail}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Số điện thoại</label>
                        <p className="text-sm text-gray-900">{selectedRequest.customerPhone || 'Chưa có'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Info */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Thông tin tài khoản nhận tiền</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Số tài khoản</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedRequest.accountNumber}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Chủ tài khoản</label>
                        <p className="text-sm text-gray-900">{selectedRequest.accountHolderName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Ngân hàng</label>
                        <p className="text-sm text-gray-900">{selectedRequest.bankName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Appointment Info */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar size={18} className="text-gray-600" />
                      Chi tiết lịch hẹn
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Mã lịch hẹn</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedRequest.appointmentId}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Dịch vụ</label>
                        <p className="text-sm text-gray-900 font-medium">{selectedRequest.serviceName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Ngày hẹn</label>
                          <p className="text-sm text-gray-900">{formatDate(selectedRequest.appointmentDate)}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Giờ hẹn</label>
                          <p className="text-sm text-gray-900">{selectedRequest.appointmentTime || 'Chưa có'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Hình thức</label>
                          <p className="text-sm text-gray-900">{
                            selectedRequest.appointmentType === 'online' ? 'Trực tuyến' : 
                            selectedRequest.appointmentType === 'offline' ? 'Phòng khám' : 
                            'Chưa rõ'
                          }</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Ngày đặt</label>
                          <p className="text-sm text-gray-900">{formatDate(selectedRequest.bookingDate || '')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <MoneyRecive size={18} className="text-gray-600" />
                      Thông tin thanh toán
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Chi phí ban đầu</label>
                          <p className="text-sm text-gray-900">{formatPrice(selectedRequest.totalAmount || selectedRequest.refundAmount)}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Số tiền hoàn</label>
                          <p className="text-sm text-blue-600 font-semibold">{formatPrice(selectedRequest.refundAmount)}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Trạng thái thanh toán ban đầu</label>
                        <p className="text-sm text-gray-900">{
                          selectedRequest.originalPaymentStatus === 'success' ? 'Đã thanh toán' :
                          selectedRequest.originalPaymentStatus === 'refunded' ? 'Đã hoàn tiền' :
                          selectedRequest.originalPaymentStatus || 'Chưa rõ'
                        }</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Lý do hủy lịch hẹn</h4>
                <p className="text-sm text-gray-700 italic">"{selectedRequest.reason}"</p>
              </div>

              {/* Status and Processing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Trạng thái xử lý</h4>
                  <Tag
                    color={statusConfig[selectedRequest.status as keyof typeof statusConfig]?.color}
                    className="flex items-center gap-1 w-fit mb-2"
                  >
                    {statusConfig[selectedRequest.status as keyof typeof statusConfig]?.icon}
                    {statusConfig[selectedRequest.status as keyof typeof statusConfig]?.text}
                  </Tag>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Yêu cầu lúc</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedRequest.requestedAt)}</p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin xử lý</h4>
                  {selectedRequest.processedBy ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Xử lý bởi</label>
                        <p className="text-sm font-medium text-green-700">{selectedRequest.processedBy}</p>
                      </div>
                      {selectedRequest.processedAt && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Thời gian xử lý</label>
                          <p className="text-sm text-gray-900">{formatDate(selectedRequest.processedAt)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Chưa được xử lý</p>
                  )}
                </div>
              </div>

              {/* Manager Notes */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Ghi chú xử lý</h4>
                {selectedRequest.notes && (
                  <div className="mb-3 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded">
                    <p className="text-sm text-gray-700">{selectedRequest.notes}</p>
                  </div>
                )}
                
                {/* Chỉ hiển thị ô nhập khi chưa xử lý xong */}
                {(selectedRequest.status === 'pending' || selectedRequest.status === 'processing') && (
                  <TextArea
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    placeholder={selectedRequest.notes ? "Cập nhật ghi chú..." : "Nhập ghi chú xử lý..."}
                    rows={3}
                    className="w-full"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
                
                <div className="flex gap-2">
                  {(selectedRequest.status === 'pending' || selectedRequest.status === 'processing') && (
                    <>
                      <Button
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'completed', managerNotes)}
                        loading={processing}
                        className="bg-green-600 text-white border-green-600 hover:bg-green-700"
                      >
                        Hoàn tất xử lí
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected', managerNotes || 'Không đủ điều kiện hoàn tiền')}
                        loading={processing}
                        danger
                      >
                        Từ chối
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default RefundManagement; 