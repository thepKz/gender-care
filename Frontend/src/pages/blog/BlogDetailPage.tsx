import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { Calendar, Clock, Eye, Heart, Share } from "iconsax-react";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ImagePlaceholder from "../../assets/images/image1.jpg";
import { AnimatedSection } from "../../shared";
import { slugify } from "../../utils/slugify";
import blogPostsData from "../../assets/data/blogPosts";
import { usePostDetail } from "../../hooks/usePostDetail";
import Avatar from "../../components/ui/primitives/Avatar";
import PrimaryButton from "../../components/ui/primitives/PrimaryButton";
import TagChip from "../../components/ui/primitives/TagChip";
import BreadcrumbNav from "../../components/ui/primitives/BreadcrumbNav";

// Kiểu dữ liệu BlogPost (có thể tái sử dụng từ trang Blog chính)
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

// Mock data 1 bài viết (có thể thay bằng API thực)
const mockPost: BlogPost = {
  id: 100,
  title: "Tầm quan trọng của kiểm tra sức khỏe định kỳ cho LGBTQ+",
  excerpt: "Khám phá lý do tại sao kiểm tra sức khỏe định kỳ lại đặc biệt quan trọng đối với cộng đồng LGBTQ+ và cách lựa chọn cơ sở y tế phù hợp.",
  content: `
  ## Giới thiệu
  Việc khám sức khỏe định kỳ giúp phát hiện sớm các vấn đề tiềm ẩn và nâng cao chất lượng cuộc sống. Đối với cộng đồng LGBTQ+, việc chăm sóc sức khỏe còn quan trọng hơn bởi các yếu tố đặc thù về sinh lý, tâm lý và xã hội.

  ### Các lợi ích chính
  - **Phát hiện sớm** các bệnh lây truyền qua đường tình dục (STI).
  - Tư vấn về **sức khỏe tâm lý** và các vấn đề liên quan đến bản dạng giới.
  - Chích ngừa và cập nhật **vaccine HPV**.

  ### Lời khuyên từ chuyên gia
  > "Chăm sóc sức khỏe không chỉ đơn giản là chữa bệnh mà còn là hành trình đồng hành cùng cơ thể và tâm hồn." – *BS. Lê Thị Lan*

  ### Kết luận
  Đừng ngần ngại đặt lịch khám định kỳ, bởi sức khỏe là tài sản quý giá nhất của bạn.
  `,
  author: {
    name: "BS. Lê Thị Lan",
    avatar: ImagePlaceholder,
    title: "Chuyên gia Y tế"
  },
  category: "health-check",
  tags: ["LGBTQ+", "Khám định kỳ", "STI"],
  publishDate: "2024-06-01",
  readTime: 7,
  views: 780,
  likes: 64,
  image: ImagePlaceholder,
  isFeatured: true,
};

const BlogDetailPage: React.FC = () => {
  const { slugId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  let post: BlogPost | null = (location.state as BlogPost) || null;

  const numericId = slugId ? parseInt(slugId.split('-').pop() || '0') : 0;
  if (!post && numericId) {
    const found = blogPostsData.find(p => p.id === numericId);
    if (found) post = found;
  }

  const { data: cmsPost, loading: cmsLoading } = usePostDetail(slugId);
  if (!post && cmsPost) post = cmsPost;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  if (cmsLoading || !post) {
    return (
      <div className="bg-white min-h-screen pb-24">
        {/* Breadcrumb */}
        <div className="bg-gray-50 py-4">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12">
            <BreadcrumbNav
              items={[
                { label: "Trang chủ", to: "/", onClick: () => navigate("/") },
                { label: "Blog", to: "/blog", onClick: () => navigate("/blog") },
                { label: post?.title ? post.title.slice(0, 50) + "..." : "Loading..." },
              ]}
            />
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative h-64 md:h-96 lg:h-[500px] overflow-hidden">
          <img
            src={post?.image || ImagePlaceholder}
            alt={post?.title || "Loading..."}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center px-6 max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
            >
              {post?.title || "Loading..."}
            </motion.h1>
          </div>
        </div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 mt-12">
          {/* Meta Info */}
          <AnimatedSection animation="slideUp">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <Avatar size={56} src={post?.author?.avatar || ''} />
                <div>
                  <h4 className="text-lg font-semibold text-[#0C3C54]">{post?.author.name}</h4>
                  <p className="text-gray-500 text-sm">{post?.author.title}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar size={18} /> {post?.publishDate}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={18} /> {post?.readTime} phút đọc
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={18} /> {post?.views}
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={18} /> {post?.likes}
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Content */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.4 }}
            className="prose md:prose-lg lg:prose-xl max-w-3xl mx-auto text-gray-700 mb-12 prose-headings:text-[#0C3C54] prose-a:text-cyan-600 hover:prose-a:underline"
          >
            {/* Render markdown content safely */}
            <ReactMarkdown rehypePlugins={[]} remarkPlugins={[remarkGfm]}>{post?.content || "Loading..."}</ReactMarkdown>
          </motion.div>

          {/* Tags & Share */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-2 flex-wrap">
              {post?.tags.map((tag) => (
                <TagChip key={tag}>
                  #{tag}
                </TagChip>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <PrimaryButton
                icon={<Share size={18} />}
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/blog/${slugify(post?.title || "")}-${post?.id}`)}
              >Chia sẻ</PrimaryButton>
              <PrimaryButton icon={<Heart size={18} variant="Bold" />}>Thích ({post?.likes})</PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <BreadcrumbNav
            items={[
              { label: "Trang chủ", to: "/", onClick: () => navigate("/") },
              { label: "Blog", to: "/blog", onClick: () => navigate("/blog") },
              { label: post.title ? post.title.slice(0, 50) + "..." : "" },
            ]}
          />
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-64 md:h-96 lg:h-[500px] overflow-hidden">
        <img
          src={post.image || ImagePlaceholder}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center px-6 max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
          >
            {post.title}
          </motion.h1>
        </div>
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 mt-12">
        {/* Meta Info */}
        <AnimatedSection animation="slideUp">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Avatar size={56} src={post.author.avatar || ''} />
              <div>
                <h4 className="text-lg font-semibold text-[#0C3C54]">{post.author.name}</h4>
                <p className="text-gray-500 text-sm">{post.author.title}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
              <div className="flex items-center gap-1">
                <Calendar size={18} /> {post.publishDate}
              </div>
              <div className="flex items-center gap-1">
                <Clock size={18} /> {post.readTime} phút đọc
              </div>
              <div className="flex items-center gap-1">
                <Eye size={18} /> {post.views}
              </div>
              <div className="flex items-center gap-1">
                <Heart size={18} /> {post.likes}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Content */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4 }}
          className="prose md:prose-lg lg:prose-xl max-w-3xl mx-auto text-gray-700 mb-12 prose-headings:text-[#0C3C54] prose-a:text-cyan-600 hover:prose-a:underline"
        >
          {/* Render markdown content safely */}
          <ReactMarkdown rehypePlugins={[]} remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </motion.div>

        {/* Tags & Share */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-2 flex-wrap">
            {post.tags.map((tag) => (
              <TagChip key={tag}>
                #{tag}
              </TagChip>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <PrimaryButton
              icon={<Share size={18} />}
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/blog/${slugify(post.title)}-${post.id}`)}
            >Chia sẻ</PrimaryButton>
            <PrimaryButton icon={<Heart size={18} variant="Bold" />}>Thích ({post.likes})</PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage; 