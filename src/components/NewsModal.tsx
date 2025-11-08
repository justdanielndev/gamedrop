'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { NewsArticle } from '@/hooks/useNews';
import { formatReleaseDate } from '@/lib/dateUtils';
import { getAppwriteClient } from '@/lib/appwrite';
import styles from './NewsModal.module.css';

interface NewsModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onGameClick?: (gameId: string) => void;
}

export default function NewsModal({ article, isOpen, onClose, onGameClick }: NewsModalProps) {
  const [gameName, setGameName] = useState<string>('');

  useEffect(() => {
    const fetchGameName = async () => {
      if (!article?.gameId) return;
      
      try {
        const { databases } = getAppwriteClient();
        if (!databases) return;
        
        const game = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'drop-db',
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || 'games',
          article.gameId
        );
        
        setGameName(game.title);
      } catch (err) {
        console.error('Failed to fetch game name:', err);
      }
    };

    if (isOpen && article?.gameId) {
      fetchGameName();
    }
  }, [article, isOpen]);

  if (!isOpen || !article) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        
        <div className={styles.header}>
          <h1 className={styles.headline}>{article.headline}</h1>
          <div className={styles.meta}>
            <span className={styles.author}>By {article.author}</span>
            {gameName && (
              <>
                <span className={styles.separator}>•</span>
                <span className={styles.gameInfo}>{gameName}</span>
              </>
            )}
            <span className={styles.separator}>•</span>
            <span className={styles.date}>{formatReleaseDate(article.publishDate)}</span>
          </div>
        </div>

        <div className={styles.content}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </div>

        {article.gameId && onGameClick && gameName && (
          <div className={styles.footer}>
            <button 
              className={styles.gameLink}
              onClick={() => onGameClick(article.gameId!)}
            >
              Know more about {gameName}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
