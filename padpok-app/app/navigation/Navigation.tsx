import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import AppBar from '../components/AppBar';
import { View, Text } from 'react-native';

// Auth Screens
import WelcomeScreen from '@app/screens/auth/WelcomeScreen';
import LoginScreen from '@app/screens/auth/LoginScreen';
import RegisterScreen from '@app/screens/auth/RegisterScreen';

// Main Screens
import MatchesScreen from '@app/screens/home/MatchesScreen';
import CreateMatchScreen from '@app/screens/home/CreateMatchScreen';
import ProfileScreen from '@app/screens/home/ProfileScreen';
import MatchDetailsScreen from '@app/screens/home/MatchDetailsScreen';
import RankingScreen from '@app/screens/home/RankingScreen';
import MedalsScreen from '@app/screens/home/MedalsScreen';
import NotificationsScreen from '@app/screens/home/NotificationsScreen';
import MatchChatScreen from '@app/screens/home/MatchChatScreen';
import MatchHistoryScreen from '@app/screens/MatchHistoryScreen';

// Types
import { AuthStackParamList, HomeTabsParamList, RootStackParamList } from '@app/types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeTab = createBottomTabNavigator<HomeTabsParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const HomeTabs = () => {
  const { user } = useAuth();

  return (
    <HomeTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Matches') {
            iconName = focused ? 'tennisball' : 'tennisball-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Ranking') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1e3a8a',
        tabBarInactiveTintColor: 'gray',
        header: ({ navigation, route, options }) => {
          // Lista de pantallas que deben mostrar el AppBar
          const screensWithAppBar = ['Matches', 'Ranking', 'Create', 'Profile'];
          
          // Solo mostrar AppBar en las pantallas especificadas
          if (screensWithAppBar.includes(route.name)) {
            return (
              <AppBar
                title={options.title || ''}
                showBackButton={false}
                onBackPress={() => navigation.goBack()}
              />
            );
          }
          return null;
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <HomeTab.Screen 
        name="Matches" 
        component={MatchesScreen} 
        options={{ 
          title: 'Partidos'
        }}
      />
      <HomeTab.Screen 
        name="Ranking" 
        component={RankingScreen} 
        options={{ 
          title: 'Ranking'
        }}
      />
      {user && (
        <>
          <HomeTab.Screen 
            name="Create" 
            component={CreateMatchScreen} 
            options={{ 
              title: 'Crear Partido'
            }}
          />
          <HomeTab.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ 
              title: 'Mi Perfil'
            }}
          />
        </>
      )}
    </HomeTab.Navigator>
  );
};

const Navigation = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={({ route }) => ({
          headerShown: false
        })}
      >
        {user ? (
          <RootStack.Screen 
            name="Home" 
            component={HomeTabs}
            options={{ headerShown: false }}
          />
        ) : (
          <RootStack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        )}
        <RootStack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen 
          name="MatchDetails" 
          component={MatchDetailsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen 
          name="MatchChat" 
          component={MatchChatScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen 
          name="MatchHistory" 
          component={MatchHistoryScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen 
          name="Medals" 
          component={MedalsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          options={{ headerShown: false }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="Matches" component={MatchesScreen} />
  </AuthStack.Navigator>
);

export default Navigation; 