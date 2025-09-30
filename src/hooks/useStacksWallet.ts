import { useState, useEffect } from 'react';
import { showConnect } from '@stacks/connect';
import { 
  appDetails, 
  userSession, 
  getUserData, 
  isSignedIn, 
  signOut,
  getUserAddress,
  getUserBtcAddress
} from '../utils/stacks';

export interface StacksUserData {
  address: string;
  btcAddress: string;
  profile: any;
  appPrivateKey?: string;
  isSignedIn: boolean;
}

export const useStacksWallet = () => {
  const [userData, setUserData] = useState<StacksUserData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for pending sign-ins and load user data
  useEffect(() => {
    const handlePendingSignIn = async () => {
      if (userSession.isSignInPending()) {
        setIsConnecting(true);
        try {
          const userData = await userSession.handlePendingSignIn();
          const address = getUserAddress();
          const btcAddress = getUserBtcAddress();
          if (address && btcAddress) {
            setUserData({
              address,
              btcAddress,
              profile: userData.profile,
              appPrivateKey: userData.appPrivateKey,
              isSignedIn: true,
            });
          }
        } catch (error) {
          console.error('Error handling pending sign-in:', error);
        } finally {
          setIsConnecting(false);
          setIsLoading(false);
        }
      } else if (isSignedIn()) {
        const currentUserData = getUserData();
        if (currentUserData) {
          const address = getUserAddress();
          const btcAddress = getUserBtcAddress();
          if (address && btcAddress) {
            setUserData({
              address,
              btcAddress,
              profile: currentUserData.profile,
              appPrivateKey: currentUserData.appPrivateKey,
              isSignedIn: true,
            });
          }
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    handlePendingSignIn();
  }, []);

  const connectWallet = () => {
    setIsConnecting(true);
    showConnect({
      appDetails,
      onFinish: () => {
        setIsConnecting(false);
        window.location.reload();
      },
      onCancel: () => {
        setIsConnecting(false);
      },
      userSession,
    });
  };

  const disconnectWallet = () => {
    signOut();
    setUserData(null);
  };

  return {
    userData,
    isConnecting,
    isLoading,
    connectWallet,
    disconnectWallet,
    isSignedIn: isSignedIn(),
  };
};
