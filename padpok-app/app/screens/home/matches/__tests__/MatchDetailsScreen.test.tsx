import { render, waitFor, act } from '@testing-library/react-native';
import MatchDetailsScreen from '../MatchDetailsScreen';

const mockRoute = {
  key: 'test-key',
  name: 'MatchDetails' as const,
  params: {
    matchId: 'test-match-id',
    match: {
      id: 'test-match-id',
      title: 'Partido de prueba',
      location: 'Pista Central',
      date: new Date(),
      level: 'Intermedio',
      ageRange: '18-35',
      playersNeeded: 4,
      playersJoined: ['test-user'],
      teams: {
        team1: ['test-user'],
        team2: []
      },
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
};

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn()
};

jest.mock('@app/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' }
  })
}));

jest.mock('@app/lib/matches', () => ({
  joinMatch: jest.fn(),
  leaveMatch: jest.fn(),
  getMatchUsers: jest.fn(async (uids: string[]) => {
    // Retorna un usuario de prueba para cada uid
    const users: { [key: string]: { username: string; gender: 'Masculino' | 'Femenino' } } = {};
    uids.forEach((uid: string) => {
      users[uid] = { username: 'Usuario de prueba', gender: 'Masculino' };
    });
    return users;
  })
}));

jest.mock('@app/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } }
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('MatchDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the basic match information', async () => {
    const { getByTestId } = render(
      <MatchDetailsScreen 
        route={mockRoute} 
        navigation={mockNavigation as any} 
      />
    );

    await waitFor(() => {
      expect(getByTestId('match-title')).toHaveTextContent('Partido de prueba');
      expect(getByTestId('match-location')).toHaveTextContent('Pista Central');
      expect(getByTestId('match-level')).toHaveTextContent('Intermedio');
      expect(getByTestId('match-age-range')).toHaveTextContent('18-35');
    });
  });

  it('shows the players count', async () => {
    const { getByTestId } = render(
      <MatchDetailsScreen 
        route={mockRoute} 
        navigation={mockNavigation as any} 
      />
    );

    await waitFor(() => {
      expect(getByTestId('players-count')).toHaveTextContent('1/4 jugadores');
    });
  });

  it('shows the join button when the user is not in the match', async () => {
    const mockRouteNotJoined = {
      ...mockRoute,
      params: {
        ...mockRoute.params,
        match: {
          ...mockRoute.params.match,
          playersJoined: []
        }
      }
    };

    const { getByTestId } = render(
      <MatchDetailsScreen 
        route={mockRouteNotJoined} 
        navigation={mockNavigation as any} 
      />
    );

    await waitFor(() => {
      expect(getByTestId('join-button')).toBeTruthy();
    });
  });

  it('shows the leave button when the user is in the match', async () => {
    // El usuario está unido pero NO es el creador
    const mockRouteJoinedNotCreator = {
      ...mockRoute,
      params: {
        ...mockRoute.params,
        match: {
          ...mockRoute.params.match,
          playersJoined: ['test-user'],
          createdBy: 'otro-usuario'
        }
      }
    };

    const { getByTestId } = render(
      <MatchDetailsScreen 
        route={mockRouteJoinedNotCreator} 
        navigation={mockNavigation as any} 
      />
    );

    await waitFor(() => {
      expect(getByTestId('leave-button')).toBeTruthy();
    });
  });

  it('shows the delete button when the user is the creator and only player', async () => {
    const { getByTestId } = render(
      <MatchDetailsScreen 
        route={mockRoute} 
        navigation={mockNavigation as any} 
      />
    );

    await waitFor(() => {
      expect(getByTestId('delete-button')).toBeTruthy();
    });
  });
}); 