'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from 'supercons';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { getAppwriteClient, initAppwrite, executeFunction } from '@/lib/appwrite';
import { Permission, Role } from 'appwrite';
import styles from './page.module.css';

const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'drop-db',
  collectionId: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || 'games',
  uploadFunctionId: process.env.NEXT_PUBLIC_UPLOAD_GAME_MEDIA_FUNCTION_ID || '',
};

if (typeof window !== 'undefined' && appwriteConfig.endpoint && appwriteConfig.projectId) {
  initAppwrite(appwriteConfig);
}

interface Game {
  $id: string;
  title: string;
  owner?: string;
  header?: string | null;
  capsule?: string | null;
  hero?: string | null;
  price?: number;
  platforms?: string[];
  releaseDate?: string;
  genre?: string;
  description?: string | null;
  longDescription?: string | null;
  screenshots?: string[];
  video?: string | null;
  versions?: GameVersion[] | string;
}

interface BuildPlatform {
  platform: 'Windows' | 'Mac' | 'Linux' | 'Web';
  file: string;
  fileSize: number;
  uploadedAt: string;
  webBuildId?: string;
}

interface GameVersion {
  version: string;
  title: string;
  description: string;
  createdAt: string;
  builds: BuildPlatform[];
}

export default function ManageGamePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { user, loading: authLoading } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    releaseDate: '',
    price: '',
    platforms: [] as string[],
    description: '',
    longDescription: '',
    header: '',
    capsule: '',
    hero: '',
    screenshots: [] as string[],
    video: ''
  });
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [showAddBuild, setShowAddBuild] = useState<string | null>(null);
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [editVersionData, setEditVersionData] = useState({ title: '', description: '' });
  const [newVersion, setNewVersion] = useState({
    version: '',
    title: '',
    description: ''
  });
  const [newBuild, setNewBuild] = useState({
    platform: 'Windows' as 'Windows' | 'Mac' | 'Linux' | 'Web',
    file: null as File | null,
    viewportWidth: 1920,
    viewportHeight: 1080
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/?tab=${tab}`);
  };

  useEffect(() => {
    const fetchGame = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { databases } = getAppwriteClient();
        if (!databases) {
          setLoading(false);
          return;
        }

        const gameDoc = await databases.getDocument(
          'drop-db',
          'games',
          unwrappedParams.id
        );

        const fetchedGame = gameDoc as unknown as Game;

        if (fetchedGame.owner !== user.$id) {
        router.push('/your-games');
        return;
      }

      if (fetchedGame.versions && typeof fetchedGame.versions === 'string') {
        try {
          fetchedGame.versions = JSON.parse(fetchedGame.versions as string);
        } catch (e) {
          fetchedGame.versions = [];
        }
      }
      
      setGame(fetchedGame);
      
      let formattedReleaseDate = '';
      if (fetchedGame.releaseDate) {
        const date = new Date(fetchedGame.releaseDate);
        if (!isNaN(date.getTime())) {
          formattedReleaseDate = date.toISOString().split('T')[0];
        }
      }
      
      setFormData({
        title: fetchedGame.title || '',
        genre: fetchedGame.genre || '',
        releaseDate: formattedReleaseDate,
        price: fetchedGame.price?.toString() || '0',
        platforms: fetchedGame.platforms || [],
        description: fetchedGame.description || '',
        longDescription: fetchedGame.longDescription || '',
        header: fetchedGame.header || '',
        capsule: fetchedGame.capsule || '',
        hero: fetchedGame.hero || '',
        screenshots: fetchedGame.screenshots || [],
        video: fetchedGame.video || ''
      });
    } catch (error) {
        console.error('Error fetching game:', error);
        router.push('/your-games');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (!user) {
        router.push('/?auth=signin');
      } else {
        fetchGame();
      }
    }
  }, [authLoading, user, unwrappedParams.id, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDetails = async () => {
    if (!game) return;
    
    setSaving(true);
    try {
      const { databases } = getAppwriteClient();
      if (!databases) {
        throw new Error('Database not available');
      }

      await databases.updateDocument(
        'drop-db',
        'games',
        game.$id,
        {
          title: formData.title,
          genre: formData.genre,
          releaseDate: formData.releaseDate,
          price: parseFloat(formData.price) || 0,
          platforms: formData.platforms,
          description: formData.description || null,
          longDescription: formData.longDescription || null,
          header: formData.header || null,
          capsule: formData.capsule || null,
          hero: formData.hero || null,
          screenshots: formData.screenshots,
          video: formData.video || null
        }
      );

      setGame({ ...game, 
        title: formData.title,
        genre: formData.genre,
        releaseDate: formData.releaseDate,
        price: parseFloat(formData.price) || 0,
        platforms: formData.platforms,
        description: formData.description || null,
        longDescription: formData.longDescription || null,
        header: formData.header || null,
        capsule: formData.capsule || null,
        hero: formData.hero || null,
        screenshots: formData.screenshots,
        video: formData.video || null
      });

      alert('Game details saved successfully!');
    } catch (error) {
      console.error('Error saving game details:', error);
      alert('Failed to save game details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => {
      const platforms = prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform];
      return { ...prev, platforms };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'header' | 'capsule' | 'hero') => {
    const file = e.target.files?.[0];
    if (!file || !game || !user) return;

    setUploadingMedia(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(',')[1];
        
        const execution = await executeFunction(
          appwriteConfig.uploadFunctionId,
          {
            gameId: game.$id,
            userId: user.$id,
            action: 'upload',
            fileData: base64Data,
            fileName: file.name,
            fileType: file.type,
            mediaType: imageType
          }
        );

        const result = JSON.parse(execution.responseBody);
        
        if (result.success) {
          setFormData(prev => ({ ...prev, [imageType]: result.fileUrl }));
          alert('Image uploaded successfully!');
        } else {
          throw new Error(result.error);
        }
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleAddScreenshot = async (url?: string, file?: File) => {
    if (!game || !user) return;

    setUploadingMedia(true);
    try {
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async () => {
          const base64Data = reader.result?.toString().split(',')[1];
          
          const execution = await executeFunction(
            appwriteConfig.uploadFunctionId,
            {
              gameId: game.$id,
              userId: user.$id,
              action: 'upload',
              fileData: base64Data,
              fileName: file.name,
              fileType: file.type,
              mediaType: 'screenshot'
            }
          );

          const result = JSON.parse(execution.responseBody);
          
          if (result.success) {
            setFormData(prev => ({ ...prev, screenshots: [...prev.screenshots, result.fileUrl] }));
            setNewScreenshotUrl('');
          } else {
            throw new Error(result.error);
          }
        };
      } else if (url) {
        const execution = await executeFunction(
          appwriteConfig.uploadFunctionId,
          {
            gameId: game.$id,
            userId: user.$id,
            action: 'addUrl',
            url,
            mediaType: 'screenshot'
          }
        );

        const result = JSON.parse(execution.responseBody);
        
        if (result.success) {
          setFormData(prev => ({ ...prev, screenshots: [...prev.screenshots, url] }));
          setNewScreenshotUrl('');
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error('Error adding screenshot:', error);
      alert('Failed to add screenshot. Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveScreenshot = async (index: number) => {
    if (!game || !user) return;

    try {
      const execution = await executeFunction(
        appwriteConfig.uploadFunctionId,
        {
          gameId: game.$id,
          userId: user.$id,
          action: 'remove',
          mediaType: 'screenshot',
          mediaId: index
        }
      );

      const result = JSON.parse(execution.responseBody);
      
      if (result.success) {
        setFormData(prev => ({ 
          ...prev, 
          screenshots: prev.screenshots.filter((_, i) => i !== index) 
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error removing screenshot:', error);
      alert('Failed to remove screenshot. Please try again.');
    }
  };

  const handleEditVersion = async (versionNumber: string) => {
    if (!game) return;

    try {
      const versions = Array.isArray(game.versions) ? game.versions : [];
      const updatedVersions = versions.map((v: GameVersion) => {
        if (v.version === versionNumber) {
          return {
            ...v,
            title: editVersionData.title,
            description: editVersionData.description
          };
        }
        return v;
      });

      const { databases } = getAppwriteClient();
      if (!databases) throw new Error('Database not available');

      await databases.updateDocument(
        'drop-db',
        'games',
        game.$id,
        { versions: JSON.stringify(updatedVersions) }
      );

      setGame({ ...game, versions: updatedVersions });
      setEditingVersion(null);
    } catch (error) {
      console.error('Error updating version:', error);
      alert('Failed to update version. Please try again.');
    }
  };

  const handleCreateVersion = async () => {
    if (!game || !user || !newVersion.version || !newVersion.title) {
      alert('Please fill in version number and title');
      return;
    }

    try {
      const { databases } = getAppwriteClient();
      if (!databases) return;

      const currentVersions: GameVersion[] = Array.isArray(game.versions) ? game.versions : [];
      
      if (currentVersions.some((v: GameVersion) => v.version === newVersion.version)) {
        alert('Version already exists');
        return;
      }

      const versionToAdd: GameVersion = {
        version: newVersion.version,
        title: newVersion.title,
        description: newVersion.description,
        createdAt: new Date().toISOString(),
        builds: []
      };

      const updatedVersions = [...currentVersions, versionToAdd];

      await databases.updateDocument(
        'drop-db',
        'games',
        game.$id,
        { versions: JSON.stringify(updatedVersions) }
      );

      setGame({ ...game, versions: updatedVersions });
      setNewVersion({ version: '', title: '', description: '' });
      setShowCreateVersion(false);
    } catch (error) {
      console.error('Error creating version:', error);
      alert('Failed to create version. Please try again.');
    }
  };

  const handleAddBuild = async (versionString: string) => {
    if (!game || !user || !newBuild.file) {
      alert('Please select a build file');
      return;
    }

    setUploading(true);
    try {
      const fileToUpload = newBuild.file;
      if (!fileToUpload) throw new Error('No file selected');

      const { storage, databases, functions } = getAppwriteClient();
      if (!storage || !databases) throw new Error('Storage/Database not available');

      let buildData: any;

      if (newBuild.platform === 'Web') {
        if (!functions) throw new Error('Functions not available');
        
        const platformShort = 'Web';
        const zipFileId = `${platformShort}-${Date.now()}`;

        const uploadedZip = await storage.createFile(
          'game-builds',
          zipFileId,
          fileToUpload,
          [
            Permission.read(Role.any()),
            Permission.delete(Role.user(user.$id))
          ]
        );

        const execution = await functions.createExecution(
          process.env.NEXT_PUBLIC_WEB_DEPLOY_FUNCTION_ID!,
          JSON.stringify({
            gameId: game.$id,
            version: versionString,
            zipFileId: uploadedZip.$id,
            userId: user.$id,
            viewportWidth: newBuild.viewportWidth,
            viewportHeight: newBuild.viewportHeight
          })
        );

        let status = execution.status;
        let executionId = execution.$id;
        
        while (status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const updatedExecution = await functions.getExecution(
            process.env.NEXT_PUBLIC_WEB_DEPLOY_FUNCTION_ID!,
            executionId
          );
          status = updatedExecution.status;
        }

        if (status !== 'completed') {
          throw new Error('Function execution failed');
        }

        const result = JSON.parse(execution.responseBody);
        
        await storage.deleteFile('game-builds', zipFileId);

        buildData = {
          platform: newBuild.platform,
          file: `/play/${game.$id}`,
          fileSize: fileToUpload.size,
          uploadedAt: new Date().toISOString(),
          webBuildId: result.webBuildId
        };
      } else {
        const platformShort = newBuild.platform.substring(0, 3);
        const fileId = `${platformShort}-${Date.now()}`;

        const uploadedFile = await storage.createFile(
          'game-builds',
          fileId,
          fileToUpload,
          [
            Permission.read(Role.any()),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id))
          ]
        );

        const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/game-builds/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;

        buildData = {
          platform: newBuild.platform,
          file: fileUrl,
          fileSize: fileToUpload.size,
          uploadedAt: new Date().toISOString()
        };
      }

      const currentVersions: GameVersion[] = Array.isArray(game.versions) ? game.versions : [];
      const updatedVersions = currentVersions.map((v: GameVersion) => {
        if (v.version === versionString) {
          return {
            ...v,
            builds: [...v.builds, buildData]
          };
        }
        return v;
      });

      await databases.updateDocument(
        'drop-db',
        'games',
        game.$id,
        { versions: JSON.stringify(updatedVersions) }
      );

      setGame({ ...game, versions: updatedVersions });
      setNewBuild({ platform: 'Windows', file: null, viewportWidth: 1920, viewportHeight: 1080 });
      setShowAddBuild(null);
    } catch (error) {
      console.error('Error uploading build:', error);
      alert('Failed to upload build. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBuild = async (versionString: string, buildIndex: number) => {
    if (!game || !user) return;
    
    if (!confirm('Are you sure you want to delete this build?')) return;

    try {
      const { databases, storage } = getAppwriteClient();
      if (!databases || !storage) throw new Error('Database/Storage not available');

      const currentVersions: GameVersion[] = Array.isArray(game.versions) ? game.versions : [];
      
      const versionToUpdate = currentVersions.find(v => v.version === versionString);
      if (versionToUpdate && versionToUpdate.builds[buildIndex]) {
        const build = versionToUpdate.builds[buildIndex];
        
        if (build.platform === 'Web' && build.webBuildId) {
          try {
            await databases.deleteDocument('drop-db', 'web-builds', build.webBuildId);
          } catch (webBuildError) {
            console.error('Error deleting web build:', webBuildError);
          }
        } else {
          const buildFileUrl = build.file;
          const fileIdMatch = buildFileUrl.match(/\/files\/([^\/]+)\//);
          if (fileIdMatch) {
            const fileId = fileIdMatch[1];
            try {
              await storage.deleteFile('game-builds', fileId);
            } catch (storageError) {
              console.error('Error deleting file from storage:', storageError);
            }
          }
        }
      }

      const updatedVersions = currentVersions.map((v: GameVersion) => {
        if (v.version === versionString) {
          return {
            ...v,
            builds: v.builds.filter((_: BuildPlatform, i: number) => i !== buildIndex)
          };
        }
        return v;
      });

      await databases.updateDocument(
        'drop-db',
        'games',
        game.$id,
        { versions: JSON.stringify(updatedVersions) }
      );

      setGame({ ...game, versions: updatedVersions });
    } catch (error) {
      console.error('Error deleting build:', error);
      alert('Failed to delete build. Please try again.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.page}>
        <Topbar
          onSearch={setSearchQuery}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          hideSearch={true}
          searchQuery={searchQuery}
        />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return null;
  }

  return (
    <div className={styles.page}>
      <Topbar
        onSearch={setSearchQuery}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hideSearch={true}
        searchQuery={searchQuery}
      />

      <button className={styles.backBtn} onClick={() => router.push('/your-games')}>
        <Icon glyph="back" size={20} />
        Back to Your Games
      </button>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>{game.title}</h1>
            <p className={styles.subtitle}>Game ID: {game.$id}</p>
          </div>
          <button 
            className={styles.viewPageBtn}
            onClick={() => router.push(`/game/${game.$id}`)}
          >
            <Icon glyph="view" size={18} />
            View Public Page
          </button>
        </div>

        <div className={styles.sections}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Icon glyph="settings" size={20} />
              Game Details
            </h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Title</span>
                <input 
                  type="text" 
                  className={styles.detailInput}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Game title"
                />
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Genre</span>
                <input 
                  type="text" 
                  className={styles.detailInput}
                  value={formData.genre}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                  placeholder="e.g., Action, RPG, Strategy"
                />
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Release Date</span>
                <input 
                  type="date" 
                  className={styles.detailInput}
                  value={formData.releaseDate}
                  onChange={(e) => handleInputChange('releaseDate', e.target.value)}
                />
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Price ($)</span>
                <input 
                  type="number" 
                  className={styles.detailInput}
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Platforms</span>
                <div className={styles.platformCheckboxes}>
                  {['Web', 'Windows', 'Mac', 'Linux'].map(platform => (
                    <label key={platform} className={styles.platformLabel}>
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(platform)}
                        onChange={() => handlePlatformToggle(platform)}
                        className={styles.platformCheckbox}
                      />
                      <span>{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Description</span>
                <textarea 
                  className={styles.detailTextarea}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Short game description"
                  rows={3}
                />
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Long Description</span>
                <textarea 
                  className={styles.detailTextarea}
                  value={formData.longDescription}
                  onChange={(e) => handleInputChange('longDescription', e.target.value)}
                  placeholder="Detailed game description (supports Markdown)"
                  rows={12}
                />
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Header Image</span>
                <div className={styles.imageInputGroup}>
                  <input 
                    type="text" 
                    className={styles.detailInput}
                    value={formData.header}
                    onChange={(e) => handleInputChange('header', e.target.value)}
                    placeholder="Image URL or upload below"
                  />
                  <input 
                    type="file" 
                    accept="image/*"
                    className={styles.fileInput}
                    id="headerUpload"
                    onChange={(e) => handleImageUpload(e, 'header')}
                    disabled={uploadingMedia}
                  />
                  <label htmlFor="headerUpload" className={styles.uploadBtnSmall}>
                    <Icon glyph={uploadingMedia ? "clock" : "photo"} size={16} />
                    {uploadingMedia ? 'Uploading...' : 'Upload'}
                  </label>
                </div>
                {formData.header && (
                  <img src={formData.header} alt="Header preview" className={styles.imagePreview} />
                )}
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Capsule Image</span>
                <div className={styles.imageInputGroup}>
                  <input 
                    type="text" 
                    className={styles.detailInput}
                    value={formData.capsule}
                    onChange={(e) => handleInputChange('capsule', e.target.value)}
                    placeholder="Image URL or upload below"
                  />
                  <input 
                    type="file" 
                    accept="image/*"
                    className={styles.fileInput}
                    id="capsuleUpload"
                    onChange={(e) => handleImageUpload(e, 'capsule')}
                    disabled={uploadingMedia}
                  />
                  <label htmlFor="capsuleUpload" className={styles.uploadBtnSmall}>
                    <Icon glyph={uploadingMedia ? "clock" : "photo"} size={16} />
                    {uploadingMedia ? 'Uploading...' : 'Upload'}
                  </label>
                </div>
                {formData.capsule && (
                  <img src={formData.capsule} alt="Capsule preview" className={styles.imagePreview} />
                )}
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Hero Image</span>
                <div className={styles.imageInputGroup}>
                  <input 
                    type="text" 
                    className={styles.detailInput}
                    value={formData.hero}
                    onChange={(e) => handleInputChange('hero', e.target.value)}
                    placeholder="Image URL or upload below"
                  />
                  <input 
                    type="file" 
                    accept="image/*"
                    className={styles.fileInput}
                    id="heroUpload"
                    onChange={(e) => handleImageUpload(e, 'hero')}
                    disabled={uploadingMedia}
                  />
                  <label htmlFor="heroUpload" className={styles.uploadBtnSmall}>
                    <Icon glyph={uploadingMedia ? "clock" : "photo"} size={16} />
                    {uploadingMedia ? 'Uploading...' : 'Upload'}
                  </label>
                </div>
                {formData.hero && (
                  <img src={formData.hero} alt="Hero preview" className={styles.imagePreview} />
                )}
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Screenshots</span>
                <div className={styles.screenshotsGrid}>
                  {formData.screenshots.map((screenshot, index) => (
                    <div key={index} className={styles.screenshotItem}>
                      <img src={screenshot} alt={`Screenshot ${index + 1}`} />
                      <button 
                        onClick={() => handleRemoveScreenshot(index)}
                        className={styles.removeBtn}
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.imageInputGroup}>
                  <input 
                    type="text" 
                    className={styles.detailInput}
                    value={newScreenshotUrl}
                    onChange={(e) => setNewScreenshotUrl(e.target.value)}
                    placeholder="Screenshot URL"
                  />
                  <button 
                    onClick={() => handleAddScreenshot(newScreenshotUrl)}
                    className={styles.uploadBtnSmall}
                    disabled={!newScreenshotUrl || uploadingMedia}
                    type="button"
                  >
                    <Icon glyph="plus" size={16} />
                    Add URL
                  </button>
                  <input 
                    type="file" 
                    accept="image/*"
                    className={styles.fileInput}
                    id="screenshotUpload"
                    onChange={(e) => e.target.files?.[0] && handleAddScreenshot(undefined, e.target.files[0])}
                    disabled={uploadingMedia}
                  />
                  <label htmlFor="screenshotUpload" className={styles.uploadBtnSmall}>
                    <Icon glyph={uploadingMedia ? "clock" : "photo"} size={16} />
                    {uploadingMedia ? 'Uploading...' : 'Upload'}
                  </label>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Video URL</span>
                <input 
                  type="text" 
                  className={styles.detailInput}
                  value={formData.video}
                  onChange={(e) => handleInputChange('video', e.target.value)}
                  placeholder="Direct video file URL (.mp4, .webm, etc.)"
                />
              </div>
            </div>
            <button 
              className={styles.actionBtnPrimary}
              onClick={handleSaveDetails}
              disabled={saving}
            >
              <Icon glyph="checkmark" size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Icon glyph="code" size={20} />
                Build Management
              </h2>
              <button 
                className={styles.actionBtnSecondary}
                onClick={() => setShowCreateVersion(true)}
              >
                <Icon glyph="plus" size={16} />
                Create Version
              </button>
            </div>

            {showCreateVersion && (
              <div className={styles.modal}>
                <div className={styles.modalContent}>
                  <h3>Create New Version</h3>
                  <div className={styles.formGroup}>
                    <label>Version Number</label>
                    <input 
                      type="text"
                      className={styles.detailInput}
                      value={newVersion.version}
                      onChange={(e) => setNewVersion({...newVersion, version: e.target.value})}
                      placeholder="e.g., 1.0.0"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Version Title</label>
                    <input 
                      type="text"
                      className={styles.detailInput}
                      value={newVersion.title}
                      onChange={(e) => setNewVersion({...newVersion, title: e.target.value})}
                      placeholder="e.g., Initial Release"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea 
                      className={styles.detailTextarea}
                      value={newVersion.description}
                      onChange={(e) => setNewVersion({...newVersion, description: e.target.value})}
                      placeholder="What's new in this version..."
                      rows={4}
                    />
                  </div>
                  <div className={styles.modalActions}>
                    <button 
                      className={styles.actionBtnSecondary}
                      onClick={() => setShowCreateVersion(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className={styles.actionBtnPrimary}
                      onClick={handleCreateVersion}
                    >
                      <Icon glyph="checkmark" size={16} />
                      Create Version
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.versionsList}>
              {(!game?.versions || !Array.isArray(game.versions) || game.versions.length === 0) ? (
                <div className={styles.placeholder}>
                  <p>No versions created yet. Create your first version to start uploading builds.</p>
                </div>
              ) : (
                (game.versions as GameVersion[]).map((version: GameVersion) => (
                  <div key={version.version} className={styles.versionCard}>
                    <div className={styles.versionHeader}>
                      <div>
                        <h3>{version.title}</h3>
                        <span className={styles.versionNumber}>v{version.version}</span>
                      </div>
                      <div className={styles.versionActions}>
                        <button 
                          className={styles.actionBtnSmall}
                          onClick={() => {
                            setEditingVersion(version.version);
                            setEditVersionData({ title: version.title, description: version.description });
                          }}
                        >
                          <Icon glyph="edit" size={14} />
                          Edit Info
                        </button>
                        <button 
                          className={styles.actionBtnSmall}
                          onClick={() => setShowAddBuild(version.version)}
                        >
                          <Icon glyph="plus" size={14} />
                          Add Build
                        </button>
                      </div>
                    </div>
                    {version.description && (
                      <p className={styles.versionDescription}>{version.description}</p>
                    )}
                    
                    <div className={styles.buildsList}>
                      {version.builds.length === 0 ? (
                        <p className={styles.noBuilds}>No builds for this version yet</p>
                      ) : (
                        version.builds.map((build: BuildPlatform, buildIndex: number) => (
                          <div key={buildIndex} className={styles.buildItem}>
                            <div className={styles.buildInfo}>
                              <Icon glyph="cloud-download" size={20} />
                              <div>
                                <span className={styles.buildPlatform}>{build.platform}</span>
                                <span className={styles.buildSize}>
                                  {(build.fileSize / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                            <button 
                              className={styles.deleteBuildBtn}
                              onClick={() => handleDeleteBuild(version.version, buildIndex)}
                            >
                              <Icon glyph="delete" size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {showAddBuild === version.version && (
                      <div className={styles.modal}>
                        <div className={styles.modalContent}>
                          <h3>Add Build to v{version.version}</h3>
                          <div className={styles.formGroup}>
                            <label>Platform</label>
                            <select 
                              className={styles.detailInput}
                              value={newBuild.platform}
                              onChange={(e) => setNewBuild({...newBuild, platform: e.target.value as 'Windows' | 'Mac' | 'Linux' | 'Web'})}
                            >
                              <option value="Windows">Windows</option>
                              <option value="Mac">Mac</option>
                              <option value="Linux">Linux</option>
                              <option value="Web">Web (HTML5)</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label>
                              {newBuild.platform === 'Web' 
                                ? 'Web Game ZIP (must include index.html)' 
                                : 'Build File (.zip)'}
                            </label>
                            <input 
                              type="file"
                              accept=".zip"
                              onChange={(e) => setNewBuild({...newBuild, file: e.target.files?.[0] || null})}
                              className={styles.fileInputVisible}
                            />
                            {newBuild.platform === 'Web' && (
                              <>
                                <p className={styles.helpText}>
                                  Upload a ZIP containing your HTML5 game. All files will be extracted and made accessible.
                                </p>
                                <div className={styles.viewportInputs}>
                                  <div className={styles.viewportInput}>
                                    <label>Viewport Width (px)</label>
                                    <input 
                                      type="number"
                                      className={styles.detailInput}
                                      value={newBuild.viewportWidth}
                                      onChange={(e) => setNewBuild({...newBuild, viewportWidth: parseInt(e.target.value) || 1920})}
                                      min="320"
                                      max="7680"
                                      placeholder="1920"
                                    />
                                  </div>
                                  <div className={styles.viewportInput}>
                                    <label>Viewport Height (px)</label>
                                    <input 
                                      type="number"
                                      className={styles.detailInput}
                                      value={newBuild.viewportHeight}
                                      onChange={(e) => setNewBuild({...newBuild, viewportHeight: parseInt(e.target.value) || 1080})}
                                      min="240"
                                      max="4320"
                                      placeholder="1080"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          <div className={styles.modalActions}>
                            <button 
                              className={styles.actionBtnSecondary}
                              onClick={() => {
                                setShowAddBuild(null);
                                setNewBuild({platform: 'Windows', file: null, viewportWidth: 1920, viewportHeight: 1080});
                              }}
                            >
                              Cancel
                            </button>
                            <button 
                              className={styles.actionBtnPrimary}
                              onClick={() => handleAddBuild(version.version)}
                              disabled={!newBuild.file || uploading}
                            >
                              <Icon glyph="cloud-upload" size={16} />
                              {uploading ? 'Uploading...' : 'Upload Build'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {editingVersion === version.version && (
                      <div className={styles.modal}>
                        <div className={styles.modalContent}>
                          <h3>Edit Version Info</h3>
                          <div className={styles.formGroup}>
                            <label>Version Title</label>
                            <input 
                              type="text"
                              className={styles.detailInput}
                              value={editVersionData.title}
                              onChange={(e) => setEditVersionData({...editVersionData, title: e.target.value})}
                              placeholder="e.g., Initial Release"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea 
                              className={styles.detailTextarea}
                              value={editVersionData.description}
                              onChange={(e) => setEditVersionData({...editVersionData, description: e.target.value})}
                              placeholder="What's new in this version..."
                              rows={4}
                            />
                          </div>
                          <div className={styles.modalActions}>
                            <button 
                              className={styles.actionBtnSecondary}
                              onClick={() => setEditingVersion(null)}
                            >
                              Cancel
                            </button>
                            <button 
                              className={styles.actionBtnPrimary}
                              onClick={() => handleEditVersion(version.version)}
                            >
                              <Icon glyph="checkmark" size={16} />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
