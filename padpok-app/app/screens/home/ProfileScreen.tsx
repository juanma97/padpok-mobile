import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { auth, db } from '@app/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@app/types';
import { COLORS } from '@app/constants/theme';

const ProfileScreen: React.FC = () => {
  const [userData, setUserData] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as Partial<User>);
        } else {
          setUserData({
            displayName: auth.currentUser.displayName || undefined,
            email: auth.currentUser.email || '',
            photoURL: auth.currentUser.photoURL || undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // La navegación será manejada por el AuthContext
    } catch (error) {
      Alert.alert('Error', 'Error al cerrar sesión');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {userData?.photoURL ? (
            <Image
              source={{ uri: userData.photoURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{userData?.displayName || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{userData?.email}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={24} color="#666" style={styles.icon} />
            <Text style={styles.menuText}>Editar perfil</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="tennisball-outline" size={24} color="#666" style={styles.icon} />
            <Text style={styles.menuText}>Mis partidos</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemLast}>
            <Ionicons name="settings-outline" size={24} color="#666" style={styles.icon} />
            <Text style={styles.menuText}>Configuración</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" style={styles.chevron} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#f44336" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.primary,
  },
  avatarContainer: {
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  defaultAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  content: {
    padding: 24,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuText: {
    color: '#4b5563',
  },
  icon: {
    marginRight: 12,
  },
  chevron: {
    marginLeft: 'auto',
  },
  logoutButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '500',
  },
});

export default ProfileScreen; 