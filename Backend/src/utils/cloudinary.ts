import { v2 as cloudinary } from 'cloudinary';

// Parse CLOUDINARY_URL theo định dạng: cloudinary://api_key:api_secret@cloud_name
const cloudinaryUrl = process.env.CLOUDINARY_URL as string;
const matches = cloudinaryUrl.match( 
  /cloudinary:\/\/([^:]+):([^@]+)@(.+)/
);

if (!matches) {
  throw new Error('CLOUDINARY_URL không hợp lệ');
}

const [, api_key, api_secret, cloud_name] = matches;

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

export default cloudinary;  