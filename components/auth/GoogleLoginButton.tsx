import React, { useState, useEffect } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '../ui/alert';
import { WelcomeDialog } from './WelcomeDialog';

interface GoogleLoginButtonProps {
  onLoginSuccess: () => void; // Required callback - parent MUST close dialog
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const { loginWithGoogle } = useAuth();

  // Clear error state when component mounts
  useEffect(() => {
    setError('');
    setLoading(false);
  }, []);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('No credential received from Google');
      return;
    }

    try {
      // Clear previous states
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

      // Backend now sends explicit isNewAccount flag
      const isNewUser = response.user.isNewAccount === true;

      setLoading(false);

      if (isNewUser) {
        // New user: show welcome dialog
        setNewUserName(response.user.name || 'there');
        setShowWelcome(true);
      } else {
        // Returning user: close dialog immediately
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleError = () => {
    setError('Google sign-in was cancelled or failed');
    setLoading(false);
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    onLoginSuccess();
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
            theme="outline"
            size="large"
            text="continue_with"
            logo_alignment="left"
            auto_select={true}
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
