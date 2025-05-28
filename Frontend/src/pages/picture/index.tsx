import { Button, Card, Modal, Spin } from "antd";
import { motion } from "framer-motion";
import { Eye, Gallery, Heart, Share } from "iconsax-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Image1 from "../../assets/images/image1.jpg";
import Image2 from "../../assets/images/image2.jpg";
import Image3 from "../../assets/images/image3.jpg";
import Facility1 from "../../assets/images/image4.jpg";
import Facility2 from "../../assets/images/image5.jpg";
import Facility3 from "../../assets/images/image6.jpg";
import Facility4 from "../../assets/images/image7.jpg";
import { AnimatedSection } from "../../share";

interface GalleryImage {
  id: number;
  src: string;
  title: string;
  description: string;
  category: string;
  likes: number;
  views: number;
}

const Picture = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedImages, setLikedImages] = useState<Set<number>>(new Set());

  // Mock data cho gallery
  const galleryImages: GalleryImage[] = [
    {
      id: 1,
      src: Image1,
      title: "Tư vấn chuyên nghiệp",
      description: "Đội ngũ bác sĩ tư vấn chuyên nghiệp với nhiều năm kinh nghiệm",
      category: "consultation",
      likes: 245,
      views: 1520
    },
    {
      id: 2,
      src: Image2,
      title: "Chăm sóc tận tâm",
      description: "Dịch vụ chăm sóc sức khỏe sinh sản toàn diện",
      category: "care",
      likes: 189,
      views: 980
    },
    {
      id: 3,
      src: Image3,
      title: "Xét nghiệm hiện đại",
      description: "Trang thiết bị xét nghiệm hiện đại, kết quả chính xác",
      category: "testing",
      likes: 312,
      views: 2100
    },
    {
      id: 4,
      src: Facility1,
      title: "Cơ sở vật chất hiện đại",
      description: "Không gian khám chữa bệnh hiện đại, thoải mái",
      category: "facility",
      likes: 156,
      views: 750
    },
    {
      id: 5,
      src: Facility2,
      title: "Phòng khám riêng tư",
      description: "Đảm bảo sự riêng tư tuyệt đối cho bệnh nhân",
      category: "facility",
      likes: 203,
      views: 1200
    },
    {
      id: 6,
      src: Facility3,
      title: "Khu vực chờ thoải mái",
      description: "Không gian chờ được thiết kế thoải mái và thân thiện",
      category: "facility",
      likes: 178,
      views: 890
    },
    {
      id: 7,
      src: Facility4,
      title: "Phòng tư vấn chuyên nghiệp",
      description: "Môi trường tư vấn chuyên nghiệp và bảo mật",
      category: "consultation",
      likes: 267,
      views: 1650
    },
    {
      id: 8,
      src: Image1,
      title: "Đội ngũ y tế chuyên nghiệp",
      description: "Bác sĩ và nhân viên y tế được đào tạo chuyên sâu",
      category: "team",
      likes: 298,
      views: 1800
    }
  ];

  const categories = [
    { key: "all", label: "Tất cả", count: galleryImages.length },
    { key: "consultation", label: "Tư vấn", count: galleryImages.filter(img => img.category === "consultation").length },
    { key: "facility", label: "Cơ sở vật chất", count: galleryImages.filter(img => img.category === "facility").length },
    { key: "testing", label: "Xét nghiệm", count: galleryImages.filter(img => img.category === "testing").length },
    { key: "care", label: "Chăm sóc", count: galleryImages.filter(img => img.category === "care").length },
    { key: "team", label: "Đội ngũ", count: galleryImages.filter(img => img.category === "team").length }
  ];

  const filteredImages = selectedCategory === "all" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
    setIsModalVisible(true);
  };

  const handleLike = (imageId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLikedImages = new Set(likedImages);
    if (likedImages.has(imageId)) {
      newLikedImages.delete(imageId);
    } else {
      newLikedImages.add(imageId);
    }
    setLikedImages(newLikedImages);
  };

  const handleShare = (image: GalleryImage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: image.title,
        text: image.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
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
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white/20"
              animate={{
                x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                y: [Math.random() * 400, Math.random() * 400],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
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
              <Gallery size={40} className="text-white" variant="Bold" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Thư viện hình ảnh
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              Khám phá không gian hiện đại và dịch vụ chuyên nghiệp tại Gender Healthcare
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  className="bg-white text-[#0C3C54] border-none font-semibold px-8 py-6 h-auto rounded-full"
                  onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Xem thư viện
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  ghost
                  className="border-white text-white font-semibold px-8 py-6 h-auto rounded-full hover:!bg-white hover:!text-[#0C3C54]"
                  onClick={() => navigate('/about-gcc')}
                >
                  Về chúng tôi
                </Button>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Gallery Section */}
      <div id="gallery" className="py-20">
        <div className="container mx-auto px-4">
          {/* Category Filter */}
          <AnimatedSection animation="slideUp">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Bộ sưu tập hình ảnh
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Tìm hiểu về cơ sở vật chất, đội ngũ và dịch vụ của chúng tôi qua những hình ảnh chân thực
              </p>
              
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type={selectedCategory === category.key ? "primary" : "default"}
                      size="large"
                      className={`rounded-full px-6 font-medium ${
                        selectedCategory === category.key
                          ? "bg-[#0C3C54] border-[#0C3C54]"
                          : "border-gray-300 text-gray-600 hover:!border-[#0C3C54] hover:!text-[#0C3C54]"
                      }`}
                      onClick={() => setSelectedCategory(category.key)}
                    >
                      {category.label} ({category.count})
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Image Grid */}
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
                onClick={() => handleImageClick(image)}
              >
                <Card
                  hoverable
                  className="overflow-hidden border-0 shadow-lg group-hover:shadow-2xl transition-all duration-500"
                  cover={
                    <div className="relative overflow-hidden h-64">
                      <img
                        src={image.src}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Overlay Actions */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <motion.div
                          initial={{ scale: 0 }}
                          whileHover={{ scale: 1.1 }}
                          className="bg-white/20 backdrop-blur-sm rounded-full p-3"
                        >
                          <Eye size={24} className="text-white" />
                        </motion.div>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleLike(image.id, e)}
                          className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                            likedImages.has(image.id)
                              ? "bg-red-500 text-white"
                              : "bg-white/20 text-white hover:bg-red-500"
                          }`}
                        >
                          <Heart size={16} variant={likedImages.has(image.id) ? "Bold" : "Outline"} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleShare(image, e)}
                          className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-blue-500 transition-colors"
                        >
                          <Share size={16} />
                        </motion.button>
                      </div>

                      {/* Stats */}
                      <div className="absolute bottom-4 left-4 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-1 text-white text-sm">
                          <Heart size={14} />
                          <span>{image.likes + (likedImages.has(image.id) ? 1 : 0)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-white text-sm">
                          <Eye size={14} />
                          <span>{image.views}</span>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-[#0C3C54] transition-colors">
                      {image.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {image.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Load More Button */}
          <AnimatedSection animation="fadeIn" delay={0.5}>
            <div className="text-center mt-16">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="large"
                  className="bg-[#0C3C54] text-white border-none font-semibold px-8 py-6 h-auto rounded-full hover:!bg-[#2A7F9E]"
                >
                  Xem thêm hình ảnh
                </Button>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Image Modal */}
      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width="90vw"
        style={{ maxWidth: '1200px' }}
        className="image-modal"
        centered
      >
        {selectedImage && (
          <div className="relative">
            <img
              src={selectedImage.src}
              alt={selectedImage.title}
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
            <div className="mt-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedImage.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedImage.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Heart size={16} />
                    <span>{selectedImage.likes + (likedImages.has(selectedImage.id) ? 1 : 0)} lượt thích</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Eye size={16} />
                    <span>{selectedImage.views} lượt xem</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type={likedImages.has(selectedImage.id) ? "primary" : "default"}
                    icon={<Heart size={16} variant={likedImages.has(selectedImage.id) ? "Bold" : "Outline"} />}
                    onClick={(e) => handleLike(selectedImage.id, e)}
                    className="rounded-full"
                  >
                    {likedImages.has(selectedImage.id) ? "Đã thích" : "Thích"}
                  </Button>
                  <Button
                    icon={<Share size={16} />}
                    onClick={(e) => handleShare(selectedImage, e)}
                    className="rounded-full"
                  >
                    Chia sẻ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Picture; 