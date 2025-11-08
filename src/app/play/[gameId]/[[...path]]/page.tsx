'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Icon from 'supercons';
import styles from './page.module.css';

export default function WebGamePlayer({ 
  params 
}: { 
  params: Promise<{ gameId: string; path?: string[] }> 
}) {
  const unwrappedParams = use(params);
  const { gameId } = unwrappedParams;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  
  useEffect(() => {
    const fetchViewportDimensions = async () => {
      try {
        const response = await fetch(`/api/web-game/${gameId}/metadata`);
        if (response.ok) {
          const data = await response.json();
          if (data.viewportWidth && data.viewportHeight) {
            setAspectRatio(data.viewportWidth / data.viewportHeight);
          }
        }
      } catch (err) {
        console.error('Error fetching viewport dimensions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchViewportDimensions();
  }, [gameId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
      {!isFullscreen && (
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <Icon glyph="back" size={20} />
            Back
          </button>
          <div className={styles.logoContainer}>
            <img src="/logo.png" alt="DROP" className={styles.logoImage} />
          </div>
          <button className={styles.fullscreenBtn} onClick={toggleFullscreen}>
            <Icon glyph="fullscreen" size={20} />
            Fullscreen
          </button>
        </div>
      )}
      
      <div className={styles.gameWrapper}>
        <div 
          className={styles.aspectRatioContainer}
          style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
        >
          <iframe
            srcDoc={`<!DOCTYPE html>
<html>
<head>
  <base href="/api/web-game/${gameId}/">
  <meta charset="utf-8">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <script>
    fetch('/api/web-game/${gameId}')
      .then(response => response.text())
      .then(html => {
        document.open();
        document.write(html);
        document.close();
      })
      .catch(error => {
        document.body.innerHTML = '<div style="color: white; background: black; padding: 20px; font-family: sans-serif;"><h1>Error Loading Game</h1><p>' + error.message + '</p></div>';
      });
  </script>
</body>
</html>`}
            className={styles.gameFrame}
            title="Web Game"
            allow="gamepad; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
          />
        </div>
      </div>

      {isFullscreen && (
        <button className={styles.exitFullscreenBtn} onClick={toggleFullscreen}>
          <Icon glyph="view-close" size={24} />
        </button>
      )}
    </div>
  );
}

