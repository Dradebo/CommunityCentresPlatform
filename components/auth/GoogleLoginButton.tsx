import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '../ui/alert';
import { WelcomeDialog } from './WelcomeDialog';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess }) => {
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const { loginWithGoogle } = useAuth();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('No credential received from Google');
      return;
    }

    try {
      setError('');
      const response = await loginWithGoogle(credentialResponse.credential);

      // Check if this is a new user (timestamps match = just created)
      const isNewUser = response.user?.createdAt === response.user?.updatedAt;

      if (isNewUser) {
        setNewUserName(response.user.name);
        setShowWelcome(true);
      } else {
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  const handleError = () => {
    setError('Google sign-in was cancelled or failed');
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    onSuccess?.();
  };

  return (
    <>
      <div className="space-y-2">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            theme="outline"
            size="large"
            width="100%"
            text="continue_with"
            logo_alignment="left"
          />
        </div>
      </div>
      <WelcomeDialog
        isOpen={showWelcome}
        onClose={handleWelcomeClose}
        userName={newUserName}
      />
    </>
  );
};
