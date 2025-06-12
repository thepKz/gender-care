/**
 * Xóa tất cả cookies của trang web hiện tại.
 * Lặp qua tất cả cookies và set ngày hết hạn của chúng về quá khứ.
 */
export const clearAllCookies = () => {
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    // Set cookie hết hạn trong quá khứ và trên domain gốc
    document.cookie = name.trim() + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  }

  if (document.cookie) {
    console.warn('[clearAllCookies] Không thể xóa một số cookies. Có thể do HttpOnly hoặc domain khác.');
  } else {
    console.log('[clearAllCookies] Tất cả cookies phía client đã được xóa.');
  }
}; 