import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { AuthStackParamList, HomeTabsParamList, CreateStackParamList } from '@app/types';

// Auth Screens
import WelcomeScreen from '@app/screens/auth/WelcomeScreen';
import LoginScreen from '@app/screens/auth/LoginScreen';
import RegisterScreen from '@app/screens/auth/RegisterScreen';

// Main Screens
import MatchesScreen from '@app/screens/home/MatchesScreen';
import CreateMatchScreen from '@app/screens/home/CreateMatchScreen';
import ProfileScreen from '@app/screens/home/ProfileScreen';

// Stacks
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeTab = createBottomTabNavigator<HomeTabsParamList>();
const CreateStack = createNativeStackNavigator<CreateStackParamList>();

// Navigation Group Components
const AuthNavigator = () => (
  <AuthStack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const CreateNavigator = () => (
  <CreateStack.Navigator>
    <CreateStack.Screen 
      name="CreateMatch" 
      component={CreateMatchScreen} 
      options={{ headerTitle: 'Crear partido' }}
    />
  </CreateStack.Navigator>
);

const HomeNavigator = () => (
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
      options={{ headerTitle: 'Partidos', title: 'Partidos' }}
    />
    <HomeTab.Screen 
      name="Create" 
      component={CreateNavigator} 
      options={{ headerShown: false, title: 'Crear' }}
    />
    <HomeTab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ headerTitle: 'Mi Perfil', title: 'Perfil' }}
    />
  </HomeTab.Navigator>
);

const Navigation = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null; // o un componente de carga
  }

  return (
    <NavigationContainer>
      {user ? <HomeNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default Navigation; 