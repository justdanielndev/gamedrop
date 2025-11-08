'use client';

import styles from './GameCard.module.css';

export interface GameBuild {
  platform: string;
  file: string;
  fileSize: number;
  uploadedAt: string;
}

export interface GameVersion {
  version: string;
  title: string;
  description: string;
  createdAt: string;
  builds: GameBuild[];
}

export interface Developer {
  $id: string;
  name: string;
  website?: string;
  logo?: string;
}

export interface Publisher {
  $id: string;
  name: string;
  website?: string;
  logo?: string;
}

export interface Game {
  $id: string;
  title: string;
  image: string;
  price: number;
  genre: string;
  rating?: number;
  description?: string;
  releaseDate?: string;
  platforms?: string[];
  tags?: string[];
  capsule?: string;
  pageBackground?: string;
  logo?: string;
  header?: string;
  hero?: string;
  developer?: Developer;
  publisher?: Publisher;
  screenshots?: string[];
  video?: string;
  shortDescription?: string;
  longDescription?: string;
  featured?: boolean;
  versions?: string | GameVersion[];
}

interface GameCardProps {
  game: Game;
  onClick: (game: Game) => void;
}

export default function GameCard({ game, onClick }: GameCardProps) {
  const displayImage = game.capsule || game.image;
  
  return (
    <div className={styles.card} onClick={() => onClick(game)}>
      <img src={displayImage} alt={game.title} className={styles.image} />
      <div className={styles.overlay}>
        <div className={styles.overlayContent}>
          <h3 className={styles.overlayTitle}>{game.title}</h3>
          <button className={styles.viewMoreBtn}>View More</button>
        </div>
      </div>
    </div>
  );
}
