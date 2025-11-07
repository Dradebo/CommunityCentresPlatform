import React, { useState, useEffect } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '../ui/alert';
import { WelcomeDialog } from './WelcomeDialog';
import { CheckCircle } from 'lucide-react';

interface GoogleLoginButtonProps {
  onLoginSuccess: () => void; // Required callback - parent MUST close dialog
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [success, setSuccess] = useState(false);
  const { loginWithGoogle } = useAuth();

  // Clear error and success state when component mounts
  useEffect(() => {
    setError('');
    setSuccess(false);
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
      setSuccess(false);
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

      // Show brief success indicator
      setSuccess(true);
      setLoading(false);

      if (isNewUser) {
        // New user: show welcome dialog
        setNewUserName(response.user.name || 'there');
        setShowWelcome(true);
      } else {
        // Returning user: close dialog immediately after brief success indicator
        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
      setSuccess(false);
    }
  };

  const handleError = () => {
    setError('Google sign-in was cancelled or failed');
    setLoading(false);
    setSuccess(false);
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
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Successfully signed in!
            </AlertDescription>
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
