# Code Optimization Guide

## Tổng quan
Để tránh lặp code, chúng ta đã tạo một số utilities và hooks có thể tái sử dụng.

## 1. API Error Handling

### `utils/apiErrorHandler.ts`

```typescript
import { handleApiError, showSuccessNotification } from '../utils/apiErrorHandler';

// Thay vì:
try {
  // api call
} catch (error) {
  notification.error({
    message: 'Lỗi',
    description: error.response?.data?.message || 'Có lỗi xảy ra'
  });
}

// Sử dụng:
try {
  // api call
} catch (error) {
  handleApiError(error, 'Custom error message');
}

// Success notification
showSuccessNotification('Thao tác thành công!');
```

## 2. API State Management

### `hooks/useApiState.ts`

```typescript
import { useApiState } from '../hooks/useApiState';

// Thay vì:
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleSubmit = async () => {
  try {
    setLoading(true);
    const result = await apiCall();
    notification.success({ message: 'Success' });
  } catch (error) {
    notification.error({ message: 'Error' });
  } finally {
    setLoading(false);
  }
};

// Sử dụng:
const { loading, execute } = useApiState({
  successMessage: 'Thao tác thành công!',
  errorMessage: 'Có lỗi xảy ra'
});

const handleSubmit = async () => {
  await execute(
    () => apiCall(),
    (result) => {
      // handle success
    }
  );
};
```

## 3. Service Selection

### `hooks/useServiceSelection.ts`

```typescript
import { useServiceSelection } from '../hooks/useServiceSelection';

// Thay vì viết lại logic load services và selection trong mỗi component:
const {
  services,
  selectedService,
  loading,
  selectService,
  clearSelection
} = useServiceSelection();
```

### `components/ui/ServiceSelector.tsx`

```typescript
import { ServiceSelector } from '../components/ui/ServiceSelector';

// Sử dụng component có sẵn thay vì viết lại UI:
<ServiceSelector
  services={services}
  selectedService={selectedService}
  loading={loading}
  onSelect={selectService}
  onClear={clearSelection}
  placeholder="Chọn dịch vụ..."
/>
```

## 4. So sánh Before/After

### Before (Code lặp lại):
```typescript
// Component A
const [loading, setLoading] = useState(false);
const loadData = async () => {
  try {
    setLoading(true);
    const result = await api.getData();
    setData(result);
  } catch (error) {
    notification.error({
      message: 'Lỗi',
      description: 'Không thể tải dữ liệu'
    });
  } finally {
    setLoading(false);
  }
};

// Component B (tương tự)
const [loading, setLoading] = useState(false);
const loadData = async () => {
  try {
    setLoading(true);
    const result = await api.getData();
    setData(result);
  } catch (error) {
    notification.error({
      message: 'Lỗi',
      description: 'Không thể tải dữ liệu'
    });
  } finally {
    setLoading(false);
  }
};
```

### After (Tái sử dụng):
```typescript
// Component A
const { loading, execute } = useApiState({
  errorMessage: 'Không thể tải dữ liệu'
});

const loadData = async () => {
  await execute(
    () => api.getData(),
    (result) => setData(result)
  );
};

// Component B (tương tự)
const { loading, execute } = useApiState({
  errorMessage: 'Không thể tải dữ liệu'
});

const loadData = async () => {
  await execute(
    () => api.getData(),
    (result) => setData(result)
  );
};
```

## 5. Best Practices

1. **Luôn sử dụng `handleApiError`** thay vì viết lại error handling
2. **Sử dụng `useApiState`** cho mọi API calls có loading state
3. **Tạo reusable components** cho UI patterns lặp lại
4. **Extract hooks** cho business logic phức tạp
5. **Ưu tiên composition over inheritance**

## 6. Lưu ý khi Refactor

- Đừng refactor quá nhiều code cùng lúc
- Test thoroughly sau khi refactor
- Giữ backward compatibility nếu có thể
- Document changes clearly

## 7. Utilities mới cần tạo

- `useFormSubmission` - Quản lý form submission states
- `useConfirmDialog` - Reusable confirm dialogs
- `usePagination` - Pagination logic
- `useSearch` - Search and filter logic

Các utilities này sẽ giúp giảm đáng kể code duplication trong dự án. 