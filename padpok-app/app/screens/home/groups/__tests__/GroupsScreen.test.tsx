import React from 'react';
import { render, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react-native';
import GroupsScreen from '../GroupsScreen';

// Mocks for dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    setParams: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
}));

jest.mock('@app/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' }
  })
}));

// Mock de firebase/firestore para evitar validación interna
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  getDocs: jest.fn(() => Promise.resolve({ docs: [
    { id: '1', data: () => ({ name: 'Group 1', admin: 'test-user', members: ['test-user'] }) },
    { id: '2', data: () => ({ name: 'Group 2', admin: 'other-user', members: [] }) },
  ] })),
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

// Mock de @app/lib/firebase para evitar ejecución de código real
jest.mock('@app/lib/firebase', () => ({
  db: {},
  collection: jest.fn(() => ({})),
  // Por defecto, getDocs devuelve vacío
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Mock SegmentedControl usando TouchableOpacity y testID
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

// Silence useLayoutEffect warning
React.useLayoutEffect = React.useEffect;

// Mock navigation global para todos los tests
const navigationMock = {
  navigate: jest.fn(),
  setParams: jest.fn(),
};
jest.mock('@react-navigation/native', () => {
  const navigationMock = {
    navigate: jest.fn(),
    setParams: jest.fn(),
  };
  return {
    useNavigation: () => navigationMock,
    useRoute: () => ({ params: {} }),
    __navigationMock: navigationMock,
  };
});

// Helper para mockear getDocs dinámicamente
const mockGetDocs = (docs: any[]) => {
  const firebase = require('@app/lib/firebase');
  const firestore = require('firebase/firestore');
  firebase.getDocs.mockImplementationOnce(() => Promise.resolve({ docs }));
  firestore.getDocs.mockImplementationOnce(() => Promise.resolve({ docs }));
};

describe('GroupsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Asegura que getDocs devuelva vacío por defecto después de cada test
    const firebase = require('@app/lib/firebase');
    firebase.getDocs.mockImplementation(() => Promise.resolve({ docs: [] }));
  });

  it('renders the tabs and FAB, and shows only user groups by default', async () => {
    mockGetDocs([
      { id: '1', data: () => ({ name: 'Group 1', admin: 'test-user', members: ['test-user'] }) },
      { id: '2', data: () => ({ name: 'Group 2', admin: 'other-user', members: [] }) },
    ]);
    const { findByText, queryByText, getByTestId } = render(<GroupsScreen />);
    expect(await findByText('Mis Grupos')).toBeTruthy();
    expect(await findByText('Explorar Grupos')).toBeTruthy();
    // Solo el grupo del usuario debe estar visible en el tab por defecto
    expect(await findByText('Group 1')).toBeTruthy();
    expect(queryByText('Group 2')).toBeNull();
    expect(getByTestId('fab-create-group')).toBeTruthy();
  });

  it('shows all groups when switching to explore tab', async () => {
    mockGetDocs([
      { id: '1', data: () => ({ name: 'Group 1', admin: 'test-user', members: ['test-user'] }) },
      { id: '2', data: () => ({ name: 'Group 2', admin: 'other-user', members: [] }) },
    ]);
    const { getByTestId, findAllByText, findByText, queryByText } = render(<GroupsScreen />);
    await findByText('Group 1');
    fireEvent.press(getByTestId('tab-Explorar Grupos'));
    // En el tab de explorar solo debe aparecer Group 2
    expect(queryByText('Group 1')).toBeNull();
    expect(await findByText('Group 2')).toBeTruthy();
  });

  it('shows "No tienes grupos aún" if user has no groups', async () => {
    mockGetDocs([]);
    const { findByText, queryByText } = render(<GroupsScreen />);
    await waitFor(() => expect(queryByText('Cargando grupos...')).toBeNull());
    expect(await findByText('No tienes grupos aún')).toBeTruthy();
  });

  it('shows search input when switching to explore tab', async () => {
    mockGetDocs([
      { id: '1', data: () => ({ name: 'Group 1', admin: 'test-user', members: ['test-user'] }) },
      { id: '2', data: () => ({ name: 'Group 2', admin: 'other-user', members: [] }) },
    ]);
    const { getByTestId, findByPlaceholderText, findByText } = render(<GroupsScreen />);
    await findByText('Group 1');
    fireEvent.press(getByTestId('tab-Explorar Grupos'));
    expect(await findByPlaceholderText('Buscar grupo...')).toBeTruthy();
  });

  it('navigates to CreateGroup when FAB is pressed', async () => {
    mockGetDocs([
      { id: '1', data: () => ({ name: 'Group 1', admin: 'test-user', members: ['test-user'] }) },
    ]);
    const { getByTestId, findByText } = render(<GroupsScreen />);
    await findByText('Group 1');
    fireEvent.press(getByTestId('fab-create-group'));
    const navigation = require('@react-navigation/native').__navigationMock;
    expect(navigation.navigate).toHaveBeenCalledWith('CreateGroup');
  });

  it('navigates to GroupDetails when a group is pressed', async () => {
    mockGetDocs([
      { id: '1', data: () => ({ name: 'Group 1', admin: 'test-user', members: ['test-user'] }) },
    ]);
    const { findByText, queryByText } = render(<GroupsScreen />);
    await findByText('Group 1');
    // Solo esperar si el loading existe
    if (queryByText('Cargando grupos...')) {
      await waitForElementToBeRemoved(() => queryByText('Cargando grupos...'));
    }
    fireEvent.press(await findByText('Group 1'));
    const navigation = require('@react-navigation/native').__navigationMock;
    expect(navigation.navigate).toHaveBeenCalledWith('GroupDetails', { groupId: '1' });
  });
}); 