import { Request, Response, NextFunction } from 'express';
import BlogPosts from '../models/BlogPosts';

// GET /api/posts?search=&category=&page=&limit=&sortBy=
export const listPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search = '', category, sortBy = 'publishedAt' } = req.query as any;
    const filter: any = { published: true };
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    const sort: any = { [sortBy]: -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await Promise.all([
      BlogPosts.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean(),
      BlogPosts.countDocuments(filter),
    ]);

    res.json({ success: true, data: { posts, pagination: { page: Number(page), limit: Number(limit), total } } });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/:slug
export const getPostBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const post = await BlogPosts.findOne({ slug, published: true }).lean();
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    // increase views asynchronously
    BlogPosts.updateOne({ _id: post._id }, { $inc: { views: 1 } }).exec();

    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}; 