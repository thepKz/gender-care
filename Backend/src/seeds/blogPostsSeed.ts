import BlogPosts from '../models/BlogPosts';
import mongoose from 'mongoose';

const posts = [
  {
    title: 'Hướng dẫn chăm sóc sức khỏe sinh sản cho phụ nữ',
    slug: 'huong-dan-cham-soc-suc-khoe-sinh-san-cho-phu-nu-1',
    excerpt: 'Những kiến thức quan trọng ...',
    content: '# Tiêu đề\nNội dung markdown...',
    category: 'women-health',
    tags: ['Sức khỏe phụ nữ', 'Sinh sản'],
    published: true,
    publishedAt: new Date(),
    authorId: new mongoose.Types.ObjectId(),
    likes: 0,
  },
];

export default async function seedPosts() {
  console.log('🌱 Seeding blog posts');
  await BlogPosts.deleteMany({});
  await BlogPosts.insertMany(posts);
  console.log('✅ Blog posts seeded');
} 