import axios from "../../api/axiosConfig";

export interface PostQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
}

export const fetchPosts = async (params: PostQueryParams = {}) => {
  const { data } = await axios.get("/posts", { params });
  return data.data || data; // compat
};

export const fetchPostBySlug = async (slug: string) => {
  const { data } = await axios.get(`/posts/${slug}`);
  return data.data || data;
}; 