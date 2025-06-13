import { Input, Pagination, Spin, Card, Tag, Button } from "antd";
import { motion } from "framer-motion";
import {
    DocumentText,
    Eye,
    Heart,
    SearchNormal1,
    Share
} from "iconsax-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Image1 from "../../assets/images/image1.jpg";
import Image2 from "../../assets/images/image2.jpg";
import Image3 from "../../assets/images/image3.jpg";
import { AnimatedSection } from "../../shared";
import BlogCard from "../../components/ui/cards/BlogCard";
import { slugify } from "../../utils/slugify";
import blogPostsData from "../../assets/data/blogPosts";

// MagicUI Components
import { BlurFade } from '../../components/ui/blur-fade';
import { WarpBackground } from '../../components/ui/warp-background';
import { BoxReveal } from '../../components/ui/box-reveal';
import { SparklesText } from '../../components/ui/sparkles-text';
import { NumberTicker } from '../../components/ui/number-ticker';

const { Search } = Input;

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    title: string;
  };
  category: string;
  tags: string[];
  publishDate: string;
  readTime: number;
  views: number;
  likes: number;
  image: string;
  isFeatured: boolean;
}

interface Category {
  key: string;
  label: string;
  count: number;
  color: string;
}

const Blog = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const pageSize = 6;

  // Dữ liệu blog thực tế dùng trong trang (có thể đến từ API sau này)
  const blogPosts = blogPostsData;

  // Statistics data
  const stats = [
    { 
      icon: <DocumentText size={32} variant="Bold" />, 
      number: blogPosts.length, 
      suffix: '+', 
      label: 'Bài viết hữu ích',
      color: '#0C3C54'
    },
    { 
      icon: <Eye size={32} variant="Bold" />, 
      number: 250000, 
      suffix: '+', 
      label: 'Lượt đọc mỗi tháng',
      color: '#2A7F9E'
    },
    { 
      icon: <Heart size={32} variant="Bold" />, 
      number: 15000, 
      suffix: '+', 
      label: 'Lượt thích',
      color: '#E91E63'
    },
    { 
      icon: <Share size={32} variant="Bold" />, 
      number: 5000, 
      suffix: '+', 
      label: 'Lượt chia sẻ',
      color: '#4CAF50'
    }
  ];

  const categories: Category[] = [
    { key: "all", label: "Tất cả", count: blogPosts.length, color: "#0C3C54" },
    { key: "women-health", label: "Sức khỏe phụ nữ", count: blogPosts.filter(p => p.category === "women-health").length, color: "#E91E63" },
    { key: "men-health", label: "Sức khỏe nam giới", count: blogPosts.filter(p => p.category === "men-health").length, color: "#2196F3" },
    { key: "testing", label: "Xét nghiệm", count: blogPosts.filter(p => p.category === "testing").length, color: "#4CAF50" },
    { key: "psychology", label: "Tâm lý", count: blogPosts.filter(p => p.category === "psychology").length, color: "#FF9800" },
    { key: "family-planning", label: "Kế hoạch gia đình", count: blogPosts.filter(p => p.category === "family-planning").length, color: "#9C27B0" },
    { key: "marriage", label: "Hôn nhân", count: blogPosts.filter(p => p.category === "marriage").length, color: "#F44336" },
    { key: "nutrition", label: "Dinh dưỡng", count: blogPosts.filter(p => p.category === "nutrition").length, color: "#8BC34A" },
    { key: "trends", label: "Xu hướng", count: blogPosts.filter(p => p.category === "trends").length, color: "#607D8B" }
  ];

  const sortOptions = [
    { value: "latest", label: "Mới nhất" },
    { value: "popular", label: "Phổ biến nhất" },
    { value: "most-liked", label: "Nhiều lượt thích" },
    { value: "most-viewed", label: "Nhiều lượt xem" }
  ];

  // Filter and sort posts
  const filteredPosts = blogPosts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        case "popular":
          return b.views - a.views;
        case "most-liked":
          return b.likes - a.likes;
        case "most-viewed":
          return b.views - a.views;
        default:
          return 0;
      }
    });

  const featuredPosts = blogPosts.filter(post => post.isFeatured).slice(0, 3);
  
  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleLike = (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLikedPosts = new Set(likedPosts);
    if (likedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
  };

  const getPostUrl = (post: BlogPost) => `/blog/${slugify(post.title)}-${post.id}`;

  const handleShare = (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: `${window.location.origin}${getPostUrl(post)}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}${getPostUrl(post)}`);
    }
  };

  const handlePostClick = (post: BlogPost) => {
    navigate(getPostUrl(post), { state: post });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="relative">
            {/* Animated background particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-[#0C3C54] rounded-full"
                style={{
                  left: `${Math.random() * 200}px`,
                  top: `${Math.random() * 200}px`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.7, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
            
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-[#0C3C54] border-t-transparent rounded-full mx-auto mb-4"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-lg text-[#0C3C54] font-medium text-enhanced"
          >
            Đang tải nội dung...
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section với MagicUI */}
      <section className="relative pt-20 pb-20 overflow-hidden bg-[#0C3C54]">
        {/* Animated grid background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-30">
            {[...Array(100)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-px h-px bg-[#2A7F9E]"
                style={{
                  left: `${(i % 10) * 10}%`,
                  top: `${Math.floor(i / 10) * 10}%`,
                }}
                animate={{
                  opacity: [0.1, 0.8, 0.1],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <BlurFade delay={0.2} inView>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-full mb-8 backdrop-blur-sm border border-white/20"
            >
              <DocumentText size={48} className="text-white" variant="Bold" />
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.4} inView>
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Blog sức khỏe
            </div>
          </BlurFade>
          
          <BlurFade delay={0.6} inView>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 text-enhanced"
            >
              Khám phá những kiến thức hữu ích về sức khỏe và chăm sóc bản thân
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.8} inView>
            <div className="max-w-md mx-auto">
              <Input
                size="large"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<SearchNormal1 size={20} className="text-gray-400" />}
                className="rounded-full border-2 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 border-white/30 focus:border-white"
              />
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-12">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Cộng đồng đọc giả
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Hàng nghìn người đang theo dõi và chia sẻ những kiến thức hữu ích
              </motion.div>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <BlurFade key={index} delay={0.2 + index * 0.1} inView>
                <WarpBackground className="h-full group cursor-pointer">
                  <div className="p-8 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <div style={{ color: stat.color }}>
                        {stat.icon}
                      </div>
                    </motion.div>
                    
                    <BoxReveal align="center">
                      <div className="text-3xl font-bold mb-2" style={{ color: stat.color }}>
                        <NumberTicker value={stat.number} />
                        {stat.suffix}
                      </div>
                    </BoxReveal>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="text-gray-600 text-enhanced text-sm"
                    >
                      {stat.label}
                    </motion.div>
                  </div>
                </WarpBackground>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} inView>
            <div className="text-center mb-12">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Chủ đề <span className="text-[#2A7F9E]">nổi bật</span>
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto text-enhanced"
              >
                Khám phá những chủ đề thú vị và bổ ích về sức khỏe
              </motion.div>
            </div>
          </BlurFade>

          <BlurFade delay={0.4} inView>
            <WarpBackground className="p-8 mb-12">
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category, index) => (
                  <motion.button
                    key={category.key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`px-6 py-3 rounded-full transition-all duration-300 font-medium ${
                      selectedCategory === category.key
                        ? 'text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category.key ? category.color : undefined
                    }}
                  >
                    {category.label} ({category.count})
                  </motion.button>
                ))}
              </div>
            </WarpBackground>
          </BlurFade>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section id="blog-posts" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          {currentPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentPosts.map((post, index) => (
                  <BlurFade key={post.id} delay={0.2 + index * 0.1} inView>
                    <WarpBackground className="h-full group cursor-pointer" onClick={() => handlePostClick(post)}>
                      <Card
                        className="h-full border-0 shadow-none overflow-hidden"
                        cover={
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                            
                            {/* Action Buttons */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleLike(post.id, e)}
                                className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                                  likedPosts.has(post.id)
                                    ? "bg-red-500 text-white"
                                    : "bg-white/20 text-white hover:bg-red-500"
                                }`}
                              >
                                <Heart size={16} variant={likedPosts.has(post.id) ? "Bold" : "Outline"} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleShare(post, e)}
                                className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-blue-500 transition-colors"
                              >
                                <Share size={16} />
                              </motion.button>
                            </div>

                            {/* Stats */}
                            <div className="absolute bottom-4 left-4 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="flex items-center gap-1 text-white text-sm">
                                <Eye size={14} />
                                <span>{post.views}</span>
                              </div>
                              <div className="flex items-center gap-1 text-white text-sm">
                                <Heart size={14} />
                                <span>{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                              </div>
                            </div>
                          </div>
                        }
                      >
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Tag color={categories.find(c => c.key === post.category)?.color}>
                              {categories.find(c => c.key === post.category)?.label}
                            </Tag>
                            <span className="text-sm text-gray-500">{post.readTime} phút đọc</span>
                          </div>
                          
                          <BoxReveal align="left">
                            <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-[#0C3C54] transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                          </BoxReveal>
                          
                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="text-gray-600 text-sm mb-4 line-clamp-3 text-enhanced"
                          >
                            {post.excerpt}
                          </motion.p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img
                                src={post.author.avatar}
                                alt={post.author.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-800">
                                  {post.author.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(post.publishDate)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-4">
                            {post.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 2 && (
                              <span className="text-xs text-gray-500">+{post.tags.length - 2}</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </WarpBackground>
                  </BlurFade>
                ))}
              </div>

              {/* Pagination */}
              {filteredPosts.length > pageSize && (
                <BlurFade delay={0.5} inView>
                  <div className="flex justify-center mt-16">
                    <WarpBackground className="p-4">
                      <Pagination
                        current={currentPage}
                        total={filteredPosts.length}
                        pageSize={pageSize}
                        onChange={setCurrentPage}
                        showSizeChanger={false}
                        showQuickJumper
                        showTotal={(total, range) => 
                          `${range[0]}-${range[1]} của ${total} bài viết`
                        }
                        className="custom-pagination"
                      />
                    </WarpBackground>
                  </div>
                </BlurFade>
              )}
            </>
          ) : (
            <BlurFade delay={0.2} inView>
              <WarpBackground className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <DocumentText size={64} />
                </div>
                <BoxReveal align="center">
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Không tìm thấy bài viết phù hợp
                  </h3>
                </BoxReveal>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-gray-500 mb-6 text-enhanced"
                >
                  Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                </motion.p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="primary"
                    size="large"
                    className="!bg-[#0C3C54] !border-[#0C3C54] !rounded-full !px-8 !font-bold"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </motion.div>
              </WarpBackground>
            </BlurFade>
          )}
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-20 bg-[#0C3C54] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-30">
            {[...Array(60)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-px h-px bg-[#2A7F9E]"
                style={{
                  left: `${(i % 10) * 10}%`,
                  top: `${Math.floor(i / 10) * 16.67}%`,
                }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <BlurFade delay={0.2} inView>
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Đăng ký nhận bài viết mới
            </motion.h2>
          </BlurFade>
          
          <BlurFade delay={0.4} inView>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-white/90 max-w-2xl mx-auto mb-8 text-enhanced"
            >
              Nhận những bài viết mới nhất về sức khỏe và chăm sóc bản thân qua email
            </motion.div>
          </BlurFade>
          
          <BlurFade delay={0.6} inView>
            <WarpBackground className="max-w-md mx-auto">
              <div className="p-6">
                <div className="flex gap-4">
                  <Input
                    size="large"
                    placeholder="Nhập email của bạn"
                    className="rounded-full flex-1"
                  />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="primary"
                      size="large"
                      className="!bg-[#0C3C54] !text-white !border-none !font-semibold !px-8 !rounded-full"
                    >
                      Đăng ký
                    </Button>
                  </motion.div>
                </div>
              </div>
            </WarpBackground>
          </BlurFade>
        </div>
      </section>
    </div>
  );
};

export default Blog; 