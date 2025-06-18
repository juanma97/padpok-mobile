import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RankingScreen from './RankingScreen';

// Mocks globales
jest.mock('@app/lib/firebase', () => ({
  db: {},
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
jest.mock('@app/components/SegmentedControl', () => (props: any) => {
  const { Text } = require('react-native');
  return (
    <>
      {props.options.map((o: string) => (
        <Text key={o} testID={`segmented-${o}`} onPress={() => props.onChange(o)}>{o}</Text>
      ))}
    </>
  );
});

const mockUsers = [
  {
    id: '1',
    username: 'Alice',
    stats: { points: 100, matchesPlayed: 10, wins: 7, losses: 3 }
  },
  {
    id: '2',
    username: 'Bob',
    stats: { points: 80, matchesPlayed: 12, wins: 6, losses: 6 }
  },
  {
    id: '3',
    username: 'Charlie',
    stats: { points: 60, matchesPlayed: 8, wins: 4, losses: 4 }
  }
];

describe('RankingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator initially', async () => {
    const firestore = require('firebase/firestore');
    firestore.getDocs.mockImplementationOnce(() => new Promise(() => {})); // never resolves
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn() };
    const mockRoute = { key: 'Ranking-key', name: 'Ranking' };
    const { getByTestId } = render(<RankingScreen navigation={mockNavigation as any} route={mockRoute as any} />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders users sorted by points by default', async () => {
    const firestore = require('firebase/firestore');
    firestore.getDocs.mockResolvedValueOnce({
      docs: mockUsers.map((u) => ({ id: u.id, data: () => u, exists: () => true }))
    });
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn() };
    const mockRoute = { key: 'Ranking-key', name: 'Ranking' };
    const { findByText } = render(<RankingScreen navigation={mockNavigation as any} route={mockRoute as any} />);
    expect(await findByText('Alice')).toBeTruthy();
    expect(await findByText('Bob')).toBeTruthy();
    expect(await findByText('Charlie')).toBeTruthy();
    expect(await findByText('100 pts.')).toBeTruthy();
    expect(await findByText('80 pts.')).toBeTruthy();
    expect(await findByText('60 pts.')).toBeTruthy();
  });

  it('sorts users by matches played when selected', async () => {
    const firestore = require('firebase/firestore');
    firestore.getDocs.mockResolvedValue({
      docs: mockUsers.map((u) => ({ id: u.id, data: () => u, exists: () => true }))
    });
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn() };
    const mockRoute = { key: 'Ranking-key', name: 'Ranking' };
    const { findByText, getByTestId } = render(<RankingScreen navigation={mockNavigation as any} route={mockRoute as any} />);
    await findByText('Alice'); // espera a que cargue
    fireEvent.press(getByTestId('segmented-Partidos'));
    expect(await findByText('12 part.')).toBeTruthy();
    expect(await findByText('10 part.')).toBeTruthy();
    expect(await findByText('8 part.')).toBeTruthy();
  });

  it('sorts users by wins when selected', async () => {
    const firestore = require('firebase/firestore');
    firestore.getDocs.mockResolvedValue({
      docs: mockUsers.map((u) => ({ id: u.id, data: () => u, exists: () => true }))
    });
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn() };
    const mockRoute = { key: 'Ranking-key', name: 'Ranking' };
    const { findByText, getByTestId } = render(<RankingScreen navigation={mockNavigation as any} route={mockRoute as any} />);
    await findByText('Alice');
    fireEvent.press(getByTestId('segmented-Victorias'));
    expect(await findByText('7 vict.')).toBeTruthy();
    expect(await findByText('6 vict.')).toBeTruthy();
    expect(await findByText('4 vict.')).toBeTruthy();
  });

  it('refreshes data on pull-to-refresh', async () => {
    const firestore = require('firebase/firestore');
    firestore.getDocs.mockResolvedValueOnce({
      docs: mockUsers.map((u) => ({ id: u.id, data: () => u, exists: () => true }))
    });
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn() };
    const mockRoute = { key: 'Ranking-key', name: 'Ranking' };
    const { findByText, getByTestId } = render(<RankingScreen navigation={mockNavigation as any} route={mockRoute as any} />);
    await findByText('Alice');
    firestore.getDocs.mockResolvedValueOnce({
      docs: mockUsers.map((u) => ({ id: u.id, data: () => u, exists: () => true }))
    });
    // Simula el pull-to-refresh
    fireEvent(getByTestId('FlatList'), 'refresh');
    expect(await findByText('Alice')).toBeTruthy();
  });

  it('shows empty state if no users', async () => {
    const firestore = require('firebase/firestore');
    firestore.getDocs.mockResolvedValueOnce({ docs: [] });
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn() };
    const mockRoute = { key: 'Ranking-key', name: 'Ranking' };
    const { queryByText } = render(<RankingScreen navigation={mockNavigation as any} route={mockRoute as any} />);
    await waitFor(() => {
      expect(queryByText('Usuario')).toBeNull();
    });
  });
}); 