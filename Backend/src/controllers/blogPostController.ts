import { Request, Response, NextFunction } from 'express';
import BlogPosts from '../models/BlogPosts';

// Interface cho query parameters
interface ListPostsQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  sortBy?: string;
}

// Utility function để escape regex special characters
const escapeRegex = (text: string): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Whitelist các trường sort hợp lệ
const VALID_SORT_FIELDS = ['publishedAt', 'title', 'views', 'createdAt', 'updatedAt'] as const;
type ValidSortField = typeof VALID_SORT_FIELDS[number];

// Validate sortBy parameter
const validateSortBy = (sortBy: string): ValidSortField => {
  if (VALID_SORT_FIELDS.includes(sortBy as ValidSortField)) {
    return sortBy as ValidSortField;
  }
  return 'publishedAt'; // default fallback
};

// GET /api/posts?search=&category=&page=&limit=&sortBy=
export const listPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as ListPostsQuery;
    
    // Validate và sanitize input parameters
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10) || 10)); // Giới hạn max 100
    const search = query.search?.trim() || '';
    const category = query.category?.trim() || '';
    const sortBy = validateSortBy(query.sortBy || 'publishedAt');
    
    // Build filter object
    const filter: any = { published: true };
    
    // Escape regex cho search parameter
    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.title = { $regex: escapedSearch, $options: 'i' };
    }
    
    // Validate category (chỉ cho phép alphanumeric và dấu gạch ngang)
    if (category && /^[a-zA-Z0-9-_]+$/.test(category)) {
      filter.category = category;
    }
    
    // Safe sort object với validated field
    const sort: { [K in ValidSortField]?: -1 | 1 } = { [sortBy]: -1 };
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      BlogPosts.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      BlogPosts.countDocuments(filter),
    ]);

    res.json({ 
      success: true, 
      data: { 
        posts, 
        pagination: { 
          page, 
          limit, 
          total,
          totalPages: Math.ceil(total / limit)
        } 
      } 
    });
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