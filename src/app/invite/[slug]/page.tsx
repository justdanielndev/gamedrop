'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAppwriteClient, executeFunction, initAppwrite } from '@/lib/appwrite';
import { Query } from 'appwrite';
import styles from './page.module.css';

const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'drop-db',
  collectionId: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || 'games',
};

if (typeof window !== 'undefined' && appwriteConfig.endpoint && appwriteConfig.projectId) {
  initAppwrite(appwriteConfig);
}

interface InviteData {
  $id: string;
  userId: string;
  gameId: number;
  inviteSlug: string;
  redeemed: boolean;
  gameName?: string;
}

export default function InviteRedeemPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'confirm' | 'processing' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && !hasChecked) {
      setHasChecked(true);
      router.push('/?auth=signin');
    }
  }, [authLoading, user, router, hasChecked]);

  useEffect(() => {
    if (!authLoading && user && status === 'loading') {
      loadInvite();
    }
  }, [authLoading, user, status]);

  const loadInvite = async () => {
    if (!user) return;

    try {
      const { databases } = getAppwriteClient();
      if (!databases) {
        throw new Error('Appwrite not configured');
      }

      const inviteResponse = await databases.listDocuments(
        'drop-db',
        'invites',
        [Query.equal('inviteSlug', unwrappedParams.slug)]
      );

      if (inviteResponse.documents.length === 0) {
        setStatus('error');
        setMessage('Invalid invite link');
        return;
      }

      const inviteDoc = inviteResponse.documents[0] as any;

      if (inviteDoc.redeemed) {
        setStatus('error');
        setMessage('This invite has already been redeemed');
        return;
      }

      if (inviteDoc.userId !== user.$id) {
        setStatus('error');
        setMessage('This invite is not for you');
        return;
      }

      const game = await databases.getDocument(
        'drop-db',
        'games',
        inviteDoc.gameId.toString()
      );

      setInvite({
        $id: inviteDoc.$id,
        userId: inviteDoc.userId,
        gameId: inviteDoc.gameId,
        inviteSlug: inviteDoc.inviteSlug,
        redeemed: inviteDoc.redeemed,
        gameName: game.title
      });

      setStatus('confirm');

    } catch (err) {
      console.error('Error loading invite:', err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to load invite');
    }
  };

  const handleAccept = async () => {
    if (!user || !invite) return;

    setStatus('processing');

    try {
      const functionId = process.env.NEXT_PUBLIC_ADD_OWNER_FUNCTION_ID || '';
      const result = await executeFunction(functionId, {
        inviteId: invite.$id,
        userId: user.$id
      });

      const response = JSON.parse(result.responseBody);

      if (response.success) {
        setStatus('success');
        setMessage('Successfully redeemed invite! You are now the owner of this game.');
        
        setTimeout(() => {
          router.push('/?tab=STORE');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.error || 'Failed to redeem invite');
      }

    } catch (err) {
      console.error('Error redeeming invite:', err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to redeem invite');
    }
  };

  const handleDecline = () => {
    router.push('/?tab=STORE');
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <img src="/logo.png" alt="GameDrop" />
        </div>
        <div className={styles.card}>
          {status === 'loading' && (
            <>
              <div className={styles.spinner}></div>
              <h1>Loading invite...</h1>
              <p>Please wait while we fetch your invite details</p>
            </>
          )}

          {status === 'confirm' && invite && (
            <>
              <div className={styles.inviteDetails}>
                <p className={styles.inviteText}>You've been invited to become the owner of:</p>
                <h2 className={styles.gameName}>{invite.gameName}</h2>
                <p className={styles.description}>
                  As the owner, you'll be able to manage this game, upload updates, and control its presence on the platform.
                </p>
              </div>
              <div className={styles.buttonGroup}>
                <button className={styles.acceptButton} onClick={handleAccept}>
                  <span className={styles.buttonIcon}>✓</span>
                  Accept Invite
                </button>
                <button className={styles.declineButton} onClick={handleDecline}>
                  <span className={styles.buttonIcon}>✕</span>
                  Decline
                </button>
              </div>
            </>
          )}

          {status === 'processing' && (
            <>
              <div className={styles.spinner}></div>
              <h1>Processing...</h1>
              <p>Setting up your game ownership</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1>Done!</h1>
              {invite?.gameName && <h2 className={styles.successGameName}>{invite.gameName}</h2>}
              <p className={styles.successMessage}>{message}</p>
              <p className={styles.redirect}>Redirecting you to the store...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className={styles.errorIcon}>✕</div>
              <h1>Oops!</h1>
              <p className={styles.errorMessage}>{message}</p>
              {!user && (
                <button className={styles.button} onClick={() => router.push('/')}>
                  Sign In to Continue
                </button>
              )}
              <button className={styles.buttonSecondary} onClick={() => router.push('/')}>
                Go to Store
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
