import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@app/types';
import HomeScreen from '@app/screens/home/HomeScreen';
import MatchesScreen from '@app/screens/home/MatchesScreen';
import CreateMatchScreen from '@app/screens/home/CreateMatchScreen';
import MatchDetailsScreen from '@app/screens/home/MatchDetailsScreen';
import MatchChatScreen from '@app/screens/home/MatchChatScreen';
import MatchHistoryScreen from '@app/screens/home/MatchHistoryScreen';
import ProfileScreen from '@app/screens/home/ProfileScreen';
import RankingScreen from '@app/screens/home/RankingScreen';
import MedalsScreen from '@app/screens/home/MedalsScreen';
import NotificationsScreen from '@app/screens/home/NotificationsScreen';
import FollowersScreen from '@app/screens/FollowersScreen';
import FollowingScreen from '@app/screens/FollowingScreen';
import AppBar from '@app/components/AppBar';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: ({ navigation, route, options }) => (
          <AppBar
            title={options.title}
            showBackButton={navigation.canGoBack()}
            onBackPress={() => navigation.goBack()}
          />
        ),
      })}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Stack.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateMatch" 
        component={CreateMatchScreen}
      />
      <Stack.Screen 
        name="MatchDetails" 
        component={MatchDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MatchChat" 
        component={MatchChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MatchHistory" 
        component={MatchHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Followers" 
        component={FollowersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Following" 
        component={FollowingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Ranking" 
        component={RankingScreen}
      />
      <Stack.Screen 
        name="Medals" 
        component={MedalsScreen}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ headerShown: }}
      />
    </Stack.Navigator>
  );
};

export default HomeStack; 