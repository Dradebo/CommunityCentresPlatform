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
  const [loading, setLoading] = useState(false);
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
      setLoading(true);

      const response = await loginWithGoogle(credentialResponse.credential);

      // Defensive checks for response structure
      if (!response || !response.user) {
        console.error('Invalid response from loginWithGoogle:', response);
        setError('Authentication succeeded but user data is missing. Please try again.');
        setLoading(false);
        return;
      }

      // Check if this is a new user (timestamps match = just created)
      // Add defensive null checks and logging
      const createdAt = response.user.createdAt;
      const updatedAt = response.user.updatedAt;

      console.log('Google OAuth - User timestamps:', { createdAt, updatedAt });

      const isNewUser = createdAt && updatedAt && (createdAt === updatedAt);
      console.log('Google OAuth - Is new user:', isNewUser);

      if (isNewUser) {
        setNewUserName(response.user.name || 'there');
        setShowWelcome(true);
      } else {
        // Returning user - close dialog immediately
        onSuccess?.();
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
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
        {loading && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Signing you in...
          </div>
        )}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={true}
            theme="outline"
            size="large"
            width="100%"
            text="continue_with"
            logo_alignment="left"
            auto_select={false}
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
