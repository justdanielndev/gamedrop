import { useState, useEffect } from 'react';
import { getAppwriteClient } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Game } from '@/components/GameCard';

interface LibraryEntry {
  $id: string;
  userId: string;
  gameId: string;
  addedAt: string;
}

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

        const gameIds = libraryResponse.documents.map((doc: any) => doc.gameId);

        const gamesResponse = await databases.listDocuments(
          config.databaseId,
          'games',
          [Query.equal('$id', gameIds)]
        );

        const games = gamesResponse.documents.map((doc: any) => ({
          $id: doc.$id,
          title: doc.title || 'Untitled',
          description: doc.description || '',
          shortDescription: doc.shortDescription || doc.description || '',
          longDescription: doc.longDescription || doc.description || '',
          image: doc.image || '',
          capsule: doc.capsule || doc.image || '',
          price: doc.price || 0,
          genre: doc.genre || 'Unknown',
          rating: doc.rating || 0,
          developer: doc.developer || 'Unknown',
          publisher: doc.publisher || 'Unknown',
          releaseDate: doc.releaseDate || '',
          featured: doc.featured || false,
          screenshots: Array.isArray(doc.screenshots) ? doc.screenshots : [],
          video: doc.video || null,
        }));

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
