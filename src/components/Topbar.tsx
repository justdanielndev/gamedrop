'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from 'supercons';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnedGames } from '@/hooks/useOwnedGames';
import styles from './Topbar.module.css';

interface TopbarProps {
  onSearch: (query: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  hideSearch?: boolean;
  searchQuery?: string;
}

export default function Topbar({ onSearch, activeTab, onTabChange, hideSearch = false, searchQuery: externalSearchQuery }: TopbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, loading, login, logout, userAvatar } = useAuth();
  const { hasOwnedGames } = useOwnedGames(user?.$id);
  
  const navItems = user ? ['STORE', 'LIBRARY', 'NEWS'] : ['STORE', 'NEWS'];

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const handleLogoClick = () => {
    router.push('/?tab=STORE');
    onTabChange('STORE');
  };

  const handleTabClick = (tab: string) => {
    router.push(`/?tab=${tab}`);
    onTabChange(tab);
  };

  return (
    <header className={styles.topbar}>
      <button className={styles.logo} onClick={handleLogoClick}>
        <img src="/logo.png" alt="DROP" className={styles.logoImage} />
      </button>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item}
            className={`${styles.navItem} ${activeTab === item ? styles.active : ''}`}
            onClick={() => handleTabClick(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      {!hideSearch && (activeTab === 'LIBRARY' || activeTab === 'STORE' || activeTab === 'NEWS') && (
        <div className={styles.search}>
          <Icon glyph="search" size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={activeTab === 'LIBRARY' ? 'Search library' : activeTab === 'NEWS' ? 'Search news' : 'Search'}
            value={searchQuery}
            onChange={handleSearch}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button 
              className={styles.clearSearch}
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      )}
      
      <div className={styles.controls}>
        <div className={styles.userSection}>
          {!loading && (
            <>
              {user ? (
                <>
                  <button className={styles.iconBtn}><Icon glyph="bell" size={18} /></button>
                  <div className={styles.userMenu}>
                    <button 
                      className={styles.userBtn}
                      onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                      {userAvatar ? (
                        <img src={userAvatar} alt="User avatar" className={styles.avatar} />
                      ) : (
                        <Icon glyph="person" size={18} />
                      )}
                      <span className={styles.userName}>{user.name || user.email}</span>
                    </button>
                    {showUserMenu && (
                      <div className={styles.dropdown}>
                        {hasOwnedGames && (
                          <button 
                            onClick={() => {
                              router.push('/your-games');
                              setShowUserMenu(false);
                            }} 
                            className={styles.dropdownItem}
                          >
                            Your Games
                          </button>
                        )}
                        <button onClick={handleLogout} className={styles.dropdownItem}>
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button className={styles.loginBtn} onClick={login}>
                  <Icon glyph="person" size={18} />
                  Sign in
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
