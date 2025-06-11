import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), setParams: jest.fn() }),
}));

jest.mock('@react-navigation/stack', () => ({
  StackNavigationProp: jest.fn(),
}));

jest.mock('@app/lib/firebase', () => ({
  db: {},
}));

jest.mock('@app/lib/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user' } }),
}));

jest.mock('@app/components/MatchCard', () => 'MatchCard');

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    View: ({ children }: any) => <>{children}</>,
    Text: RN.Text,
    SafeAreaView: ({ children }: any) => <>{children}</>,
    StatusBar: () => null,
    StyleSheet: { create: () => ({}), flatten: (style: any) => style },
    FlatList: ({ data, renderItem }: any) => <>{data && data.map(renderItem)}</>,
    TouchableOpacity: ({ children }: any) => <>{children}</>,
    ActivityIndicator: () => null,
    RefreshControl: () => null,
    Alert: { alert: jest.fn() },
  };
});

jest.mock('firebase/firestore', () => ({
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  collection: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: { now: jest.fn() },
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
}));

import MatchesScreen from '../MatchesScreen';

describe('MatchesScreen', () => {
  it('renders without crashing', () => {
    const navigationMock = { navigate: jest.fn(), setParams: jest.fn(), dispatch: jest.fn() };
    const routeMock = { key: 'test-key', name: 'Matches', params: {} };
    render(<MatchesScreen navigation={navigationMock as any} route={routeMock as any} />);
  });

  it('shows empty message when there are no matches', async () => {
    const navigationMock = { navigate: jest.fn(), setParams: jest.fn(), dispatch: jest.fn() };
    const routeMock = { key: 'test-key', name: 'Matches', params: {} };
    const { findByText } = render(<MatchesScreen navigation={navigationMock as any} route={routeMock as any} />);
    expect(await findByText('No hay partidos disponibles próximamente')).toBeTruthy();
  });

  it('does not show empty message when there are matches', () => {
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => [
        [
          {
            id: '1',
            date: new Date(Date.now() + 1000000),
            createdAt: new Date(),
            updatedAt: new Date(),
            playersJoined: [],
            level: 'Intermedio',
          }
        ],
        jest.fn()
      ])
      .mockImplementation((init) => [init, jest.fn()]);
    const navigationMock = { navigate: jest.fn(), setParams: jest.fn(), dispatch: jest.fn() };
    const routeMock = { key: 'test-key', name: 'Matches', params: {} };
    const { queryByText } = render(<MatchesScreen navigation={navigationMock as any} route={routeMock as any} />);
    expect(queryByText('No hay partidos disponibles próximamente')).toBeNull();
  });
}); 