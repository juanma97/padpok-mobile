import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@app/types/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { useAuth } from '@app/lib/AuthContext';
import CustomDialog from '@app/components/CustomDialog';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateGroupScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const { user } = useAuth();
  const [dialog, setDialog] = useState({ visible: false, title: '', message: '', onClose: () => {} });
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setDialog({
        visible: true,
        title: 'Error',
        message: 'Por favor ingresa un nombre para el grupo',
        onClose: () => setDialog({ ...dialog, visible: false })
      });
      return;
    }
    if (!user) {
      setDialog({
        visible: true,
        title: 'Error',
        message: 'Debes iniciar sesión para crear un grupo',
        onClose: () => setDialog({ ...dialog, visible: false })
      });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'groups'), {
        name: groupName.trim(),
        description: description.trim(),
        isPrivate,
        admin: user.uid,
        members: [],
        matches: [],
        ranking: {},
        chat: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setDialog({
        visible: true,
        title: 'Grupo Creado',
        message: 'El grupo se ha creado exitosamente',
        onClose: () => {
          setDialog({ ...dialog, visible: false });
          navigation.navigate('Groups');
        }
      });
      setGroupName('');
      setDescription('');
      setIsPrivate(false);
    } catch (error) {
      console.log(error);
      setDialog({
        visible: true,
        title: 'Error',
        message: 'Hubo un error al crear el grupo. Inténtalo de nuevo.',
        onClose: () => setDialog({ ...dialog, visible: false })
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
          </TouchableOpacity>
          <Text style={styles.title}>Crear Nuevo Grupo</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre del Grupo</Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Ingresa el nombre del grupo"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe el propósito del grupo"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={styles.privacyToggle}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <View style={styles.toggleContainer}>
              <Ionicons 
                name={isPrivate ? "lock-closed" : "lock-open"} 
                size={24} 
                color="#1e3a8a" 
              />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>
                  {isPrivate ? 'Grupo Privado' : 'Grupo Público'}
                </Text>
                <Text style={styles.toggleDescription}>
                  {isPrivate 
                    ? 'Solo miembros invitados pueden unirse' 
                    : 'Cualquier persona puede solicitar unirse'}
                </Text>
              </View>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>{loading ? 'Creando...' : 'Crear Grupo'}</Text>
        </TouchableOpacity>
      </ScrollView>
      <CustomDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        onClose={dialog.onClose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 100,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleTextContainer: {
    marginLeft: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: '#314E99',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateGroupScreen; 