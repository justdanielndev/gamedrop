import { useState, useEffect } from 'react';
import { getAppwriteClient } from '@/lib/appwrite';
import { Query, Permission, Role } from 'appwrite';

interface Game {
  $id: string;
  title: string;
  coverImage: string;
  image: string;
  price: number;
  releaseDate: string;
  platforms: string[];
  genre: string;
  description: string;
}

interface WishlistEntry {
  $id: string;
  userId: string;
  gameId: string;
  addedAt: string;
}

export function useWishlist(userId: string | undefined) {
  const [wishlistGames, setWishlistGames] = useState<Game[]>([]);
  const [wishlistEntries, setWishlistEntries] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    if (!userId) {
      setWishlistGames([]);
      setWishlistEntries([]);
      setLoading(false);
      return;
    }

    try {
      const { databases } = getAppwriteClient();
      if (!databases) {
        setLoading(false);
        return;
      }

      const wishlistResponse = await databases.listDocuments(
        'drop-db',
        'wishlists',
        [Query.equal('userId', userId)]
      );

      const entries = wishlistResponse.documents as unknown as WishlistEntry[];
      setWishlistEntries(entries);

      if (entries.length === 0) {
        setWishlistGames([]);
        setLoading(false);
        return;
      }

      const gameIds = entries.map(entry => entry.gameId);
      const gamesResponse = await databases.listDocuments(
        'drop-db',
        'games',
        [Query.equal('$id', gameIds)]
      );

      setWishlistGames(gamesResponse.documents as unknown as Game[]);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistGames([]);
      setWishlistEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [userId]);

  const addToWishlist = async (gameId: string) => {
    if (!userId) return;

    try {
      const { databases } = getAppwriteClient();
      if (!databases) return;

      await databases.createDocument(
        'drop-db',
        'wishlists',
        'unique()',
        {
          userId,
          gameId,
          addedAt: new Date().toISOString()
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );

      await fetchWishlist();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const removeFromWishlist = async (gameId: string) => {
    if (!userId) return;

    try {
      const { databases } = getAppwriteClient();
      if (!databases) return;

      const entry = wishlistEntries.find(e => e.gameId === gameId);
      if (!entry) return;

      await databases.deleteDocument('drop-db', 'wishlists', entry.$id);
      await fetchWishlist();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const isInWishlist = (gameId: string) => {
    return wishlistEntries.some(entry => entry.gameId === gameId);
  };

  return {
    wishlistGames,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refetch: fetchWishlist
  };
}
