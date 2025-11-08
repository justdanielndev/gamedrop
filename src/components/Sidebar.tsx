'use client';

import { useState } from 'react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems = ['Home', 'Library', 'Store', 'Community', 'Settings'];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>🎮</div>
        <span>GameHub</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item}
            className={`${styles.navItem} ${activeTab === item ? styles.active : ''}`}
            onClick={() => onTabChange(item)}
          >
            <span className={styles.navIcon}>{getIcon(item)}</span>
            <span>{item}</span>
          </button>
        ))}
      </nav>

      <div className={styles.account}>
        <div className={styles.avatar}>K</div>
        <div className={styles.accInfo}>
          <div className={styles.name}>PlayerOne</div>
          <div className={styles.status}>Online</div>
        </div>
      </div>
    </aside>
  );
}

function getIcon(item: string): string {
  const icons: Record<string, string> = {
    Home: '🏠',
    Library: '📚',
    Store: '🛒',
    Community: '👥',
    Settings: '⚙️',
  };
  return icons[item] || '•';
}
