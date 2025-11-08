'use client';

import { Game } from './GameCard';
import styles from './GameDetailsModal.module.css';

interface GameDetailsModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function GameDetailsModal({ game, isOpen, onClose }: GameDetailsModalProps) {
  if (!isOpen || !game) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        
        <div className={styles.header}>
          <img src={game.image} alt={game.title} className={styles.headerImage} />
          <div className={styles.headerOverlay}>
            <h2 className={styles.title}>{game.title}</h2>
            <div className={styles.headerMeta}>
              <span className={styles.genre}>{game.genre}</span>
              {game.rating && (
                <span className={styles.rating}>⭐ {game.rating}/10</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Description</h3>
            <p>{game.description || 'No description available.'}</p>
          </div>

          <div className={styles.section}>
            <h3>Details</h3>
            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Release Date:</span>
                <span className={styles.value}>{game.releaseDate || 'TBA'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Genre:</span>
                <span className={styles.value}>{game.genre}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Price:</span>
                <span className={styles.value}>
                  {game.price === 0 ? 'Free' : `$${game.price.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.buyBtn}>
              {game.price === 0 ? 'Play Now' : `Buy for $${game.price.toFixed(2)}`}
            </button>
            <button className={styles.wishlistBtn}>Add to Wishlist</button>
          </div>
        </div>
      </div>
    </div>
  );
}
