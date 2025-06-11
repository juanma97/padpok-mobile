import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from './RegisterScreen';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), dispatch: jest.fn() }),
}));

jest.mock('@app/lib/firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: '123' } })),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('RegisterScreen', () => {
  it('renders email and password fields in step 1', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Contraseña')).toBeTruthy();
    expect(getByText('Siguiente')).toBeTruthy();
  });

  it('shows error if trying to proceed without data', async () => {
    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText('Siguiente'));
    await waitFor(() => {
      expect(getByText('Por favor, completa email y contraseña')).toBeTruthy();
    });
  });
}); 