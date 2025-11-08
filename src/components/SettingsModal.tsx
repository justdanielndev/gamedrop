'use client';

import { useState } from 'react';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppwriteSettings) => void;
  currentSettings: AppwriteSettings;
}

export interface AppwriteSettings {
  endpoint: string;
  projectId: string;
  databaseId: string;
  collectionId: string;
}

export default function SettingsModal({ isOpen, onClose, onSave, currentSettings }: SettingsModalProps) {
  const [settings, setSettings] = useState<AppwriteSettings>(currentSettings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        
        <h2 className={styles.title}>Appwrite Settings</h2>
        <p className={styles.description}>
          Configure your Appwrite connection. Leave empty to use sample data.
        </p>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Endpoint</label>
            <input
              type="text"
              className={styles.input}
              placeholder="https://cloud.appwrite.io/v1"
              value={settings.endpoint}
              onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Project ID</label>
            <input
              type="text"
              className={styles.input}
              placeholder="your-project-id"
              value={settings.projectId}
              onChange={(e) => setSettings({ ...settings, projectId: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Database ID</label>
            <input
              type="text"
              className={styles.input}
              placeholder="your-database-id"
              value={settings.databaseId}
              onChange={(e) => setSettings({ ...settings, databaseId: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Collection ID (games)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="your-collection-id"
              value={settings.collectionId}
              onChange={(e) => setSettings({ ...settings, collectionId: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
