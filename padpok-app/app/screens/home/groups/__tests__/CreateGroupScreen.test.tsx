import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateGroupScreen from '../CreateGroupScreen';

// Mock de las dependencias
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn()
  })
}));

jest.mock('@app/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' }
  })
}));

jest.mock('@app/lib/firebase', () => ({
  db: {},
  addDoc: jest.fn(),
  collection: jest.fn(() => ({
    add: jest.fn()
  }))
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

describe('CreateGroupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the group creation form correctly', () => {
    const { getByPlaceholderText, getByText } = render(<CreateGroupScreen />);

    expect(getByPlaceholderText('Ingresa el nombre del grupo')).toBeTruthy();
    expect(getByPlaceholderText('Describe el propósito del grupo')).toBeTruthy();
    expect(getByText('Crear Grupo')).toBeTruthy();
  });

  it('shows error when trying to create a group without a name', async () => {
    const { getByText } = render(<CreateGroupScreen />);

    fireEvent.press(getByText('Crear Grupo'));

    await waitFor(() => {
      expect(getByText('Error')).toBeTruthy();
      expect(getByText('Por favor ingresa un nombre para el grupo')).toBeTruthy();
    });
  });

  it('shows error when there is no authenticated user', async () => {
    // Mock de useAuth para simular usuario no autenticado
    jest.spyOn(require('@app/lib/AuthContext'), 'useAuth').mockReturnValue({
      user: null
    });

    const { getByText, getByPlaceholderText } = render(<CreateGroupScreen />);

    fireEvent.changeText(getByPlaceholderText('Ingresa el nombre del grupo'), 'Grupo de prueba');
    fireEvent.press(getByText('Crear Grupo'));

    await waitFor(() => {
      expect(getByText('Error')).toBeTruthy();
      expect(getByText('Debes iniciar sesión para crear un grupo')).toBeTruthy();
    });
  });
}); 