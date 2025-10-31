import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '../ui/alert';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess }) => {
  const [error, setError] = useState('');
  const { loginWithGoogle } = useAuth();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('No credential received from Google');
      return;
    }

    try {
      setError('');
      await loginWithGoogle(credentialResponse.credential);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  const handleError = () => {
    setError('Google sign-in was cancelled or failed');
  };

  return (
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
  );
};
