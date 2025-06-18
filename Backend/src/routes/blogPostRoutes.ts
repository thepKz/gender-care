import { Router } from 'express';
import { listPosts, getPostBySlug } from '../controllers/blogPostController';

const router = Router();

router.get('/posts', listPosts);
router.get('/posts/:slug', getPostBySlug);

export default router; 