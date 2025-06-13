import { useEffect, useState } from "react";
import { fetchPostBySlug } from "../services/cms/postService";

export const usePostDetail = (slug: string | undefined) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchPostBySlug(slug)
      .then((res) => {
        setData(Array.isArray(res) ? res[0] : res);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);

  return { data, loading, error };
}; 