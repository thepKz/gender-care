import React from "react";
import { motion } from "framer-motion";

import Facility1 from "../../assets/images/image4.jpg";
import Facility2 from "../../assets/images/image5.jpg";
import Facility3 from "../../assets/images/image6.jpg";
import Facility4 from "../../assets/images/image7.jpg";
import Image1 from "../../assets/images/image1.jpg";
import Image2 from "../../assets/images/image2.jpg";

const images = [Facility1, Facility2, Facility3, Facility4, Image1, Image2];

const MasonryGallery: React.FC = () => {
  return (
    <section className="w-full py-20 bg-[#2A7F9E]/10">
      <h2 className="text-center text-3xl md:text-4xl font-bold text-white mb-12">
        Hình ảnh hoạt động tại Gender Healthcare
      </h2>
      <div className="px-4 md:px-8 lg:px-16">
        {/* Masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-4 gap-4 [column-fill:_balance]">
          {images.map((img, idx) => (
            <motion.img
              key={idx}
              src={img}
              alt={`gallery-${idx}`}
              className="mb-4 w-full rounded-xl hover:shadow-xl hover:-translate-y-1 transition-transform duration-300"
              loading="lazy"
              whileHover={{ scale: 1.03 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MasonryGallery; 