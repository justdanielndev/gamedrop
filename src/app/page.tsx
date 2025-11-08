'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/Topbar';
import GameGrid from '@/components/GameGrid';
import NewsCard from '@/components/NewsCard';
import NewsModal from '@/components/NewsModal';
import { Game } from '@/components/GameCard';
import { NewsArticle } from '@/hooks/useNews';
import { useGames } from '@/hooks/useGames';
import { useNews } from '@/hooks/useNews';
import { useLibrary } from '@/hooks/useLibrary';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
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

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('STORE');
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredScrollPosition, setFeaturedScrollPosition] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);

  const { games, loading } = useGames(appwriteConfig);
  const { news, loading: newsLoading } = useNews(appwriteConfig);
  const { libraryGames, loading: libraryLoading } = useLibrary(appwriteConfig, user?.$id || null);
  const { wishlistGames, loading: wishlistLoading } = useWishlist(user?.$id);
  const [filteredStoreGames, setFilteredStoreGames] = useState<Game[]>([]);
  const [filteredLibraryGames, setFilteredLibraryGames] = useState<Game[]>([]);
  const [filteredWishlistGames, setFilteredWishlistGames] = useState<Game[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsArticle[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabFromUrl = params.get('tab');
      if (tabFromUrl) {
        setActiveTab(tabFromUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredStoreGames(
        games.filter((game) =>
          game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.genre.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredLibraryGames(
        libraryGames.filter((game) =>
          game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.genre.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredWishlistGames(
        wishlistGames.filter((game) =>
          game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.genre.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredNews(
        news.filter((article) =>
          article.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredStoreGames(games);
      setFilteredLibraryGames(libraryGames);
      setFilteredWishlistGames(wishlistGames);
      setFilteredNews(news);
    }
  }, [games, libraryGames, wishlistGames, news, searchQuery]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery('');
    window.history.pushState({}, '', `/?tab=${tab}`);
  };

  const handleGameClick = (game: Game) => {
    setSearchQuery('');
    router.push(`/game/${game.$id}`);
  };

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsNewsModalOpen(true);
  };

  const handleGameLinkClick = (gameId: string) => {
    setIsNewsModalOpen(false);
    router.push(`/game/${gameId}`);
  };

  const featuredGames = games.filter(game => game.featured).slice(0, 5);

  const scrollFeatured = (direction: 'left' | 'right') => {
    const container = document.querySelector(`.${styles.featuredContainer}`);
    if (!container) return;
    
    const scrollAmount = container.clientWidth;
    const newPosition = direction === 'left' 
      ? Math.max(0, featuredScrollPosition - scrollAmount)
      : Math.min(
          (featuredGames.length - 1) * scrollAmount,
          featuredScrollPosition + scrollAmount
        );
    
    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setFeaturedScrollPosition(newPosition);
  };

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        <Topbar
          onSearch={setSearchQuery}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          searchQuery={searchQuery}
        />

        <div className={styles.content}>
          {activeTab === 'STORE' && (
            <>
              <section className={`${styles.hero} ${searchQuery ? styles.heroCollapsed : ''}`}>
                <div className={styles.featuredWrapper}>
                  {featuredScrollPosition > 0 && (
                    <button 
                      className={`${styles.featuredNav} ${styles.featuredNavLeft}`}
                      onClick={() => scrollFeatured('left')}
                      aria-label="Previous featured game"
                    >
                      ‹
                    </button>
                  )}
                  
                  <div className={styles.featuredContainer}>
                    {featuredGames.map((game) => (
                      <div key={game.$id} className={styles.featuredCard}>
                        <img
                          src={game.image}
                          alt={game.title}
                          className={styles.featuredImage}
                        />
                        <div className={styles.featuredOverlay}>
                          <div className={styles.featuredContent}>
                            <p className={styles.featuredTitle}>Featured</p>
                            <h2 className={styles.featuredGameTitle}>{game.title}</h2>
                            <p className={styles.featuredDesc}>{game.description}</p>
                            <button 
                              className={styles.featuredBtn}
                              onClick={() => handleGameClick(game)}
                            >
                              Check it out
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {featuredScrollPosition < (featuredGames.length - 1) * (typeof window !== 'undefined' ? window.innerWidth - 48 : 1200) && (
                    <button 
                      className={`${styles.featuredNav} ${styles.featuredNavRight}`}
                      onClick={() => scrollFeatured('right')}
                      aria-label="Next featured game"
                    >
                      ›
                    </button>
                  )}
                </div>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {searchQuery ? `Search results for "${searchQuery}"` : 'All Games'}
                </h2>
                {loading ? (
                  <div className={styles.loading}>Loading games...</div>
                ) : filteredStoreGames.length === 0 && searchQuery ? (
                  <div className={styles.placeholder}>
                    <h2>No games found</h2>
                    <p>Try a different search term</p>
                  </div>
                ) : (
                  <GameGrid games={filteredStoreGames} onGameClick={handleGameClick} />
                )}
              </section>
            </>
          )}

          {activeTab === 'LIBRARY' && (
            <>
              {searchQuery ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    Search results: &quot;{searchQuery}&quot;
                  </h2>
                  {!user ? (
                    <div className={styles.placeholder}>
                      <h2>Sign in to view your library</h2>
                      <p>Your purchased games will appear here</p>
                    </div>
                  ) : libraryLoading || wishlistLoading ? (
                    <div className={styles.loading}>Loading...</div>
                  ) : (() => {
                    const combinedGames = [...filteredLibraryGames, ...filteredWishlistGames];
                    const uniqueGames = combinedGames.filter((game, index, self) =>
                      index === self.findIndex((g) => g.$id === game.$id)
                    );
                    return uniqueGames.length === 0 ? (
                      <div className={styles.placeholder}>
                        <h2>No games found</h2>
                        <p>Try a different search term</p>
                      </div>
                    ) : (
                      <GameGrid games={uniqueGames} onGameClick={handleGameClick} />
                    );
                  })()}
                </section>
              ) : (
                <>
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Your Library</h2>
                    {!user ? (
                      <div className={styles.placeholder}>
                        <h2>Sign in to view your library</h2>
                        <p>Your purchased games will appear here</p>
                      </div>
                    ) : libraryLoading ? (
                      <div className={styles.loading}>Loading library...</div>
                    ) : filteredLibraryGames.length === 0 ? (
                      <div className={styles.placeholder}>
                        <h2>Your library is empty</h2>
                        <p>Games you add to your library will appear here</p>
                      </div>
                    ) : (
                      <GameGrid games={filteredLibraryGames} onGameClick={handleGameClick} />
                    )}
                  </section>

                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Your Wishlist</h2>
                    {!user ? (
                      <div className={styles.placeholder}>
                        <h2>Sign in to view your wishlist</h2>
                        <p>Games you wishlist will appear here</p>
                      </div>
                    ) : wishlistLoading ? (
                      <div className={styles.loading}>Loading wishlist...</div>
                    ) : filteredWishlistGames.length === 0 ? (
                      <div className={styles.placeholder}>
                        <h2>Your wishlist is empty</h2>
                        <p>Games you add to your wishlist will appear here</p>
                      </div>
                    ) : (
                      <GameGrid games={filteredWishlistGames} onGameClick={handleGameClick} />
                    )}
                  </section>
                </>
              )}
            </>
          )}

          {activeTab === 'NEWS' && (
            <div className={styles.newsSection}>
              <h2 className={styles.sectionTitle}>
                {searchQuery ? `News: "${searchQuery}"` : 'Latest News'}
              </h2>
              {newsLoading ? (
                <div className={styles.loading}>Loading news...</div>
              ) : filteredNews.length === 0 && searchQuery ? (
                <div className={styles.placeholder}>
                  <h2>No news found</h2>
                  <p>Try a different search term</p>
                </div>
              ) : filteredNews.length === 0 ? (
                <div className={styles.placeholder}>
                  <h2>No News Available</h2>
                  <p>Check back later for the latest gaming news and updates</p>
                </div>
              ) : (
                <div className={styles.newsGrid}>
                  {filteredNews.map((article) => (
                    <NewsCard
                      key={article.$id}
                      article={article}
                      onArticleClick={handleArticleClick}
                      onGameClick={handleGameLinkClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <NewsModal
        article={selectedArticle}
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        onGameClick={handleGameLinkClick}
      />
    </div>
  );
}
