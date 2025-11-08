'use client';

import { useState, useEffect } from 'react';
import { getAppwriteClient, isAppwriteConfigured, AppwriteConfig } from '@/lib/appwrite';

export interface NewsArticle {
  $id: string;
  slug: string;
  headline: string;
  content: string;
  author: string;
  gameId?: string;
  publishDate: string;
}

export function useNews(config: AppwriteConfig) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    if (!isAppwriteConfigured()) {
      setError('Appwrite is not configured. Please check your environment variables.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { databases } = getAppwriteClient();
      if (!databases) {
        throw new Error('Appwrite not initialized');
      }

      const response = await databases.listDocuments(
        config.databaseId,
        'news'
      );

      const newsArticles: NewsArticle[] = response.documents.map((doc) => {
        const anyDoc = doc as Record<string, unknown>;
        return {
          $id: anyDoc.$id as string,
          slug: anyDoc.slug as string,
          headline: anyDoc.headline as string,
          content: anyDoc.content as string,
          author: anyDoc.author as string,
          gameId: anyDoc.gameId ? String(anyDoc.gameId) : undefined,
          publishDate: anyDoc.publishDate as string
        };
      });

      newsArticles.sort((a, b) => 
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      );

      setNews(newsArticles);
    } catch (err) {
      console.error('Failed to fetch news from Appwrite:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [config.endpoint, config.projectId, config.databaseId]);

  return { news, loading, error, refetch: fetchNews };
}
