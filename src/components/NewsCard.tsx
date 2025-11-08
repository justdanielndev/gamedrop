'use client';

import { NewsArticle } from '@/hooks/useNews';
import { formatReleaseDate } from '@/lib/dateUtils';
import styles from './NewsCard.module.css';

interface NewsCardProps {
  article: NewsArticle;
  onArticleClick: (article: NewsArticle) => void;
  onGameClick?: (gameId: string) => void;
}

export default function NewsCard({ article, onArticleClick, onGameClick }: NewsCardProps) {
  const previewContent = article.content.length > 200 
    ? article.content.substring(0, 200) + '...' 
    : article.content;

  return (
    <div className={styles.card} onClick={() => onArticleClick(article)}>
      <div className={styles.header}>
        <h3 className={styles.headline}>{article.headline}</h3>
        <div className={styles.meta}>
          <span className={styles.author}>By {article.author}</span>
          <span className={styles.date}>{formatReleaseDate(article.publishDate)}</span>
        </div>
      </div>
      
      <p className={styles.preview}>{previewContent}</p>
      
      <div className={styles.footer}>
        <button className={styles.readMore}>Read More</button>
      </div>
    </div>
  );
}
