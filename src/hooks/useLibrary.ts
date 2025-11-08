import { useState, useEffect } from 'react';
import { getAppwriteClient } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Game } from '@/components/GameCard';

interface AppwriteConfig {
  databaseId: string;
  collectionId?: string;
}

export function useLibrary(config: AppwriteConfig, userId: string | null) {
  const [libraryGames, setLibraryGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLibraryGames([]);
      setLoading(false);
      return;
    }

    const fetchLibrary = async () => {
      try {
        setLoading(true);
        
        const { databases } = getAppwriteClient();
        if (!databases) {
          throw new Error('Appwrite not configured');
        }
        
        const libraryResponse = await databases.listDocuments(
          config.databaseId,
          'libraries',
          [Query.equal('userId', userId)]
        );

        if (libraryResponse.documents.length === 0) {
          setLibraryGames([]);
          setLoading(false);
          return;
        }

        const gameIds = libraryResponse.documents.map((doc) => (doc as unknown as { gameId: string }).gameId);

        const gamesResponse = await databases.listDocuments(
          config.databaseId,
          'games',
          [Query.equal('$id', gameIds)]
        );

        const games = gamesResponse.documents.map((doc) => {
          const anyDoc = doc as Record<string, unknown>;
          return {
            $id: anyDoc.$id as string,
            title: (anyDoc.title as string) || 'Untitled',
            description: (anyDoc.description as string) || '',
            shortDescription: (anyDoc.shortDescription as string) || (anyDoc.description as string) || '',
            longDescription: (anyDoc.longDescription as string) || (anyDoc.description as string) || '',
            image: (anyDoc.image as string) || '',
            capsule: (anyDoc.capsule as string) || (anyDoc.image as string) || '',
            price: (anyDoc.price as number) || 0,
            genre: (anyDoc.genre as string) || 'Unknown',
            rating: (anyDoc.rating as number) || 0,
            developer: (anyDoc.developer as string) || 'Unknown',
            publisher: (anyDoc.publisher as string) || 'Unknown',
            releaseDate: (anyDoc.releaseDate as string) || '',
            featured: (anyDoc.featured as boolean) || false,
            screenshots: Array.isArray(anyDoc.screenshots) ? (anyDoc.screenshots as string[]) : [],
            video: (anyDoc.video as string) || null,
          } as unknown as Game;
        });

        setLibraryGames(games);
        setError(null);
      } catch (err) {
        console.error('Error fetching library:', err);
        setError(err instanceof Error ? err.message : 'Failed to load library');
        setLibraryGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, [config.databaseId, userId]);

  const addToLibrary = async (gameId: string) => {
    if (!userId) {
      throw new Error('User must be logged in to add games to library');
    }

    try {
      const { databases } = getAppwriteClient();
      if (!databases) {
        throw new Error('Appwrite not configured');
      }

      await databases.createDocument(
        config.databaseId,
        'libraries',
        'unique()',
        {
          userId,
          gameId,
          addedAt: new Date().toISOString(),
        },
        [
          `read("user:${userId}")`,
          `update("user:${userId}")`,
          `delete("user:${userId}")`
        ]
      );

      const gamesResponse = await databases.getDocument(
        config.databaseId,
        'games',
        gameId
      );

      const game: Game = {
        $id: gamesResponse.$id,
        title: gamesResponse.title || 'Untitled',
        description: gamesResponse.description || '',
        shortDescription: gamesResponse.shortDescription || gamesResponse.description || '',
        longDescription: gamesResponse.longDescription || gamesResponse.description || '',
        image: gamesResponse.image || '',
        capsule: gamesResponse.capsule || gamesResponse.image || '',
        price: gamesResponse.price || 0,
        genre: gamesResponse.genre || 'Unknown',
        rating: gamesResponse.rating || 0,
        developer: gamesResponse.developer || 'Unknown',
        publisher: gamesResponse.publisher || 'Unknown',
        releaseDate: gamesResponse.releaseDate || '',
        featured: gamesResponse.featured || false,
        screenshots: Array.isArray(gamesResponse.screenshots) ? gamesResponse.screenshots : [],
        video: gamesResponse.video || null,
      };

      setLibraryGames((prev) => [...prev, game]);
    } catch (err) {
      console.error('Error adding to library:', err);
      throw err;
    }
  };

  const removeFromLibrary = async (gameId: string) => {
    if (!userId) return;

    try {
      const { databases } = getAppwriteClient();
      if (!databases) {
        throw new Error('Appwrite not configured');
      }

      const libraryResponse = await databases.listDocuments(
        config.databaseId,
        'libraries',
        [Query.equal('userId', userId), Query.equal('gameId', gameId)]
      );

      if (libraryResponse.documents.length > 0) {
        await databases.deleteDocument(
          config.databaseId,
          'libraries',
          libraryResponse.documents[0].$id
        );

        setLibraryGames((prev) => prev.filter((game) => game.$id !== gameId));
      }
    } catch (err) {
      console.error('Error removing from library:', err);
      throw err;
    }
  };

  const isInLibrary = (gameId: string) => {
    return libraryGames.some((game) => game.$id === gameId);
  };

  return {
    libraryGames,
    loading,
    error,
    addToLibrary,
    removeFromLibrary,
    isInLibrary,
  };
}
