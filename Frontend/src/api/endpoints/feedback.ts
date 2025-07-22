import axiosInstance from '../axiosConfig';

// Interface for creating feedback
export interface CreateFeedbackRequest {
  appointmentId: string;
  rating: number;
  feedback: string;
  comment?: string;
  // Optional detailed ratings
  serviceQuality?: number;
  doctorRating?: number;
  facilityRating?: number;
  valueForMoney?: number;
  wouldRecommend?: boolean;
  positiveAspects?: string[];
  improvements?: string[];
}

// Interface for feedback response
export interface FeedbackResponse {
  _id: string;
  rating: number;
  feedback: string;
  comment?: string;
  appointmentId: {
    _id: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    profileId?: {
      _id: string;
      fullName: string;
      gender?: string;
      phone?: string;
    };
  };
  doctorId?: {
    _id: string;
    userId: {
      _id: string;
      fullName: string;
    };
  };
  serviceId?: {
    _id: string;
    serviceName: string;
  };
  packageId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Interface for API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const feedbackApi = {
  // POST /api/feedbacks - Tạo feedback mới
  createFeedback: async (feedbackData: CreateFeedbackRequest): Promise<ApiResponse<FeedbackResponse>> => {
    try {
      console.log('Creating feedback:', JSON.stringify(feedbackData, null, 2));
      const response = await axiosInstance.post('/feedbacks', feedbackData);
      return response.data;
    } catch (error: unknown) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  },

  // GET /api/feedbacks/appointment/:appointmentId - Lấy feedback của appointment
  getFeedbackByAppointment: async (appointmentId: string): Promise<ApiResponse<FeedbackResponse>> => {
    try {
      const response = await axiosInstance.get(`/feedbacks/appointment/${appointmentId}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Error getting feedback by appointment:', error);
      throw error;
    }
  },

  // GET /api/feedbacks/user - Lấy tất cả feedback của user
  getUserFeedbacks: async (): Promise<ApiResponse<FeedbackResponse[]>> => {
    try {
      const response = await axiosInstance.get('/feedbacks/user');
      return response.data;
    } catch (error: unknown) {
      console.error('Error getting user feedbacks:', error);
      throw error;
    }
  },

  // PUT /api/feedbacks/:id - Cập nhật feedback
  updateFeedback: async (
    feedbackId: string, 
    updateData: Partial<CreateFeedbackRequest>
  ): Promise<ApiResponse<FeedbackResponse>> => {
    try {
      console.log('Updating feedback:', feedbackId, updateData);
      const response = await axiosInstance.put(`/feedbacks/${feedbackId}`, updateData);
      return response.data;
    } catch (error: unknown) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  },

  // GET /api/feedbacks/doctor/:doctorId - Lấy feedback của doctor (public)
  getDoctorFeedbacks: async (
    doctorId: string,
    page: number = 1,
    limit: number = 10,
    rating?: number
  ): Promise<ApiResponse<{
    feedbacks: FeedbackResponse[];
    totalCount: number;
    averageRating: number;
    stats: {
      totalFeedbacks: number;
      averageRating: number;
      ratingDistribution: { [key: string]: number };
    };
  }>> => {
    try {
      let url = `/feedbacks/doctor/${doctorId}?page=${page}&limit=${limit}`;
      if (rating && rating >= 1 && rating <= 5) {
        url += `&rating=${rating}`;
      }
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error: unknown) {
      console.error('Error getting doctor feedbacks:', error);
      throw error;
    }
  },

  // PATCH /api/feedbacks/:id/hide - Ẩn/hiện feedback
  hideFeedback: async (feedbackId: string, isHidden: boolean): Promise<ApiResponse<FeedbackResponse>> => {
    try {
      const response = await axiosInstance.patch(`/feedbacks/${feedbackId}/hide`, { isHidden });
      return response.data;
    } catch (error: unknown) {
      console.error('Error hiding feedback:', error);
      throw error;
    }
  },

  // DELETE /api/feedbacks/:id - Xóa feedback
  deleteFeedback: async (feedbackId: string): Promise<ApiResponse<null>> => {
    try {
      const response = await axiosInstance.delete(`/feedbacks/${feedbackId}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  },

  // Utility function để kiểm tra appointment có thể feedback không
  canGiveFeedback: (appointmentStatus: string, hasExistingFeedback: boolean): boolean => {
    return appointmentStatus === 'completed' && !hasExistingFeedback;
  }
}; 