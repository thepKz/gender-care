import cloudinary from '../utils/cloudinary';

/**
 * Upload file lên cloudinary
 * @param filePath Đường dẫn file tạm
 * @param folder Tên folder cloudinary
 * @returns url ảnh
 */
export const uploadToCloudinary = async (filePath: string, folder = 'avatars') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      overwrite: true,
    });
    return result.secure_url;
  } catch (error) {
    throw new Error('Lỗi upload cloudinary: ' + (error as any).message);
  }
}; 