/**
 * Blog utility functions
 */

interface PostWithId {
  id?: string | number;
  _id?: string;
}

/**
 * Resolves post ID from object that might have either 'id' or '_id'
 * Prioritizes 'id' over '_id' for backward compatibility
 * @param post - Object with potential id/_id properties
 * @returns string ID for navigation, empty string if neither exists
 */
export const getPostId = (post: PostWithId): string => {
  // Priority: id first (for backward compatibility), then _id (MongoDB)
  if (post.id !== undefined && post.id !== null) {
    return String(post.id);
  }
  
  if (post._id !== undefined && post._id !== null) {
    return String(post._id);
  }
  
  // Log warning if no ID found
  console.warn('BlogCard: No valid ID found in post object', post);
  return '';
};

/**
 * Checks if post has valid ID for navigation
 * @param post - Post object to check
 * @returns boolean indicating if post can be navigated to
 */
export const hasValidPostId = (post: PostWithId): boolean => {
  return getPostId(post) !== '';
}; 