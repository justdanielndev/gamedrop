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

      const appwriteGames: Game[] = response.documents.map((doc) => {
        const anyDoc = doc as Record<string, unknown>;
        return {
          $id: anyDoc.$id as string,
          title: anyDoc.title as string,
          image: anyDoc.image as string,
          price: anyDoc.price as number,
          genre: anyDoc.genre as string,
          rating: anyDoc.rating as number,
          description: anyDoc.description as string,
          releaseDate: anyDoc.releaseDate as string,
          platforms: anyDoc.platforms as string[],
          tags: anyDoc.tags as string[],
          capsule: anyDoc.capsule as string,
          pageBackground: anyDoc.pageBackground as string,
          logo: anyDoc.logo as string,
          header: anyDoc.header as string,
          hero: anyDoc.hero as string,
          developer: anyDoc.developer as string,
          publisher: anyDoc.publisher as string,
          screenshots: anyDoc.screenshots as string[],
          video: anyDoc.video as string,
          shortDescription: anyDoc.description as string,
          longDescription: anyDoc.longDescription as string,
          featured: anyDoc.featured as boolean,
          versions: anyDoc.versions as unknown
        } as unknown as Game;
      });

      setGames(appwriteGames);
    } catch (err) {
      console.error('Failed to fetch games from Appwrite:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [config.endpoint, config.projectId, config.databaseId, config.collectionId]);

  return { games, loading, error, refetch: fetchGames };
}
