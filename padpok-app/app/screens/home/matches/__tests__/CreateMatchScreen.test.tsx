import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@app/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } },
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
  serverTimestamp: jest.fn(),
  increment: jest.fn(),
}));

jest.mock('@app/components/CustomDialog', () => (props: any) => {
  const RN = require('react-native');
  return props.visible ? <>{props.title && <RN.Text>{props.title}</RN.Text>}{props.message && <RN.Text>{props.message}</RN.Text>}</> : null;
});

jest.mock('@app/components/SegmentedControl', () => (props: any) => <>{props.options.map((o: string) => <button key={o} onClick={() => props.onChange(o)}>{o}</button>)}</>);

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    View: ({ children }: any) => <>{children}</>,
    Text: RN.Text,
    SafeAreaView: ({ children }: any) => <>{children}</>,
    StatusBar: () => null,
    StyleSheet: { create: () => ({}), flatten: (style: any) => style },
    ScrollView: ({ children }: any) => <>{children}</>,
    TouchableOpacity: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    TextInput: RN.TextInput,
    ActivityIndicator: () => null,
    Platform: { OS: 'ios' },
  };
});

import CreateMatchScreen from '../CreateMatchScreen';

describe('CreateMatchScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<CreateMatchScreen navigation={{ navigate: jest.fn() } as any} route={{} as any} />);
  });

  it('shows error if trying to create match without title', async () => {
    const { getByText } = render(<CreateMatchScreen navigation={{ navigate: jest.fn() } as any} route={{} as any} />);
    fireEvent.press(getByText('Crear Partido'));
    await waitFor(() => {
      expect(getByText('El título es obligatorio')).toBeTruthy();
    });
  });

  it('shows error if trying to create match without location', async () => {
    const { getByText, getByPlaceholderText } = render(<CreateMatchScreen navigation={{ navigate: jest.fn() } as any} route={{} as any} />);
    const titleInput = getByPlaceholderText('Ej: Partido amistoso nivel medio');
    fireEvent.changeText(titleInput, 'Test Match');
    fireEvent.press(getByText('Crear Partido'));
    await waitFor(() => {
      expect(getByText('La ubicación es obligatoria')).toBeTruthy();
    });
  });

  it('shows error if trying to create match with past date', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2000-01-01T00:00:00Z').getTime());
    const { getByText, getByPlaceholderText } = render(<CreateMatchScreen navigation={{ navigate: jest.fn() } as any} route={{} as any} />);
    const titleInput = getByPlaceholderText('Ej: Partido amistoso nivel medio');
    const locationInput = getByPlaceholderText('Ej: Club Deportivo Norte - Pista 3');
    fireEvent.changeText(titleInput, 'Test Match');
    fireEvent.changeText(locationInput, 'Test Location');
    fireEvent.press(getByText('Crear Partido'));
    await waitFor(() => {
      expect(getByText('La fecha y hora del partido no pueden ser anteriores al momento actual')).toBeTruthy();
    });
  });

  it('shows success dialog after creating match', async () => {
    // Mock global Date para que new Date() y Date.now() devuelvan una fecha futura
    const RealDate = Date;
    const futureDate = new RealDate('2050-01-01T00:00:00Z');
    global.Date = class extends RealDate {
      constructor(...args: any[]) {
        super(...args);
        if (args.length === 0) {
          return futureDate;
        }
      }
      static now() {
        return futureDate.getTime();
      }
    } as any;

    const { getByText, getByPlaceholderText } = render(<CreateMatchScreen navigation={{ navigate: jest.fn() } as any} route={{} as any} />);
    const titleInput = getByPlaceholderText('Ej: Partido amistoso nivel medio');
    const locationInput = getByPlaceholderText('Ej: Club Deportivo Norte - Pista 3');
    fireEvent.changeText(titleInput, 'Test Match');
    fireEvent.changeText(locationInput, 'Test Location');
    fireEvent.press(getByText('Crear Partido'));
    await waitFor(() => {
      expect(getByText('¡Partido creado!')).toBeTruthy();
    });

    // Restaurar Date original
    global.Date = RealDate;
  });
}); 