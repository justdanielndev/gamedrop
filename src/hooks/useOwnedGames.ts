import { useState, useEffect } from 'react';
import { getAppwriteClient } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface Game {
  $id: string;
  title: string;
  owner?: string;
  header?: string;
  image?: string;
  coverImage?: string;
  price?: number;
  rating?: number;
}

export function useOwnedGames(userId: string | undefined) {
  const [ownedGames, setOwnedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOwnedGames, setHasOwnedGames] = useState(false);

  useEffect(() => {
    const fetchOwnedGames = async () => {
      if (!userId) {
        setOwnedGames([]);
        setHasOwnedGames(false);
        setLoading(false);
        return;
      }

      try {
        const { databases } = getAppwriteClient();
        if (!databases) {
          setLoading(false);
          return;
        }

        const response = await databases.listDocuments(
          'drop-db',
          'games',
          [Query.equal('owner', userId)]
        );

        const games = response.documents as unknown as Game[];
        setOwnedGames(games);
        setHasOwnedGames(games.length > 0);
      } catch (error) {
        console.error('Error fetching owned games:', error);
        setOwnedGames([]);
        setHasOwnedGames(false);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnedGames();
  }, [userId]);

  return { ownedGames, loading, hasOwnedGames };
}
