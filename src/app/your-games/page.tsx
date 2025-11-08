'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from 'supercons';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnedGames } from '@/hooks/useOwnedGames';
import { initAppwrite } from '@/lib/appwrite';
import styles from './page.module.css';

const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'drop-db',
  collectionId: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || 'games',
};

if (typeof window !== 'undefined' && appwriteConfig.endpoint && appwriteConfig.projectId) {
  initAppwrite(appwriteConfig);
}

export default function YourGamesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { ownedGames, loading: gamesLoading } = useOwnedGames(user?.$id);
  const [activeTab, setActiveTab] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/?tab=${tab}`);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/?auth=signin');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className={styles.page}>
        <Topbar
          onSearch={setSearchQuery}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          hideSearch={true}
          searchQuery={searchQuery}
        />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.page}>
      <Topbar
        onSearch={setSearchQuery}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hideSearch={true}
        searchQuery={searchQuery}
      />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Games</h1>
          <p className={styles.subtitle}>Manage games you own</p>
        </div>

        {gamesLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your games...</p>
          </div>
        ) : ownedGames.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              📦
            </div>
            <h2>No games yet</h2>
            <p>You don&apos;t own any games yet. Accept an invite to become a game owner.</p>
          </div>
        ) : (
          <div className={styles.gamesList}>
            {ownedGames.map((game) => (
              <div key={game.$id} className={styles.gameCard}>
                <div className={styles.gameImage}>
                  {game.header ? (
                    <img src={game.header} alt={game.title} />
                  ) : (
                    <div className={styles.placeholderImage}>
                      🎮
                    </div>
                  )}
                </div>
                
                <div className={styles.gameInfo}>
                  <h3 className={styles.gameTitle}>{game.title}</h3>
                  <div className={styles.gameStats}>
                    <span className={styles.stat}>
                      <Icon glyph="star-fill" size={14} />
                      {game.rating ? `${game.rating}/10` : 'No rating'}
                    </span>
                    <span className={styles.stat}>
                      <Icon glyph="payment" size={14} />
                      {game.price === 0 ? 'Free' : `$${game.price?.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className={styles.gameActions}>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => router.push(`/game/${game.$id}`)}
                  >
                    <Icon glyph="view" size={18} />
                    View Page
                  </button>
                  <button 
                    className={styles.actionBtnPrimary}
                    onClick={() => router.push(`/manage-game/${game.$id}`)}
                  >
                    <Icon glyph="edit" size={18} />
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
