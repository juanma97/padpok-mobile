import React from 'react';
import Navigation from '@app/navigation/Navigation';
import { AuthProvider } from '@app/lib/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
