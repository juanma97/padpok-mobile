import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import AppBar from '../components/AppBar';

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

// Types
import { AuthStackParamList, HomeTabsParamList, RootStackParamList, HomeStackParamList } from '@app/types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeTab = createBottomTabNavigator<HomeTabsParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeNavigator = () => {
  const { user } = useAuth();

  return (
    <HomeStack.Navigator
      screenOptions={({ route }) => ({
        header: ({ navigation, route, options }) => (
          <AppBar title="padpok" />
        ),
      })}
    >
      <HomeStack.Screen 
        name="Home" 
        component={HomeTabs} 
      />
      <HomeStack.Screen 
        name="Medals" 
        component={MedalsScreen}
      />
      <HomeStack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ 
          headerShown: false,
          title: 'Notificaciones' 
        }}
      />
    </HomeStack.Navigator>
  );
};

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
        headerShown: true,
      })}
    >
      <HomeTab.Screen 
        name="Matches" 
        component={MatchesScreen} 
        options={{ 
          headerShown: false,
          title: 'Partidos' 
        }}
      />
      <HomeTab.Screen 
        name="Ranking" 
        component={RankingScreen as any} 
        options={{ headerShown: false, title: 'Ranking' }}
      />
      {user && (
        <>
          <HomeTab.Screen 
            name="Create" 
            component={CreateMatchScreen as any} 
            options={{ headerShown: false, title: 'Crear' }}
          />
          <HomeTab.Screen 
            name="Profile" 
            component={ProfileScreen as any} 
            options={{ headerShown: false, title: 'Perfil' }}
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
          header: ({ navigation, route, options }) => (
            <AppBar title="padpok" />
          ),
        })}
      >
        {user ? (
          <RootStack.Screen 
            name="Home" 
            component={HomeNavigator}
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
          name="MatchDetails" 
          component={MatchDetailsScreen}
          options={{ 
            headerShown: true 
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const AuthNavigator = () => (
  <AuthStack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen 
      name="Matches" 
      component={MatchesScreen} 
      options={{ headerShown: false }} 
    />
  </AuthStack.Navigator>
);

export default Navigation; 