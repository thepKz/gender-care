import { useState } from 'react';
import axios from '../api/axiosConfig';

export const useUploadFile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.url || null;
    } catch (err: any) {
      console.error('Upload failed', err);
      setError(err?.message || 'Upload failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadFile, loading, error };
}; 