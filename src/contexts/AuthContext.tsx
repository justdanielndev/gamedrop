'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, getUserIdentities, loginWithOIDC, logout as appwriteLogout, executeFunction } from '@/lib/appwrite';
import { Models } from 'appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  userAvatar: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const fetchSlackAvatar = async (userId: string) => {
    try {
      const functionId = process.env.NEXT_PUBLIC_SLACK_AVATAR_FUNCTION_ID;
      
      if (!functionId) {
        console.warn('Slack avatar function ID not configured');
        return null;
      }

      const requestBody = { userId };

      const execution = await executeFunction(functionId, requestBody);

      if (execution.responseBody) {
        const result = JSON.parse(execution.responseBody);
        
        if (result.ok && result.avatar?.image_192) {
          return result.avatar.image_192;
        } else {
          console.warn('Function returned but no avatar:', result);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to fetch Slack avatar:', error);
      return null;
    }
  };

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const identities = await getUserIdentities();
        
        if (identities && identities.identities && identities.identities.length > 0) {
          const slackIdentity = identities.identities.find((identity: { provider: string; providerUid?: string }) => 
            identity.provider === 'oidc' || identity.provider?.toLowerCase().includes('slack')
          );
          
          if (slackIdentity?.providerUid) {
            
            const avatar = await fetchSlackAvatar(slackIdentity.providerUid);
            if (avatar) {
              setUserAvatar(avatar);
            }
          } else {
            console.warn('No Slack/OIDC identity found in identities');
          }
        } else {
          console.warn('No identities found for user');
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
      setUserAvatar(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    loginWithOIDC();
  };

  const logout = async () => {
    try {
      await appwriteLogout();
      setUser(null);
      setUserAvatar(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, userAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
