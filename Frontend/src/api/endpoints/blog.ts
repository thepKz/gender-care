import axiosInstance from '../axiosConfig';

interface CommentParams {
  content: string;
  isAnonymous?: boolean;
}

const blogApi = {
  // Lấy danh sách bài viết blog
  getPosts: (params?: any) => {
    return axiosInstance.get('/blog/posts', { params });
  },
  
  // Lấy chi tiết bài viết
  getPostDetail: (slug: string) => {
    return axiosInstance.get(`/blog/posts/${slug}`);
  },
  
  // Lấy danh sách bài viết theo danh mục
  getPostsByCategory: (categoryId: string, params?: any) => {
    return axiosInstance.get(`/blog/categories/${categoryId}/posts`, { params });
  },
  
  // Lấy danh sách danh mục
  getCategories: () => {
    return axiosInstance.get('/blog/categories');
  },
  
  // Lấy bài viết liên quan
  getRelatedPosts: (postId: string) => {
    return axiosInstance.get(`/blog/posts/${postId}/related`);
  },
  
  // Thêm bình luận vào bài viết
  addComment: (postId: string, data: CommentParams) => {
    return axiosInstance.post(`/blog/posts/${postId}/comments`, data);
  },
  
  // Lấy danh sách bình luận của bài viết
  getComments: (postId: string, params?: any) => {
    return axiosInstance.get(`/blog/posts/${postId}/comments`, { params });
  },
  
  // Tìm kiếm bài viết
  searchPosts: (keyword: string) => {
    return axiosInstance.get('/blog/search', { 
      params: { keyword } 
    });
  },
  
  // Đánh dấu bài viết yêu thích
  likePost: (postId: string) => {
    return axiosInstance.post(`/blog/posts/${postId}/like`);
  },
  
  // Bỏ đánh dấu bài viết yêu thích
  unlikePost: (postId: string) => {
    return axiosInstance.delete(`/blog/posts/${postId}/like`);
  },
  
  // Lấy danh sách bài viết phổ biến
  getPopularPosts: () => {
    return axiosInstance.get('/blog/popular-posts');
  }
};

export default blogApi; 