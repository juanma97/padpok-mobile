import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@app/lib/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user' } }),
}));

jest.mock('@app/lib/medals', () => ({
  getAllMedals: jest.fn(() => Promise.resolve([
    {
      id: '1',
      name: 'Primera Victoria',
      description: 'Gana tu primer partido',
      icon: 'trophy',
      requirements: { type: 'wins', value: 1 }
    },
    {
      id: '2',
      name: 'Maestro del Tenis',
      description: 'Juega 10 partidos',
      icon: 'star',
      requirements: { type: 'matches_played', value: 10 }
    }
  ])),
  getUserMedals: jest.fn(() => Promise.resolve([
    {
      id: '1',
      unlocked: true,
      progress: 1
    },
    {
      id: '2',
      unlocked: false,
      progress: 5
    }
  ]))
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    View: ({ children }: any) => <>{children}</>,
    Text: RN.Text,
    SafeAreaView: ({ children }: any) => <>{children}</>,
    StatusBar: () => null,
    StyleSheet: { create: () => ({}), flatten: (style: any) => style },
    ScrollView: ({ children }: any) => <>{children}</>,
    ActivityIndicator: () => null,
  };
});

import MedalsScreen from '../MedalsScreen';

describe('MedalsScreen', () => {
  it('shows the correct unlocked medals counter', async () => {
    const { getByText } = render(<MedalsScreen />);
    
    await waitFor(() => {
      expect(getByText('1 de 2 medallas desbloqueadas')).toBeTruthy();
    });
  });

  it('shows the medals correctly', async () => {
    const { getByText } = render(<MedalsScreen />);
    
    await waitFor(() => {
      expect(getByText('Primera Victoria')).toBeTruthy();
      expect(getByText('Maestro del Tenis')).toBeTruthy();
      expect(getByText('Gana tu primer partido')).toBeTruthy();
      expect(getByText('Juega 10 partidos')).toBeTruthy();
    });
  });

  it('shows the correct progress for unlocked and locked medals', async () => {
    const { getByText } = render(<MedalsScreen />);
    
    await waitFor(() => {
      expect(getByText('¡Desbloqueada!')).toBeTruthy();
      expect(getByText('5/10 partidos')).toBeTruthy();
    });
  });
}); 