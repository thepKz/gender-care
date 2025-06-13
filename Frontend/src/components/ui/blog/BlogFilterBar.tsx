import { Button, Input, Select } from "antd";
import { SearchNormal1, Filter } from "iconsax-react";
import React, { useState } from "react";

interface BlogFilter {
  search: string;
  category: string;
  sortBy: string;
}

interface BlogFilterBarProps {
  categories: { key: string; label: string }[];
  onChange: (filter: BlogFilter) => void;
  className?: string;
}

const { Option } = Select;

const BlogFilterBar: React.FC<BlogFilterBarProps> = ({ categories, onChange, className = "" }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("latest");

  const handleApply = () => onChange({ search, category, sortBy });

  return (
    <div className={`bg-white rounded-3xl shadow-xl p-8 ${className}`}>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-[#0C3C54]/10 rounded-2xl">
          <Filter className="text-[#0C3C54]" size={28} variant="Bold" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-[#0C3C54] mb-2">Tìm kiếm bài viết</h3>
          <p className="text-gray-600 text-lg">Khám phá kiến thức phù hợp với nhu cầu của bạn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          placeholder="Từ khóa..."
          prefix={<SearchNormal1 className="text-gray-400" size={20} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-2xl border-gray-200 h-14 text-lg"
          size="large"
        />

        <Select
          value={category}
          onChange={(value) => setCategory(value)}
          className="rounded-2xl h-14"
          size="large"
        >
          <Option value="all">Tất cả danh mục</Option>
          {categories.map((c) => (
            <Option key={c.key} value={c.key}>{c.label}</Option>
          ))}
        </Select>

        <Select
          value={sortBy}
          onChange={(value) => setSortBy(value)}
          className="rounded-2xl h-14"
          size="large"
        >
          <Option value="latest">🕒 Mới nhất</Option>
          <Option value="views">👁️‍🗨️ Nhiều lượt xem</Option>
          <Option value="likes">❤️ Nhiều lượt thích</Option>
        </Select>
      </div>

      <div className="text-right mt-8">
        <Button
          type="primary"
          icon={<SearchNormal1 size={20} />}
          className="bg-[#0C3C54] hover:bg-[#2A7F9E] border-[#0C3C54] rounded-2xl h-12 font-semibold text-lg px-10"
          onClick={handleApply}
        >
          Tìm kiếm
        </Button>
      </div>
    </div>
  );
};

export default BlogFilterBar; 