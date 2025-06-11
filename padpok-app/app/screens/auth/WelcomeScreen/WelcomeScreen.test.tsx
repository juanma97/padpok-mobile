import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

import WelcomeScreen from './WelcomeScreen';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe('WelcomeScreen', () => {
  it('renders main texts and buttons', () => {
    const { getByText } = render(<WelcomeScreen />);
    expect(getByText('Encuentra tu próximo partido')).toBeTruthy();
    expect(getByText('Crear cuenta')).toBeTruthy();
    expect(getByText('Iniciar sesión')).toBeTruthy();
    expect(getByText('Explorar sin registrarse')).toBeTruthy();
  });

  it('allows pressing the create account button', () => {
    const { getByText } = render(<WelcomeScreen />);
    fireEvent.press(getByText('Crear cuenta'));
  });
}); 