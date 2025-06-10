# FloatingAppointmentButton Component

## 📋 Mô tả

Component floating action button chuyên nghiệp để đặt lịch hẹn tư vấn sức khỏe. Button này xuất hiện ở góc phải dưới màn hình khi user scroll xuống, với các animation nổi bật để thu hút sự chú ý.

## 🎯 Tính năng chính

### ✨ Smart Scroll Detection
- Tự động hiển thị khi scroll xuống > 300px
- Animation slide-up entrance mượt mà
- Performance optimization với throttled scroll listener

### 🎨 Advanced Animations
- **Floating bounce**: Animation nhẹ nhàng liên tục
- **Magnetic hover**: Hiệu ứng pull khi hover
- **Attention seeking**: Tự động chạy sau 2 giây để thu hút chú ý
- **Heartbeat**: Animation đập khi hover
- **Advanced pulse**: Glow effect xung quanh button

### 📱 Responsive Design
- Responsive sizes: 64px (mobile) → 72px (tablet) → 80px (desktop)
- Mobile-specific expanded tooltip với thông tin chi tiết
- Touch-friendly button size và interactions

### ♿ Accessibility
- ARIA labels đầy đủ
- Keyboard navigation support
- Screen reader friendly
- Focus indicators rõ ràng

## 🚀 Cách sử dụng

### Basic Usage
```tsx
import { FloatingAppointmentButton } from '@/components/common';

function MyPage() {
  return (
    <div>
      {/* Page content */}
      <FloatingAppointmentButton />
    </div>
  );
}
```

### Advanced Usage với Custom Handler
```tsx
import { FloatingAppointmentButton } from '@/components/common';
import { useNavigate } from 'react-router-dom';
import { useModal } from '@/hooks/useModal';

function ConsultationPage() {
  const navigate = useNavigate();
  const { openModal } = useModal();

  const handleAppointmentClick = () => {
    // Option 1: Open modal
    openModal('AppointmentBookingModal');
    
    // Option 2: Navigate to booking page
    // navigate('/consultation/book');
    
    // Option 3: External tracking
    gtag('event', 'appointment_button_click', {
      source: 'floating_button',
      page: window.location.pathname
    });
  };

  return (
    <div>
      {/* Page content */}
      <FloatingAppointmentButton 
        onAppointmentClick={handleAppointmentClick}
        className="custom-floating-styles"
      />
    </div>
  );
}
```

## 📝 Props API

```tsx
interface FloatingAppointmentButtonProps {
  className?: string;
  onAppointmentClick?: () => void;
}
```

### Props Details

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `onAppointmentClick` | `() => void` | `undefined` | Custom click handler. Nếu không có, sẽ navigate to `/consultation/book` |

## 🎨 Styling & Customization

### CSS Classes Available
```css
/* Main animation classes */
.floating-bounce          /* Continuous gentle bounce */
.magnetic-hover           /* Hover magnetic effect */
.slide-up-entrance        /* Initial appearance animation */
.heartbeat-button         /* Heartbeat on hover */
.attention-seeking        /* Attention seeking animation */
.advanced-pulse           /* Advanced pulse with glow */

/* Responsive adjustments */
@media (max-width: 768px) {
  .floating-bounce { animation-duration: 4s; }
  .attention-seeking { animation-duration: 5s; }
}
```

### Custom Styling Example
```tsx
<FloatingAppointmentButton 
  className="
    custom-positioning 
    lg:bottom-8 lg:right-8 
    xl:w-24 xl:h-24
  "
/>
```

## 🔧 Configuration

### Scroll Threshold
Thay đổi threshold khi button xuất hiện:
```tsx
// Trong component (line 43)
const shouldShow = scrollTop > 300; // Thay đổi 300 thành giá trị khác
```

### Animation Delays
```tsx
// Attention seeker delay (line 47)
setTimeout(() => {
  setShowAttentionSeeker(true);
}, 2000); // Thay đổi 2000ms thành giá trị khác

// Entrance animation reset (line 51)
setTimeout(() => {
  setHasJustAppeared(false);
}, 700); // Thay đổi 700ms thành giá trị khác
```

## 📱 Responsive Behavior

### Desktop (lg+)
- Size: 80x80px
- Tooltip hiển thị bên trái button
- Hover effects đầy đủ

### Tablet (md)
- Size: 72x72px
- Tooltip compact
- Touch-optimized interactions

### Mobile (sm)
- Size: 64x64px
- Expanded card thay vì tooltip
- Touch-friendly button size

## 🎭 Animation Timeline

```
1. Page Load
   ↓ User scrolls down 300px
2. Slide-up entrance (0.7s)
   ↓ 2 seconds delay
3. Attention seeking starts (loops every 4s)
   ↓ User hovers
4. Heartbeat + magnetic pull
   ↓ User clicks
5. All animations stop
```

## 🔍 Testing

### Manual Testing Checklist
- [ ] Button xuất hiện sau scroll 300px
- [ ] Animation slide-up smooth
- [ ] Attention seeking bắt đầu sau 2s
- [ ] Hover effects hoạt động
- [ ] Click navigation đúng
- [ ] Responsive trên mobile/tablet
- [ ] Accessibility với screen reader
- [ ] Performance không lag khi scroll

### Test Demo
```tsx
import FloatingAppointmentDemo from '@/components/common/FloatingAppointmentDemo';

// Sử dụng demo component để test
<FloatingAppointmentDemo />
```

## 🐛 Troubleshooting

### Button không xuất hiện
```tsx
// Check CSS classes conflict
// Ensure z-index: 50 không bị override
// Verify scroll event listener hoạt động
console.log('Scroll position:', window.pageYOffset);
```

### Animation không smooth
```tsx
// Check CSS animations loaded
// Verify TailwindCSS animations enabled
// Ensure no CSS conflicts với existing animations
```

### Performance issues
```tsx
// Scroll listener đã được throttled
// Nếu vẫn lag, tăng throttle delay
// Hoặc sử dụng Intersection Observer thay thế
```

## 🔄 Future Enhancements

### Planned Features
- [ ] Multiple button variants (emergency, info, etc.)
- [ ] Customizable icons và text
- [ ] Animation preferences từ user settings
- [ ] A/B testing integration
- [ ] Analytics tracking built-in

### Integration Ideas
```tsx
// With notification system
<FloatingAppointmentButton 
  hasNotification={unreadMessages > 0}
  notificationCount={unreadMessages}
/>

// With user preferences
<FloatingAppointmentButton 
  animationLevel={userPreferences.animationLevel}
  autoHide={userPreferences.autoHideFloatingButtons}
/>
```

## 📚 Related Components

- `AppointmentModal` - Modal được trigger bởi button
- `ConsultationCard` - Card hiển thị thông tin consultation
- `BookingForm` - Form đặt lịch hẹn chính

## 🤝 Contributing

Khi modify component này:

1. **Test thoroughly** trên all devices
2. **Maintain accessibility** standards  
3. **Keep animations performant** (60fps)
4. **Follow design system** colors và spacing
5. **Update documentation** này nếu có breaking changes

---

*Created by: Frontend Team*  
*Last updated: 2024*  
*Version: 1.0.0* 