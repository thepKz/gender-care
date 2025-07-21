import { Rate, Pagination, Empty } from 'antd';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { feedbackApi, FeedbackResponse } from '../../api/endpoints/feedback';
import ModernCard from './ModernCard';

interface DoctorFeedbacksProps {
  doctorId: string;
}

interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: { [key: string]: number };
}

const DoctorFeedbacks: React.FC<DoctorFeedbacksProps> = ({ doctorId }) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 5;

  const loadFeedbacks = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await feedbackApi.getDoctorFeedbacks(doctorId, page, pageSize);
      
      if (response.success) {
        setFeedbacks(response.data.feedbacks);
        setStats(response.data.stats);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      console.error('Error loading doctor feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      loadFeedbacks(currentPage);
    }
  }, [doctorId, currentPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thống kê tổng quan */}
      {stats && stats.totalFeedbacks > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ModernCard variant="default" className="bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">
                Đánh giá từ bệnh nhân
              </h3>
              
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-600">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <Rate 
                    disabled 
                    value={stats.averageRating} 
                    allowHalf
                    className="text-yellow-400"
                  />
                  <div className="text-sm text-gray-600 mt-2">
                    Từ {stats.totalFeedbacks} đánh giá
                  </div>
                </div>
              </div>

              {/* Distribution bars */}
              <div className="space-y-2 max-w-sm mx-auto">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-right">{star}⭐</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${stats.totalFeedbacks > 0 ? (stats.ratingDistribution[star] / stats.totalFeedbacks) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="w-8 text-left text-gray-600">
                      {stats.ratingDistribution[star] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ModernCard>
        </motion.div>
      )}

      {/* Danh sách feedback */}
      <div className="space-y-4">
        <h4 className="text-xl font-semibold text-gray-900">
          Nhận xét của bệnh nhân
        </h4>
        
        {feedbacks.length === 0 ? (
          <Empty 
            description="Chưa có đánh giá nào"
            className="py-8"
          />
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback, index) => (
              <motion.div
                key={feedback._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ModernCard variant="default">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Rate 
                          disabled 
                          value={feedback.rating} 
                          className="text-yellow-400 text-sm"
                        />
                        <span className="text-gray-600 text-sm">
                          {formatDate(feedback.createdAt)}
                        </span>
                      </div>
                      {feedback.serviceId && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {feedback.serviceId.serviceName}
                        </span>
                      )}
                    </div>

                    <div className="text-gray-800 leading-relaxed">
                      "{feedback.feedback}"
                    </div>

                    {feedback.comment && feedback.comment !== feedback.feedback && (
                      <div className="text-gray-600 text-sm italic border-l-4 border-gray-200 pl-3">
                        {feedback.comment}
                      </div>
                    )}
                  </div>
                </ModernCard>
              </motion.div>
            ))}

            {/* Pagination */}
            {totalCount > pageSize && (
              <div className="flex justify-center mt-6">
                <Pagination
                  current={currentPage}
                  total={totalCount}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showQuickJumper={false}
                  itemRender={(page, type, originalElement) => {
                    if (type === 'prev') {
                      return (
                        <span className="px-3 py-2 text-gray-600 hover:text-blue-600 cursor-pointer">
                          Trước
                        </span>
                      );
                    }
                    if (type === 'next') {
                      return (
                        <span className="px-3 py-2 text-gray-600 hover:text-blue-600 cursor-pointer">
                          Sau
                        </span>
                      );
                    }
                    return originalElement;
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorFeedbacks; 