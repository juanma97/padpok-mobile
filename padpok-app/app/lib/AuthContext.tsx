import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  user: FirebaseUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado
        setUser(firebaseUser);
        try {
          await AsyncStorage.setItem('user', JSON.stringify(firebaseUser));
        } catch (error) {
          console.error('Error saving user to AsyncStorage:', error);
        }
      } else {
        // No hay usuario autenticado
        setUser(null);
        try {
          await AsyncStorage.removeItem('user');
        } catch (error) {
          console.error('Error removing user from AsyncStorage:', error);
        }
      }
      setLoading(false);
    });

    // Intentar recuperar usuario de AsyncStorage al iniciar
    const bootstrapAsync = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          // Esto es solo para mostrar una UI inmediata, el listener de onAuthStateChanged
          // eventualmente verificará si el token es válido
          setUser(JSON.parse(userString));
        }
      } catch (error) {
        console.error('Error reading user from AsyncStorage:', error);
      }
    };

    bootstrapAsync();

    // Limpiar el listener cuando el componente se desmonte
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}; 