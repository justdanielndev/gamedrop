'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Icon from 'supercons';
import Topbar from '@/components/Topbar';
import { Game } from '@/components/GameCard';
import { useGames } from '@/hooks/useGames';
import { useLibrary } from '@/hooks/useLibrary';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { initAppwrite } from '@/lib/appwrite';
import { formatReleaseDate } from '@/lib/dateUtils';
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

export default function GameDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { user } = useAuth();
  const { games } = useGames(appwriteConfig);
  const { isInLibrary, addToLibrary, removeFromLibrary } = useLibrary(appwriteConfig, user?.$id || null);
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist(user?.$id);
  const [game, setGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('STORE');
  const [selectedScreenshot, setSelectedScreenshot] = useState<number>(0);
  const [isLibraryProcessing, setIsLibraryProcessing] = useState(false);
  const [isWishlistProcessing, setIsWishlistProcessing] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set([0]));
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    
    const foundGame = games.find(g => g.$id === unwrappedParams.id);
    
    if (foundGame) {
      
      if (foundGame.versions && typeof foundGame.versions === 'string') {
        try {
          const parsed = JSON.parse(foundGame.versions);
          const parsedGame = {
            ...foundGame,
            versions: parsed
          };
          setGame(parsedGame as any);
        } catch (e) {
          setGame(foundGame);
        }
      } else if (foundGame.versions && Array.isArray(foundGame.versions)) {
        setGame(foundGame);
      } else {
        setGame(foundGame);
      }
      setSelectedScreenshot(0);
    } else {
    }
  }, [games, unwrappedParams.id]);

  const allMedia = game ? [
    ...(game.video ? [{ type: 'video' as const, url: game.video }] : []),
    ...(game.screenshots?.map(url => ({ type: 'screenshot' as const, url })) || [])
  ] : [];

  useEffect(() => {
    if (allMedia[selectedScreenshot]?.type !== 'video' || !videoRef.current) {
      return;
    }

    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    const initPlyr = () => {
      if (!videoRef.current) return;

      if ((window as any).Plyr) {
        setTimeout(() => {
          if (videoRef.current) {
            playerRef.current = new (window as any).Plyr(videoRef.current, {
              controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
            });
          }
        }, 100);
        return;
      }

      const existingScript = document.querySelector('script[src*="plyr.js"]');
      if (existingScript) {
        const handleLoad = () => {
          setTimeout(() => {
            if ((window as any).Plyr && videoRef.current) {
              playerRef.current = new (window as any).Plyr(videoRef.current, {
                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
              });
            }
          }, 100);
        };
        
        if ((window as any).Plyr) {
          handleLoad();
        } else {
          existingScript.addEventListener('load', handleLoad);
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.plyr.io/3.8.3/plyr.js';
      script.async = true;
      script.onload = () => {
        setTimeout(() => {
          if ((window as any).Plyr && videoRef.current) {
            playerRef.current = new (window as any).Plyr(videoRef.current, {
              controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
            });
          }
        }, 100);
      };
      document.body.appendChild(script);
    };

    const timer = setTimeout(initPlyr, 50);

    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [allMedia, selectedScreenshot]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/?tab=${tab}`);
  };

  const handleLibraryToggle = async () => {
    if (!user) {
      alert('Please sign in to manage your library');
      return;
    }

    if (!game) return;

    setIsLibraryProcessing(true);
    try {
      if (isInLibrary(game.$id)) {
        await removeFromLibrary(game.$id);
      } else {
        await addToLibrary(game.$id);
      }
    } catch (error) {
      console.error('Error toggling library:', error);
      alert('Failed to update library. Please try again.');
    } finally {
      setIsLibraryProcessing(false);
    }
  };

  const handlePlayNow = async () => {
    if (!game || !user) return;
    
    setIsLibraryProcessing(true);
    try {
      if (!isInLibrary(game.$id)) {
        await addToLibrary(game.$id);
      }
      router.push(`/play/${game.$id}`);
    } catch (error) {
      console.error('Error adding to library:', error);
      alert('Failed to add game to library. Please try again.');
    } finally {
      setIsLibraryProcessing(false);
    }
  };

  const hasWebBuilds = () => {
    if (!game || !Array.isArray(game.versions)) return false;
    return game.versions.some((v: any) => 
      v.builds && Array.isArray(v.builds) && v.builds.some((b: any) => b.platform === 'Web')
    );
  };

  const hasDesktopBuilds = () => {
    if (!game || !Array.isArray(game.versions)) return false;
    return game.versions.some((v: any) => 
      v.builds && Array.isArray(v.builds) && v.builds.some((b: any) => 
        b.platform === 'Windows' || b.platform === 'Mac' || b.platform === 'Linux'
      )
    );
  };

  const hasAnyBuilds = () => {
    return hasWebBuilds() || hasDesktopBuilds();
  };

  const handleDownload = async () => {
    if (!game) return;
    
    const versions = Array.isArray(game.versions) ? game.versions : [];
    
    if (versions.length === 0) {
      alert('No versions available for download yet. The developer hasn\'t published any builds.');
      return;
    }
    
    if (!versions[0].builds || versions[0].builds.length === 0) {
      alert('No builds available for download yet. The developer is still working on builds for this version.');
      return;
    }
    
    setShowDownloadModal(true);
  };

    const handlePlatformDownload = async (platform: string, versionIndex: number) => {
    if (!game || !game.versions || !Array.isArray(game.versions)) return;
    
    const versions = game.versions;
    const build = versions[versionIndex].builds.find((b: any) => b.platform === platform);
    
    if (!build) return;
    
    const downloadUrl = build.file.replace('/view', '/download');
    
    window.open(downloadUrl, '_blank');
    
    if (!isInLibrary(game.$id)) {
      await addToLibrary(game.$id);
    }
    
    setShowDownloadModal(false);
  };

  const toggleVersion = (index: number) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      alert('Please sign in to manage your wishlist');
      return;
    }

    if (!game) return;

    setIsWishlistProcessing(true);
    try {
      if (isInWishlist(game.$id)) {
        await removeFromWishlist(game.$id);
      } else {
        await addToWishlist(game.$id);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Failed to update wishlist. Please try again.');
    } finally {
      setIsWishlistProcessing(false);
    }
  };

  if (!game) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading game details...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {game.hero && (
        <div 
          className={styles.pageBackground}
          style={{ backgroundImage: `url(${game.hero})` }}
        />
      )}
      
      <Topbar
        onSearch={setSearchQuery}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hideSearch={true}
      />
      
      <button className={styles.backBtn} onClick={() => router.back()}>
        <Icon glyph="back" size={20} />
        Back
      </button>

      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>{game.title}</h1>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.main}>
          {allMedia.length > 0 && (
            <section className={styles.mediaSection}>
              <div className={styles.mainMedia}>
                {allMedia[selectedScreenshot].type === 'video' ? (
                  <div className={styles.videoWrapper} key={`video-${selectedScreenshot}`}>
                    <video
                      ref={videoRef}
                      className={styles.video}
                      playsInline
                      crossOrigin="anonymous"
                    >
                      <source src={allMedia[selectedScreenshot].url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <img 
                    src={allMedia[selectedScreenshot].url} 
                    alt={`Screenshot ${selectedScreenshot + 1}`}
                    className={styles.mainScreenshot}
                  />
                )}
              </div>
              
              {allMedia.length > 1 && (
                <div className={styles.thumbnails}>
                  {allMedia.map((media, index) => (
                    <div
                      key={index}
                      className={`${styles.thumbnail} ${selectedScreenshot === index ? styles.thumbnailActive : ''}`}
                      onClick={() => setSelectedScreenshot(index)}
                    >
                      {media.type === 'video' ? (
                        <div className={styles.thumbnailVideo}>
                          <Icon glyph="play-circle-fill" size={24} />
                          <video src={media.url} className={styles.thumbnailImage} />
                        </div>
                      ) : (
                        <img
                          src={media.url}
                          alt={`Thumbnail ${index + 1}`}
                          className={styles.thumbnailImage}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {game.longDescription && (
            <section className={styles.section}>
              <h2>About This Game</h2>
              <div className={styles.longDescription}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {game.longDescription}
                </ReactMarkdown>
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h2>Game Details</h2>
            <div className={styles.details}>
              {game.platforms && game.platforms.length > 0 && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Release Date</span>
                  <span className={styles.value}>{formatReleaseDate(game.releaseDate)}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Genre</span>
                <span className={styles.value}>{game.genre}</span>
              </div>
              {game.developer && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Developer</span>
                  <span className={styles.value}>{game.developer.name}</span>
                </div>
              )}
              {game.publisher && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Publisher</span>
                  <span className={styles.value}>{game.publisher.name}</span>
                </div>
              )}
              {game.platforms && game.platforms.length > 0 && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Platforms</span>
                  <span className={styles.value}>{game.platforms.join(', ')}</span>
                </div>
              )}
              {game.tags && game.tags.length > 0 && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Tags</span>
                  <span className={styles.value}>
                    {game.tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </section>

          {game.versions && Array.isArray(game.versions) && game.versions.length > 0 && (
            <section className={styles.section}>
              <h2>Available Versions</h2>
              <div className={styles.versionsContainer}>
                {game.versions.map((version: any, index: number) => (
                  <div key={index} className={styles.versionCard}>
                    <div className={styles.versionHeader}>
                      <div>
                        <h3 className={styles.versionNumber}>Version {version.version}</h3>
                        <p className={styles.versionTitle}>{version.title}</p>
                      </div>
                      <span className={styles.versionDate}>
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {version.description && (
                      <div className={styles.versionDescription}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {version.description}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className={styles.sidebar}>
          {game.header && (
            <img 
              src={game.header} 
              alt={game.title}
              className={styles.sidebarImage}
            />
          )}
          
          {game.shortDescription && (
            <div className={styles.shortDescription}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {game.shortDescription}
              </ReactMarkdown>
            </div>
          )}

          <div className={styles.priceBox}>
            <div className={styles.price}>
              {(!game.platforms || game.platforms.length === 0) 
                ? 'Launching Soon' 
                : (game.price === 0 ? 'Free to Play' : `$${game.price.toFixed(2)}`)}
            </div>
            {!user ? (
              <button 
                className={styles.buyBtn}
                onClick={() => router.push('/?auth=signin')}
              >
                <Icon glyph="person" size={18} />
                Sign in to continue
              </button>
            ) : (
              <>
                {hasWebBuilds() && (
                  <button 
                    className={styles.buyBtn}
                    onClick={handlePlayNow}
                    disabled={isLibraryProcessing}
                  >
                    <Icon glyph="play-circle-fill" size={18} />
                    {isLibraryProcessing ? 'Processing...' : 'Play Now'}
                  </button>
                )}

                {hasDesktopBuilds() && (
                  <button 
                    className={styles.buyBtn}
                    onClick={handleDownload}
                    disabled={isLibraryProcessing}
                  >
                    <Icon glyph="cloud-download" size={18} />
                    Download
                  </button>
                )}

                {hasAnyBuilds() && (
                  <button 
                    className={styles.wishlistBtn}
                    onClick={handleLibraryToggle}
                    disabled={isLibraryProcessing}
                  >
                    {isInLibrary(game.$id) ? (
                      <>
                        <Icon glyph="checkmark" size={18} />
                        {isLibraryProcessing ? 'Processing...' : 'In Library'}
                      </>
                    ) : (
                      <>
                        <Icon glyph="plus" size={18} />
                        {isLibraryProcessing ? 'Processing...' : 'Add to Library'}
                      </>
                    )}
                  </button>
                )}

                <button 
                  className={styles.wishlistBtn}
                  onClick={handleWishlistToggle}
                  disabled={isWishlistProcessing}
                >
                  {isInWishlist(game.$id) ? (
                    <>
                      <Icon glyph="checkmark" size={18} />
                      {isWishlistProcessing ? 'Processing...' : 'In Wishlist'}
                    </>
                  ) : (
                    <>
                      <Icon glyph="like" size={18} />
                      {isWishlistProcessing ? 'Processing...' : 'Add to Wishlist'}
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {game.rating && (
            <div className={styles.ratingBox}>
              <div className={styles.ratingLabel}>User Rating</div>
              <div className={styles.ratingValue}>
                <Icon glyph="star-fill" size={20} />
                {game.rating}/10
              </div>
            </div>
          )}
        </div>
      </div>

      {showDownloadModal && game && Array.isArray(game.versions) && game.versions.length > 0 && (
        <div className={styles.modalOverlay} onClick={() => setShowDownloadModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Download {game.title}</h2>
            <p>Select a version and platform</p>
            
            <div className={styles.versionsDownloadList}>
              {game.versions.map((version: any, index: number) => (
                <div key={index} className={styles.versionDownloadCard}>
                  <div 
                    className={styles.versionDownloadHeader}
                    onClick={() => toggleVersion(index)}
                  >
                    <div className={styles.versionDownloadInfo}>
                      <span className={styles.versionDownloadNumber}>v{version.version}</span>
                      <span className={styles.versionDownloadTitle}>{version.title}</span>
                    </div>
                    {expandedVersions.has(index) ? (
                      <Icon glyph="minus" size={20} />
                    ) : (
                      <Icon glyph="plus" size={20} />
                    )}
                  </div>                  {expandedVersions.has(index) && version.builds && version.builds.length > 0 && (
                    <div className={styles.platformButtons}>
                      {version.builds
                        .filter((build: any) => build.platform !== 'Web')
                        .map((build: any) => (
                          <button
                            key={build.platform}
                            className={styles.platformBtn}
                            onClick={() => handlePlatformDownload(build.platform, index)}
                          >
                            <Icon glyph="cloud-download" size={20} />
                            <span>{build.platform}</span>
                            <span className={styles.buildSize}>
                              {(build.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button 
              className={styles.closeModalBtn}
              onClick={() => setShowDownloadModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
