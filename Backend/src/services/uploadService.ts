import cloudinary from '../utils/cloudinary';

/**
 * Upload file lên cloudinary với WebP optimization
 * @param filePath Đường dẫn file tạm
 * @param folder Tên folder cloudinary
 * @returns url ảnh đã được optimize
 */
export const uploadToCloudinary = async (filePath: string, folder = 'avatars') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      overwrite: true,
      // ✅ Enhanced WebP optimization cho medical photos
      transformation: [
        {
          quality: 'auto:good', // Auto quality optimization
          fetch_format: 'auto', // Auto format selection (WebP for modern browsers)
          width: 800, // Max width cho professional photos
          height: 800, // Max height
          crop: 'limit', // Không crop, chỉ resize nếu lớn hơn
        }
      ],
      // ✅ Generate multiple formats for compatibility
      eager: [
        { 
          format: 'webp', 
          quality: 'auto:good',
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face' // Smart crop focusing on faces
        },
        { 
          format: 'jpg', 
          quality: 'auto:good',
          width: 400, 
          height: 400,
          crop: 'fill',
          gravity: 'face'
        }
      ]
    });
    
    console.log('Cloudinary upload result:', {
      original_url: result.secure_url,
      webp_available: result.eager && result.eager.length > 0,
      formats_generated: result.eager?.map((e: any) => e.format)
    });
    
    return result.secure_url;
  } catch (error) {
    throw new Error('Lỗi upload cloudinary: ' + (error as any).message);
  }
}; 