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
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@app/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateGroupScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el grupo');
      return;
    }

    // TODO: Implementar la lógica para crear el grupo en Firestore
    Alert.alert(
      'Grupo Creado',
      'El grupo se ha creado exitosamente',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
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
        >
          <Text style={styles.createButtonText}>Crear Grupo</Text>
        </TouchableOpacity>
      </ScrollView>
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