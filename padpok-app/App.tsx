import React, { useState, useEffect } from 'react';
import Navigation from '@app/navigation/Navigation';
import { AuthProvider } from '@app/lib/AuthContext';
import SplashScreen from '@app/components/SplashScreen';
import { checkPendingResults } from '@app/lib/matches';
import { cleanInvalidNotifications } from '@app/lib/notifications';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar partidos pendientes de resultado al iniciar la app
    const checkPending = async () => {
      try {
        await checkPendingResults();
          } catch (error) {
      // Error checking pending results
    }
    };
    
    // Limpiar notificaciones inválidas
    const cleanNotifications = async () => {
      try {
        await cleanInvalidNotifications();
          } catch (error) {
      // Error cleaning invalid notifications
    }
    };
    
    Promise.all([checkPending(), cleanNotifications()]);
  }, []);

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
