import { Button, Card, Input, Pagination, Select, Spin, Tag } from "antd";
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

const { Search } = Input;
const { Option } = Select;

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

  // Mock data cho blog posts
  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "Hướng dẫn chăm sóc sức khỏe sinh sản cho phụ nữ",
      excerpt: "Những kiến thức cơ bản và quan trọng mà mọi phụ nữ cần biết để chăm sóc sức khỏe sinh sản một cách hiệu quả và an toàn.",
      content: "Nội dung chi tiết về chăm sóc sức khỏe sinh sản...",
      author: {
        name: "BS. Nguyễn Thị Hương",
        avatar: Image1,
        title: "Bác sĩ Sản phụ khoa"
      },
      category: "women-health",
      tags: ["Sức khỏe phụ nữ", "Sinh sản", "Chăm sóc"],
      publishDate: "2024-01-15",
      readTime: 8,
      views: 2450,
      likes: 156,
      image: Image1,
      isFeatured: true
    },
    {
      id: 2,
      title: "Tầm quan trọng của xét nghiệm STI định kỳ",
      excerpt: "Tại sao việc xét nghiệm các bệnh lây truyền qua đường tình dục định kỳ lại quan trọng và cần thiết cho mọi người.",
      content: "Nội dung chi tiết về xét nghiệm STI...",
      author: {
        name: "BS. Trần Văn Nam",
        avatar: Image2,
        title: "Chuyên gia Xét nghiệm"
      },
      category: "testing",
      tags: ["STI", "Xét nghiệm", "Phòng ngừa"],
      publishDate: "2024-01-12",
      readTime: 6,
      views: 1890,
      likes: 98,
      image: Image2,
      isFeatured: false
    },
    {
      id: 3,
      title: "Tư vấn tâm lý trong các mối quan hệ tình dục",
      excerpt: "Những vấn đề tâm lý phổ biến trong các mối quan hệ tình dục và cách giải quyết hiệu quả.",
      content: "Nội dung chi tiết về tư vấn tâm lý...",
      author: {
        name: "TS. Lê Thị Lan",
        avatar: Image3,
        title: "Chuyên gia Tâm lý"
      },
      category: "psychology",
      tags: ["Tâm lý", "Tình dục", "Mối quan hệ"],
      publishDate: "2024-01-10",
      readTime: 10,
      views: 3200,
      likes: 245,
      image: Image3,
      isFeatured: true
    },
    {
      id: 4,
      title: "Kế hoạch hóa gia đình hiện đại",
      excerpt: "Các phương pháp kế hoạch hóa gia đình hiện đại và cách lựa chọn phương pháp phù hợp.",
      content: "Nội dung chi tiết về kế hoạch hóa gia đình...",
      author: {
        name: "BS. Hoàng Thị Mai",
        avatar: Image1,
        title: "Chuyên gia Kế hoạch hóa gia đình"
      },
      category: "family-planning",
      tags: ["Kế hoạch gia đình", "Tránh thai", "Gia đình"],
      publishDate: "2024-01-08",
      readTime: 7,
      views: 1650,
      likes: 89,
      image: Image2,
      isFeatured: false
    },
    {
      id: 5,
      title: "Sức khỏe nam giới: Những điều cần biết",
      excerpt: "Hướng dẫn toàn diện về chăm sóc sức khỏe sinh sản và tình dục dành cho nam giới.",
      content: "Nội dung chi tiết về sức khỏe nam giới...",
      author: {
        name: "BS. Phạm Minh Tuấn",
        avatar: Image3,
        title: "Chuyên gia Nam học"
      },
      category: "men-health",
      tags: ["Sức khỏe nam giới", "Nam học", "Sinh sản"],
      publishDate: "2024-01-05",
      readTime: 9,
      views: 2100,
      likes: 134,
      image: Image1,
      isFeatured: false
    },
    {
      id: 6,
      title: "Chuẩn bị cho cuộc sống hôn nhân",
      excerpt: "Những điều cần chuẩn bị về mặt sức khỏe và tâm lý trước khi bước vào cuộc sống hôn nhân.",
      content: "Nội dung chi tiết về chuẩn bị hôn nhân...",
      author: {
        name: "BS. Đỗ Văn Hùng",
        avatar: Image2,
        title: "Chuyên gia Tư vấn hôn nhân"
      },
      category: "marriage",
      tags: ["Hôn nhân", "Tư vấn", "Chuẩn bị"],
      publishDate: "2024-01-03",
      readTime: 12,
      views: 2800,
      likes: 198,
      image: Image3,
      isFeatured: true
    },
    {
      id: 7,
      title: "Dinh dưỡng cho sức khỏe sinh sản",
      excerpt: "Vai trò của dinh dưỡng trong việc duy trì và cải thiện sức khỏe sinh sản.",
      content: "Nội dung chi tiết về dinh dưỡng...",
      author: {
        name: "BS. Nguyễn Thị Hương",
        avatar: Image1,
        title: "Bác sĩ Dinh dưỡng"
      },
      category: "nutrition",
      tags: ["Dinh dưỡng", "Sức khỏe", "Sinh sản"],
      publishDate: "2024-01-01",
      readTime: 6,
      views: 1420,
      likes: 76,
      image: Image2,
      isFeatured: false
    },
    {
      id: 8,
      title: "Xu hướng chăm sóc sức khỏe 2024",
      excerpt: "Những xu hướng mới trong lĩnh vực chăm sóc sức khỏe sinh sản và tình dục năm 2024.",
      content: "Nội dung chi tiết về xu hướng 2024...",
      author: {
        name: "TS. Lê Thị Lan",
        avatar: Image3,
        title: "Chuyên gia Y tế"
      },
      category: "trends",
      tags: ["Xu hướng", "2024", "Công nghệ y tế"],
      publishDate: "2023-12-28",
      readTime: 8,
      views: 3500,
      likes: 267,
      image: Image1,
      isFeatured: true
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

  const handleShare = (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: `${window.location.origin}/blog/${post.id}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/blog/${post.id}`);
    }
  };

  const handlePostClick = (postId: number) => {
    navigate(`/blog/${postId}`);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="relative pt-12 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] opacity-90"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('../../assets/images/pattern.png')] opacity-10"></div>
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/20"
              animate={{
                x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                y: [Math.random() * 400, Math.random() * 400],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: Math.random() * 20 + 15,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <AnimatedSection animation="slideUp">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6 backdrop-blur-sm"
            >
              <DocumentText size={40} className="text-white" variant="Bold" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Blog sức khỏe
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              Kiến thức chuyên sâu về sức khỏe giới tính và sinh sản từ các chuyên gia hàng đầu
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  className="bg-white text-[#0C3C54] border-none font-semibold px-8 py-6 h-auto rounded-full"
                  onClick={() => document.getElementById('blog-posts')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Khám phá bài viết
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  ghost
                  className="border-white text-white font-semibold px-8 py-6 h-auto rounded-full hover:!bg-white hover:!text-[#0C3C54]"
                  onClick={() => navigate('/counselors')}
                >
                  Tư vấn với chuyên gia
                </Button>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Featured Posts */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="slideUp">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Bài viết nổi bật
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Những bài viết được quan tâm và đánh giá cao nhất từ cộng đồng
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
                onClick={() => handlePostClick(post.id)}
              >
                <Card
                  hoverable
                  className="h-full border-0 shadow-lg group-hover:shadow-2xl transition-all duration-500 overflow-hidden"
                  cover={
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      {/* Featured Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          Nổi bật
                        </div>
                      </div>

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
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-[#0C3C54] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

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
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="slideUp">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Search
                  placeholder="Tìm kiếm bài viết..."
                  allowClear
                  size="large"
                  prefix={<SearchNormal1 size={20} className="text-gray-400" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg"
                />
                
                <Select
                  size="large"
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  className="w-full"
                >
                  {categories.map(category => (
                    <Option key={category.key} value={category.key}>
                      {category.label} ({category.count})
                    </Option>
                  ))}
                </Select>

                <Select
                  size="large"
                  value={sortBy}
                  onChange={setSortBy}
                  className="w-full"
                >
                  {sortOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
              
              <div className="text-center text-gray-600">
                Tìm thấy <span className="font-semibold text-[#0C3C54]">{filteredPosts.length}</span> bài viết
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div id="blog-posts" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {currentPosts.map((post, index) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
                onClick={() => handlePostClick(post.id)}
              >
                <Card
                  hoverable
                  className="h-full border-0 shadow-lg group-hover:shadow-2xl transition-all duration-500 overflow-hidden"
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
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-[#0C3C54] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

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
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {filteredPosts.length > pageSize && (
            <AnimatedSection animation="fadeIn" delay={0.5}>
              <div className="flex justify-center mt-16">
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
              </div>
            </AnimatedSection>
          )}

          {/* No Results */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <DocumentText size={64} />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Không tìm thấy bài viết phù hợp
              </h3>
              <p className="text-gray-500 mb-6">
                Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
              </p>
              <Button
                type="primary"
                size="large"
                className="bg-[#0C3C54] border-[#0C3C54] rounded-full px-8"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Newsletter Subscription */}
      <div className="py-20 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E]">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection animation="slideUp">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Đăng ký nhận bài viết mới
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Nhận những bài viết mới nhất về sức khỏe giới tính và sinh sản qua email
            </p>
            <div className="max-w-md mx-auto flex gap-4">
              <Input
                size="large"
                placeholder="Nhập email của bạn"
                className="rounded-full"
              />
              <Button
                type="primary"
                size="large"
                className="bg-white text-[#0C3C54] border-none font-semibold px-8 rounded-full hover:!bg-gray-100"
              >
                Đăng ký
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
};

export default Blog; 