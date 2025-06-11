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
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@app/types/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { useAuth } from '@app/lib/AuthContext';
import CustomDialog from '@app/components/CustomDialog';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateGroupScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
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
        isPrivate: false,
        admin: user.uid,
        members: [user.uid],
        matches: [],
        ranking: {
          [user.uid]: {
            points: 0,
            matchesPlayed: 0,
            wins: 0,
            losses: 0
          }
        },
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
          navigation.navigate('Home', { screen: 'Groups', params: { refresh: true } });
        }
      });
      setGroupName('');
      setDescription('');
    } catch (error) {
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header premium */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={SIZES.xl} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Crear Nuevo Grupo</Text>
        </View>

        {/* Formulario premium */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre del Grupo</Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Ingresa el nombre del grupo"
              placeholderTextColor={COLORS.gray}
              autoCapitalize="words"
              returnKeyType="done"
              maxLength={40}
              accessibilityLabel="Nombre del grupo"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe el propósito del grupo"
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel="Descripción del grupo"
              maxLength={200}
            />
          </View>
        </View>

        {/* Botón premium */}
        <TouchableOpacity 
          style={[styles.createButton, loading && { opacity: 0.7 }]}
          onPress={handleCreateGroup}
          disabled={loading}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Crear grupo"
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.createButtonText}>Crear Grupo</Text>
          )}
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
    backgroundColor: COLORS.light,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: SPACING.lg,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginRight: SIZES.xl + SPACING.md, // para compensar el espacio del botón de back
  },
  form: {
    padding: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: FONTS.regular,
    color: COLORS.dark,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
  },
});

export default CreateGroupScreen; 