import React, { useState } from 'react';
import Navigation from '@app/navigation/Navigation';
import { AuthProvider } from '@app/lib/AuthContext';
import SplashScreen from '@app/components/SplashScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <AuthProvider>
      {isLoading ? (
        <SplashScreen onFinish={() => setIsLoading(false)} />
      ) : (
        <Navigation />
      )}
    </AuthProvider>
  );
}
