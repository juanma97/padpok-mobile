import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@app/types';
import HomeScreen from '@app/screens/home/HomeScreen';
import MatchesScreen from '@app/screens/home/MatchesScreen';
import CreateMatchScreen from '@app/screens/home/CreateMatchScreen';
import MatchDetailsScreen from '@app/screens/home/MatchDetailsScreen';
import ProfileScreen from '@app/screens/home/ProfileScreen';
import RankingScreen from '@app/screens/home/RankingScreen';
import MedalsScreen from '@app/screens/home/MedalsScreen';
import NotificationsScreen from '@app/screens/home/NotificationsScreen';
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
      />
      <Stack.Screen 
        name="CreateMatch" 
        component={CreateMatchScreen}
      />
      <Stack.Screen 
        name="MatchDetails" 
        component={MatchDetailsScreen}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
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
      />
    </Stack.Navigator>
  );
};

export default HomeStack; 