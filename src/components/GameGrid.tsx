'use client';

import GameCard, { Game } from './GameCard';
import styles from './GameGrid.module.css';

interface GameGridProps {
  games: Game[];
  onGameClick: (game: Game) => void;
}

export default function GameGrid({ games, onGameClick }: GameGridProps) {
  if (games.length === 0) {
    return (
      <div className={styles.empty}>
        <h3>No games found</h3>
        <p>Try adjusting your search or refresh the list</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {games.map((game) => (
        <GameCard key={game.$id} game={game} onClick={onGameClick} />
      ))}
    </div>
  );
}
