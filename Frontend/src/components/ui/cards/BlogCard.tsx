import { Card, Tag } from "antd";
import { motion } from "framer-motion";
import { Eye, Heart } from "iconsax-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { getPostId } from "../../../utils/blogUtils";

// Reuse lightweight type for UI purposes (can be replaced by shared type)
interface BlogPostUI {
  id?: number | string;
  _id?: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
  };
  category: string;
  readTime: number;
  image: string;
  views: number;
  likes: number;
  isFeatured?: boolean;
}

interface BlogCardProps {
  post: BlogPostUI;
  onClick?: (post: BlogPostUI) => void;
  className?: string;
}

const BlogCard: React.FC<BlogCardProps> = ({ post, onClick, className = "" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick(post);
    else {
      const postId = getPostId(post);
      if (postId) {
        navigate(`/blog/${postId}`, { state: post });
      } else {
        console.error('BlogCard: Cannot navigate - no valid post ID found');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -10 }}
      className={`group cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <Card
        hoverable
        className="h-full border-0 shadow-lg group-hover:shadow-2xl transition-all duration-500 overflow-hidden rounded-2xl"
        cover={
          <div className="relative h-48 overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

            {/* Featured Badge */}
            {post.isFeatured && (
              <div className="absolute top-4 left-4">
                <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Nổi bật
                </div>
              </div>
            )}

            {/* Stats Overlay */}
            <div className="absolute bottom-4 left-4 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-1 text-white text-sm">
                <Eye size={14} /> <span>{post.views}</span>
              </div>
              <div className="flex items-center gap-1 text-white text-sm">
                <Heart size={14} /> <span>{post.likes}</span>
              </div>
            </div>
          </div>
        }
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag color="cyan">{post.category}</Tag>
            <span className="text-sm text-gray-500">{post.readTime} phút đọc</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-[#0C3C54] transition-colors line-clamp-2 min-h-[3.5rem]">
            {post.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3 min-h-[4rem]">{post.excerpt}</p>
          <div className="flex items-center gap-3 mt-4">
            <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full object-cover" />
            <span className="text-sm text-gray-700 font-medium">{post.author.name}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default BlogCard; 