import Image1 from "../../assets/images/image1.jpg";
import Image2 from "../../assets/images/image2.jpg";
import Image3 from "../../assets/images/image3.jpg";

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string; // markdown
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

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Hướng dẫn chăm sóc sức khỏe sinh sản cho phụ nữ",
    excerpt:
      "Những kiến thức cơ bản và quan trọng mọi phụ nữ cần biết để chăm sóc sức khỏe sinh sản hiệu quả.",
    content: `
## 1. Khám phụ khoa định kỳ

Việc **khám phụ khoa** 6&nbsp;–&nbsp;12&nbsp;tháng/lần giúp phát hiện sớm các bệnh lý:

- Viêm nhiễm âm đạo, cổ tử cung.
- U xơ, polyp, lạc nội mạc tử cung.
- Ung thư cổ tử cung giai đoạn tiền lâm sàng.

> "Phòng bệnh hơn chữa bệnh" – Bộ Y&nbsp;tế Việt Nam

### Lưu ý khi khám

1. Tránh kỳ kinh 3&nbsp;ngày trước & sau.
2. Không thụt rửa âm đạo 24&nbsp;h.
3. Ghi lại triệu chứng, chu kỳ để trao đổi bác sĩ.

---

## 2. Tiêm ngừa vaccine cần thiết

| Vaccine | Độ tuổi khuyến cáo | Ghi chú |
|---------|-------------------|---------|
| HPV     | 9–26              | 2–3 mũi tuỳ loại |
| Viêm gan B | Bất kỳ          | Kiểm tra kháng thể trước |
| Cúm mùa | Hàng năm          | Phụ nữ mang thai nên tiêm |

## 3. Dinh dưỡng hợp lý

- **Protein**: cá hồi, đậu nành.
- **Canxi**: sữa chua, hạnh nhân.
- **Sắt & acid folic**: rau lá xanh, thịt đỏ.

\`\`\`mermaid
graph TD; A[Thói quen lành mạnh] --> B[Khám định kỳ]; A --> C[Dinh dưỡng]; A --> D[Vận động];\`\`\`

## 4. Vận động & lối sống

- Tập **Kegel** 10 phút/ngày.
- Ngủ đủ 7–8 giờ.
- Tránh thức khuya >23h.

## Kết luận

Chăm sóc sức khoẻ sinh sản là hành trình liên tục. Hãy đặt lịch khám ngay hôm nay để bảo vệ chính bạn!
    `,
    author: {
      name: "BS. Nguyễn Thị Hương",
      avatar: Image1,
      title: "Bác sĩ Sản phụ khoa",
    },
    category: "women-health",
    tags: ["Sức khỏe phụ nữ", "Sinh sản", "Chăm sóc"],
    publishDate: "2024-01-15",
    readTime: 8,
    views: 2450,
    likes: 156,
    image: Image1,
    isFeatured: true,
  },
  {
    id: 2,
    title: "Tầm quan trọng của xét nghiệm STI định kỳ",
    excerpt:
      "Tại sao cần xét nghiệm các bệnh lây truyền qua đường tình dục định kỳ và nên làm những xét nghiệm gì?",
    content: `
## Vì sao phải xét nghiệm?

1. **Không triệu chứng**: 70% trường hợp Chlamydia không biểu hiện.
2. **Ngăn biến chứng**: Viêm vùng chậu, vô sinh.
3. **Bảo vệ bạn tình**: Phát hiện & điều trị sớm.

### Các xét nghiệm phổ biến

- **HIV test nhanh**: 15 phút.
- **PCR Chlamydia & Gonorrhea**.
- **HBsAg, HCV Ab**.

> Hãy trò chuyện thẳng thắn với nhân viên y tế về lịch sử quan hệ để được tư vấn gói xét nghiệm phù hợp.

## Tần suất khuyến cáo

- Người hoạt động tình dục an toàn: **12&nbsp;tháng/lần**.
- Có nhiều bạn tình/không dùng bao: **3–6&nbsp;tháng/lần**.

## Quy trình tại Gender Healthcare

1. Đặt lịch online.
2. Lấy mẫu **kín đáo – an toàn**.
3. Nhận kết quả qua **App** trong 24&nbsp;h.

![Lấy mẫu xét nghiệm](https://picsum.photos/600/300)

\`Sample code block\`
const result = await api.get('/sti-test');
console.log(result);
\`

## Chi phí & Bảo hiểm

- Giá trọn gói từ **499&nbsp;K**.
- Chấp nhận **Bảo hiểm y tế** & thanh toán không tiền mặt.

`,
    author: {
      name: "BS. Trần Văn Nam",
      avatar: Image2,
      title: "Chuyên gia Xét nghiệm",
    },
    category: "testing",
    tags: ["STI", "Xét nghiệm", "Phòng ngừa"],
    publishDate: "2024-01-12",
    readTime: 6,
    views: 1890,
    likes: 98,
    image: Image2,
    isFeatured: false,
  },
  {
    id: 3,
    title: "Tư vấn tâm lý trong các mối quan hệ tình dục",
    excerpt:
      "Những vấn đề tâm lý thường gặp và cách giao tiếp hiệu quả trong quan hệ tình dục.",
    content: `
## Áp lực phổ biến

- Hiệu suất tình dục.
- Sợ hãi bị đánh giá.
- Khác biệt ham muốn.

## Kỹ thuật giao tiếp 3 bước

1. **Lắng nghe** chủ động.
2. **Phản hồi** cảm xúc, không phán xét.
3. **Thỏa thuận** giải pháp đôi bên.

> "Sự thân mật khởi nguồn từ sự thấu hiểu." – *TS. Lê Thị Lan*

### Khi nào cần gặp chuyên gia?

- Lo âu kéo dài >2 tháng.
- Ảnh hưởng công việc, quan hệ.
- Có ý nghĩ tự gây hại.

## Tài nguyên hỗ trợ

- Hotline 1900&nbsp;9234
- Group cộng đồng **LGBTQ+ Support VN**.
- App **GenderCare** (iOS/Android).

`,
    author: {
      name: "TS. Lê Thị Lan",
      avatar: Image3,
      title: "Chuyên gia Tâm lý",
    },
    category: "psychology",
    tags: ["Tâm lý", "Giao tiếp", "Mối quan hệ"],
    publishDate: "2024-01-10",
    readTime: 10,
    views: 3200,
    likes: 245,
    image: Image3,
    isFeatured: true,
  },
];

export default blogPosts; 