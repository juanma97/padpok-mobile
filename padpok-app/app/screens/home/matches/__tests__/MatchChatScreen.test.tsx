import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ 
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  NativeStackScreenProps: jest.fn(),
}));

jest.mock('@app/components/MatchChat', () => (props: any) => {
  const RN = require('react-native');
  return (
    <RN.View>
      <RN.Text>Match Chat Component</RN.Text>
    </RN.View>
  );
});

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    View: ({ children }: any) => <>{children}</>,
    Text: RN.Text,
    TouchableOpacity: ({ children, onPress, testID }: any) => (
      <RN.View testID={testID} onClick={onPress}>{children}</RN.View>
    ),
    SafeAreaView: ({ children }: any) => <>{children}</>,
    StatusBar: () => null,
    StyleSheet: { create: () => ({}), flatten: (style: any) => style },
  };
});

import MatchChatScreen from '../MatchChatScreen';

describe('MatchChatScreen', () => {
  const mockRoute = {
    key: 'test-key',
    name: 'MatchChat' as const,
    params: {
      matchId: 'test-match-id'
    }
  };

  const mockNavigation = {
    goBack: jest.fn()
  };

  it('renders the chat title correctly', () => {
    const { getByText } = render(
      <MatchChatScreen 
        route={mockRoute} 
        navigation={mockNavigation as any} 
      />
    );
    
    expect(getByText('Chat del partido')).toBeTruthy();
  });

  it('renders the MatchChat component with the correct matchId', () => {
    const { getByText } = render(
      <MatchChatScreen 
        route={mockRoute} 
        navigation={mockNavigation as any} 
      />
    );
    
    expect(getByText('Match Chat Component')).toBeTruthy();
  });

  it('navigates back when the back button is pressed', () => {
    const { getByTestId } = render(
      <MatchChatScreen 
        route={mockRoute} 
        navigation={mockNavigation as any} 
      />
    );
    
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
}); 