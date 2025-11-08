'use client';

import { useState, useEffect } from 'react';
import { Game } from '@/components/GameCard';
import { getAppwriteClient, isAppwriteConfigured, AppwriteConfig } from '@/lib/appwrite';

export function useGames(config: AppwriteConfig) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
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
        config.collectionId
      );

      const appwriteGames: Game[] = response.documents.map((doc: any) => {
        return {
          $id: doc.$id,
          title: doc.title,
          image: doc.image,
          price: doc.price,
          genre: doc.genre,
          rating: doc.rating,
          description: doc.description,
          releaseDate: doc.releaseDate,
          platforms: doc.platforms,
          tags: doc.tags,
          capsule: doc.capsule,
          pageBackground: doc.pageBackground,
          logo: doc.logo,
          header: doc.header,
          hero: doc.hero,
          developer: doc.developer,
          publisher: doc.publisher,
          screenshots: doc.screenshots,
          video: doc.video,
          shortDescription: doc.description,
          longDescription: doc.longDescription,
          featured: doc.featured,
          versions: doc.versions
        };
      });

      setGames(appwriteGames);
    } catch (err: any) {
      console.error('Failed to fetch games from Appwrite:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [config.endpoint, config.projectId, config.databaseId, config.collectionId]);

  return { games, loading, error, refetch: fetchGames };
}
