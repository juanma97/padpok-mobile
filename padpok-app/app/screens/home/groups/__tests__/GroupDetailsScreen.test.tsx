import React from 'react';
import { render, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react-native';
import { TouchableOpacity, Text } from 'react-native';
// Mock de @app/lib/firebase antes de importar el componente
jest.mock('@app/lib/firebase', () => ({
  db: {},
  collection: jest.fn(() => ({})),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  doc: jest.fn(() => ({})),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));
import GroupDetailsScreen from '../GroupDetailsScreen';

// Mocks for dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setParams: jest.fn(),
  }),
  useRoute: () => ({ params: { groupId: 'group-1' } }),
}));

jest.mock('@app/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' }
  })
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => true, id: 'group-1', data: () => ({
    name: 'Test Group',
    admin: 'test-user',
    members: ['test-user'],
    matches: [
      { id: 'match-1', title: 'Match 1', location: 'Court 1', level: 'Intermedio', description: '', date: new Date(Date.now() + 3600000), ageRange: 'todas las edades', playersNeeded: 4, playersJoined: ['test-user'], createdBy: 'test-user', admin: 'test-user', createdAt: new Date(), teams: { team1: ['test-user'], team2: [] } }
    ],
    ranking: { 'test-user': { points: 10, matchesPlayed: 1, wins: 1 } }
  }) })) ,
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('@app/components/SegmentedControl', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ options, value, onChange, testID }: { options: string[]; value: string; onChange: (label: string) => void; testID?: string }) => (
    <>
      {options.map((label: string) => (
        <TouchableOpacity
          key={label}
          onPress={() => onChange(label)}
          testID={`tab-${label}`}
        >
          <Text>{label}</Text>
        </TouchableOpacity>
      ))}
    </>
  );
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

jest.mock('@app/components/MatchCard', () => (props: any) => {
  const { TouchableOpacity, Text } = require('react-native');
  const { match, onPress } = props;
  return <TouchableOpacity onPress={onPress} testID={`match-card-${match.id}`}><Text>{match.title}</Text></TouchableOpacity>;
});
jest.mock('@app/components/MatchChat', () => () => {
  const { Text } = require('react-native');
  return <Text>Chat Component</Text>;
});
jest.mock('@app/components/CustomDialog', () => () => null);
jest.mock('react-native-modal', () => ({ children }: any) => <>{children}</>);
jest.mock('@app/components/TeamSelectionModal', () => () => null);
jest.mock('@app/components/ScoreForm', () => () => null);

// Silence useLayoutEffect warning
React.useLayoutEffect = React.useEffect;

// Helper to flush promises
const flushPromises = () => new Promise(setImmediate);

describe('GroupDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders group name and tabs', async () => {
    const { findByText } = render(<GroupDetailsScreen />);
    expect(await findByText('Test Group')).toBeTruthy();
    expect(await findByText('Partidos')).toBeTruthy();
    expect(await findByText('Ranking')).toBeTruthy();
    expect(await findByText('Chat')).toBeTruthy();
  });

  it('shows available matches in default tab', async () => {
    const { findByText } = render(<GroupDetailsScreen />);
    expect(await findByText('Match 1')).toBeTruthy();
  });

  it('shows ranking tab and user stats', async () => {
    const { getByTestId, findByText } = render(<GroupDetailsScreen />);
    fireEvent.press(getByTestId('tab-Ranking'));
    expect(await findByText('Test Group')).toBeTruthy(); // header
    expect(await findByText('test-user')).toBeTruthy(); // username in ranking
    expect(await findByText(/10 pts/)).toBeTruthy();
    expect(await findByText(/1 part/)).toBeTruthy();
    expect(await findByText(/1 vict/)).toBeTruthy();
  });

  it('shows chat tab', async () => {
    const { getByTestId, findByText } = render(<GroupDetailsScreen />);
    fireEvent.press(getByTestId('tab-Chat'));
    expect(await findByText('Chat Component')).toBeTruthy();
  });

  it('shows empty message if no matches', async () => {
    // Mock getDoc to return group with no matches
    const firestore = require('firebase/firestore');
    firestore.getDoc.mockImplementationOnce(() => Promise.resolve({ exists: () => true, id: 'group-1', data: () => ({
      name: 'Test Group',
      admin: 'test-user',
      members: ['test-user'],
      matches: [],
      ranking: {}
    }) }));
    const { findByText } = render(<GroupDetailsScreen />);
    expect(await findByText('No hay partidos en este grupo.')).toBeTruthy();
  });

  it('shows empty ranking message if no ranking', async () => {
    // Mock getDoc to return group with no ranking
    const firestore = require('firebase/firestore');
    firestore.getDoc.mockImplementationOnce(() => Promise.resolve({ exists: () => true, id: 'group-1', data: () => ({
      name: 'Test Group',
      admin: 'test-user',
      members: ['test-user'],
      matches: [],
      ranking: {}
    }) }));
    const { getByTestId, findByText } = render(<GroupDetailsScreen />);
    fireEvent.press(getByTestId('tab-Ranking'));
    expect(await findByText('No hay ranking aún.')).toBeTruthy();
  });

  it('shows FAB to create match in Partidos tab', async () => {
    const { findByText, getByText } = render(<GroupDetailsScreen />);
    expect(await findByText('Partidos')).toBeTruthy();
    expect(getByText('Crear Partido en el Grupo')).toBeTruthy(); // Modal header (always rendered in tree)
  });
}); 