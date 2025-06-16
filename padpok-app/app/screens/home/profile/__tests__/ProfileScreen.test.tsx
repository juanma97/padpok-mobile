import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from './ProfileScreen';
import { act } from 'react-test-renderer';
import { Text } from 'react-native';

// Mocks globales
jest.mock('@app/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user-1', username: 'testuser' }
  })
}));
jest.mock('@app/lib/firebase', () => ({
  auth: {},
  db: {},
}));
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(() => Promise.resolve()),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: '',
    level: 'Intermedio',
    stats: { matchesPlayed: 10, wins: 6, medals: ['m1'] },
    availability: { days: ['L', 'M'], hours: ['07:00', '14:00'] },
    clubZone: 'Central',
    bio: 'Padel lover',
  }) }))
}));
jest.mock('@app/lib/medals', () => ({
  getAllMedals: jest.fn(() => Promise.resolve([
    { id: 'm1', name: 'First Match', icon: 'trophy', description: '', condition: '', hidden: false },
    { id: 'm2', name: 'Champion', icon: 'star', description: '', condition: '', hidden: false },
  ])),
  getUserMedals: jest.fn(() => Promise.resolve([
    { id: 'm1', unlocked: true },
    { id: 'm2', unlocked: false },
  ])),
}));
jest.mock('@react-navigation/native', () => {
  const navigationMock = {
    navigate: jest.fn(),
    dispatch: jest.fn(),
  };
  return {
    useNavigation: () => navigationMock,
    CommonActions: { reset: jest.fn((args) => args) },
    __navigationMock: navigationMock,
  };
});
jest.mock('@app/components/CustomDialog', () => (props: any) => {
  const { Text } = require('react-native');
  if (!props.visible) return null;
  return (
    <>
      <>{props.title}</>
      <>{props.message}</>
      {props.title === 'Cerrar sesión' && (
        <Text testID="dialog-confirm-signout" onPress={props.options?.[1]?.onPress}>Confirmar</Text>
      )}
      {props.title === 'Éxito' && (
        <Text testID="dialog-success-close" onPress={props.onClose}>OK</Text>
      )}
    </>
  );
});
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const getDefaultProps = (params = undefined) => ({ route: { params } });

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders own profile with stats and medals', async () => {
    const { findByText, getByTestId, findAllByText } = render(<ProfileScreen {...getDefaultProps()} />);
    expect(await findByText('testuser')).toBeTruthy();
    expect(getByTestId('signout-button')).toBeTruthy();
    expect(await findByText('Partidos')).toBeTruthy();
    expect(await findByText('Victorias')).toBeTruthy();
    const medallas = await findAllByText('Medallas');
    expect(medallas.length).toBeGreaterThanOrEqual(2);
    expect(await findByText('First Match')).toBeTruthy();
    expect(await findByText('Champion')).toBeTruthy();
  });

  it('shows sign out dialog and calls signOut', async () => {
    const { getByTestId, findByText } = render(<ProfileScreen {...getDefaultProps()} />);
    fireEvent.press(getByTestId('signout-button'));
    expect(await findByText('Cerrar sesión')).toBeTruthy();
    const confirmBtn = await findByText('Confirmar');
    fireEvent.press(confirmBtn);
    const { signOut } = require('firebase/auth');
    expect(signOut).toHaveBeenCalled();
  });

  it('navigates to MatchHistory when pressing see-history-button', async () => {
    const { getByTestId } = render(<ProfileScreen {...getDefaultProps()} />);
    fireEvent.press(getByTestId('see-history-button'));
    const navigation = require('@react-navigation/native').__navigationMock;
    expect(navigation.navigate).toHaveBeenCalledWith('MatchHistory');
  });

  it('navigates to Medals when pressing see-all-medals-button', async () => {
    const { getByTestId } = render(<ProfileScreen {...getDefaultProps()} />);
    fireEvent.press(getByTestId('see-all-medals-button'));
    const navigation = require('@react-navigation/native').__navigationMock;
    expect(navigation.navigate).toHaveBeenCalledWith('Medals');
  });

  it('selects a day chip and enables save button', async () => {
    const { getByTestId, findByTestId } = render(<ProfileScreen {...getDefaultProps()} />);
    fireEvent.press(getByTestId('day-chip-X'));
    expect(await findByTestId('save-availability-button')).toBeTruthy();
  });

  it('selects an hour chip and enables save button', async () => {
    const { getByTestId, findByTestId } = render(<ProfileScreen {...getDefaultProps()} />);
    fireEvent.press(getByTestId('hour-chip-09:00'));
    expect(await findByTestId('save-availability-button')).toBeTruthy();
  });

  it('calls updateDoc and shows success dialog when saving availability', async () => {
    const { getByTestId, findByText, findByTestId } = render(<ProfileScreen {...getDefaultProps()} />);
    fireEvent.press(getByTestId('day-chip-X'));
    const saveBtn = await findByTestId('save-availability-button');
    fireEvent.press(saveBtn);
    const okBtn = await findByText('OK');
    fireEvent.press(okBtn);
    const { updateDoc } = require('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('renders empty medals message if user has no medals', async () => {
    const medals = require('@app/lib/medals');
    medals.getUserMedals.mockImplementationOnce(() => Promise.resolve([]));
    const { findByText } = render(<ProfileScreen {...getDefaultProps()} />);
    expect(await findByText('Aún no has desbloqueado medallas')).toBeTruthy();
  });

  it('renders correctly with no bio', async () => {
    const firestore = require('firebase/firestore');
    firestore.getDoc.mockImplementationOnce(() => Promise.resolve({ exists: () => true, data: () => ({
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: '',
      level: 'Intermedio',
      stats: { matchesPlayed: 10, wins: 6, medals: ['m1'] },
      availability: { days: ['L', 'M'], hours: ['07:00', '14:00'] },
      clubZone: 'Central',
      bio: '',
    }) }));
    const { findByText } = render(<ProfileScreen {...getDefaultProps()} />);
    expect(await findByText('testuser')).toBeTruthy();
  });
}); 