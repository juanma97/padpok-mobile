import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

import LoginScreen from './LoginScreen';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), dispatch: jest.fn() }),
}));

jest.mock('@app/lib/firebase', () => ({
  auth: {},
}));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
}));

describe('LoginScreen', () => {
  it('renders email and password fields', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Contraseña')).toBeTruthy();
  });

  it('shows error if trying to login without data', async () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Iniciar sesión'));
    await waitFor(() => {
      expect(getByText('Por favor, completa todos los campos')).toBeTruthy();
    });
  });
}); 