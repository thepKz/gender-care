# Blog Module – Functional & Technical Specification

Created: 2025-06-12  
Author: AI (Cursor Assistant)

---

## 1. Mục tiêu
Cung cấp **Blog Page** (danh sách) và **Blog Detail Page** (chi tiết) cho người dùng, đồng thời định nghĩa luồng **Admin** để tạo/quản lý bài viết.

* Đối tượng độc giả chính: Người dùng cuối & Quản trị viên (Admin).
* Công nghệ: React 18 + TypeScript + Vite, Ant Design, TailwindCSS, Framer-Motion.
* API style: REST (JSON over HTTPS).

## 2. Kiến trúc giao diện

| Trang | Đường dẫn | Component gốc | Layout | Miêu tả |
|-------|-----------|---------------|--------|---------|
| Blog List | `/blog` | `pages/blog/index.tsx` | `MainLayout` | Hiển thị các bài viết, bộ lọc, tìm kiếm, phân trang. |
| Blog Detail | `/blog/:id` | `pages/blog/BlogDetailPage.tsx` | `MainLayout` | Chi tiết 1 bài viết, breadcrumb, nội dung markdown. |
| Admin Blog List | `/dashboard/admin/blogs` | `pages/dashboard/admin/blogs/BlogList.tsx` *(TODO)* | `DashboardLayout` | Quản lý (CRUD) bài viết. |
| Admin Blog Form | `/dashboard/admin/blogs/create` | `pages/dashboard/admin/blogs/BlogForm.tsx` *(TODO)* | `DashboardLayout` | Form tạo / chỉnh sửa bài viết. |

### 2.1 Component Breakdown (FE)

1. **BlogCard** (`components/ui/cards/BlogCard.tsx` – *tạo mới*)  
   - Nhận `BlogPost` props, render ảnh cover, badge Nổi bật, meta views/likes.  
   - Animation hover (scale, shadow).

2. **BlogFilterBar** (`components/ui/blog/BlogFilterBar.tsx` – *tạo mới*)  
   - Input search, select category, select sortBy.  
   - Gọi callback `onFilterChange` trả object `{ search, category, sortBy }`.

3. **BlogDetailContent** (`components/ui/blog/BlogDetailContent.tsx` – *tuỳ chọn*)  
   - Nhận `BlogPost`, hiển thị markdown với `react-markdown` / `rehype-raw`.

4. **MarkdownEditor** (Admin)  
   - Sử dụng `@uiw/react-md-editor` hoặc `react-quill`.

## 3. Data Model
```ts
// shared/types/blog.ts
export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string; // markdown/plaintext
  author: {
    id: number;
    name: string;
    avatar: string;
    title: string;
  };
  category: string;       // slug 'women-health', 'testing'…
  tags: string[];         // max 10
  publishDate: string;    // ISO 8601
  readTime: number;       // phút
  views: number;
  likes: number;
  image: string;          // URL ảnh cover
  isFeatured: boolean;
  isActive: boolean;      // Soft-delete flag
}
```

## 4. API Contracts

| Method | Endpoint | Req Body / Params | Success (200) | Notes |
|--------|----------|-------------------|---------------|-------|
| **Public** | | | | |
| GET | `/api/blogs` | `?page, limit, search, category, sortBy` | `{ success, data: { posts: BlogPost[], pagination } }` | sortBy: `latest | views | likes` |
| GET | `/api/blogs/:id` | – | `{ success, data: BlogPost }` | +1 view tự động |
| **Admin** | | | | |
| POST | `/api/admin/blogs` | `BlogPostCreateDto` | `{ success, data: BlogPost }` | Require `Auth(Admin)` |
| PUT | `/api/admin/blogs/:id` | `BlogPostUpdateDto` | `{ success }` | |
| DELETE | `/api/admin/blogs/:id` | – | `{ success }` | Soft delete (`isActive=false`) |

### 4.1 Upload ảnh cover
```
POST /api/uploads
multipart/form-data => file
⇒ trả `{ url: 'https://cdn/...' }`
```
Ảnh lưu S3/minio; FE nhận `url` và set trong form.

## 5. State Management
Sử dụng **RTK Query** (Redux Toolkit) để cache list/detail.
```ts
// example
const blogsApi = createApi({
  reducerPath: 'blogsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getBlogs: builder.query<Paginated<BlogPost>, GetBlogsParams>({
      query: (params) => ({ url: 'blogs', params }),
    }),
    getBlog: builder.query<BlogPost, number>({
      query: (id) => `blogs/${id}`,
    }),
    createBlog: builder.mutation<BlogPost, BlogPostCreateDto>({
      query: (body) => ({ url: 'admin/blogs', method: 'POST', body }),
    }),
  }),
});
```

## 6. Quy trình Admin tạo bài viết
1. Từ sidebar, chọn **Blog → Tạo mới**.  
2. Nhập dữ liệu form:  
   - **Tiêu đề** (bắt buộc, max 150)  
   - **Ảnh đại diện** (upload)  
   - **Trích dẫn ngắn** (max 300)  
   - **Nội dung markdown** (editor toàn màn hình)  
   - **Danh mục** (select)  
   - **Tags** (multi input)  
   - **Thời gian đọc** (auto gợi ý = words/200)  
   - **Nổi bật** (checkbox)  
3. Nhấn **Đăng bài**  
   - FE gọi `POST /api/admin/blogs`.  
   - BE trả blogPost ⇒ RTK cache invalidate ⇒ redirect `/dashboard/admin/blogs`.
4. Bài viết tự động public ở `/blog`, hiển thị badge "Mới".

## 7. Validation & Rules
- **Unique title** trong cùng category.  
- **Slug** sinh tự động từ title (FE gợi ý, BE confirm).  
- Ảnh cover tối thiểu 1280×720.  
- Không quá 10 tags.

## 8. Phân trang & SEO
- Server trả `Link` header cho `rel="next"`.  
- FE SSR (tương lai) cần `meta og:title`, `og:image` – tạo tại BlogDetail.

## 9. Component Map
```
/pages/blog/index.tsx           // Blog list
/pages/blog/BlogDetailPage.tsx  // Chi tiết
/components/ui/cards/BlogCard.tsx
/components/ui/blog/BlogFilterBar.tsx
/pages/dashboard/admin/blogs/BlogList.tsx
/pages/dashboard/admin/blogs/BlogForm.tsx
/hooks/useBlog.ts               // custom hook wrap RTK
```

## 10. Checklist triển khai
- [ ] Tạo thư mục `components/ui/blog` & `cards`.  
- [ ] Cover upload component dùng AntD `Upload.Dragger`.  
- [ ] Tạo slice RTK `blogsApi`.  
- [ ] Thay mock-data trong `pages/blog/index.tsx` thành call API.  
- [ ] Hoàn thiện `BlogCard` để tái sử dụng ở `Featured`, `List`.  
- [ ] Xây `BlogFilterBar` truyền callback.  
- [ ] Xây `BlogForm` với MarkdownEditor, validate (yup).  
- [ ] Bảo vệ route admin bằng `RequireRole(['admin'])`.  
- [ ] Viết unit test (Jest/React-Testing-Library) cho BlogCard & BlogDetailContent.  
- [ ] Cập nhật sitemap & robots.

---

> **Changelog**  
> 2025-06-12 – Tạo tài liệu đặc tả Blog (Cursor Assistant) 