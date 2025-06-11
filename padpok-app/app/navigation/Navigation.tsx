import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import AppBar from '../components/AppBar';
import { View, Animated, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '@app/constants/theme';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

// Auth Screens
import WelcomeScreen from '@app/screens/auth/WelcomeScreen/WelcomeScreen';
import LoginScreen from '@app/screens/auth/LoginScreen/LoginScreen';
import RegisterScreen from '@app/screens/auth/RegisterScreen/RegisterScreen';

// Matches Screens
import MatchesScreen from '@/app/screens/home/matches/MatchesScreen';
import CreateMatchScreen from '@/app/screens/home/matches/CreateMatchScreen';
import MatchDetailsScreen from '@/app/screens/home/matches/MatchDetailsScreen';
import MatchChatScreen from '@/app/screens/home/matches/MatchChatScreen';
import MatchHistoryScreen from '@app/screens/home/matches/MatchHistoryScreen';

// Groups Screens
import GroupsScreen from '@/app/screens/home/groups/GroupsScreen';
import CreateGroupScreen from '@/app/screens/home/groups/CreateGroupScreen';
import GroupDetailsScreen from '../screens/home/groups/GroupDetailsScreen';

// Profile Screens
import ProfileScreen from '@/app/screens/home/profile/ProfileScreen';

// Ranking Screens
import RankingScreen from '@/app/screens/home/ranking/RankingScreen';

// Medals Screens
import MedalsScreen from '@/app/screens/home/medals/MedalsScreen';

// Notifications Screens
import NotificationsScreen from '@/app/screens/home/notifications/NotificationsScreen';

// Types
import { AuthStackParamList, HomeTabsParamList, RootStackParamList } from '@app/types/navigation';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeTab = createBottomTabNavigator<HomeTabsParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const HomeTabs = () => {
  const { user } = useAuth();

  // Animación de escala para el icono activo
  const getTabBarIcon = (
    route: RouteProp<HomeTabsParamList>,
    focused: boolean,
    color: string,
    size: number
  ) => {
    const iconName = (() => {
      switch (route.name) {
        case 'Matches': return focused ? 'tennisball' : 'tennisball-outline';
        case 'Ranking': return focused ? 'trophy' : 'trophy-outline';
        case 'CreateMatch': return focused ? 'add-circle' : 'add-circle-outline';
        case 'Profile': return focused ? 'person' : 'person-outline';
        case 'Groups': return focused ? 'people' : 'people-outline';
        default: return 'help-outline';
      }
    })();
    // Animación de escala
    const scale = focused ? 1.18 : 1;
    return (
      <Animated.View style={{ transform: [{ scale }], shadowColor: focused ? COLORS.primary : 'transparent', shadowOffset: { width: 0, height: 2 }, shadowOpacity: focused ? 0.18 : 0, shadowRadius: focused ? 8 : 0, elevation: focused ? 4 : 0 }}>
        <Ionicons name={iconName as any} size={size + (focused ? 4 : 0)} color={color} />
      </Animated.View>
    );
  };

  return (
    <HomeTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => getTabBarIcon(route, focused, color, size),
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        header: ({ navigation, route, options }) => {
          const screensWithAppBar = ['Matches', 'Ranking', 'CreateMatch', 'Profile', 'Groups'];
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
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          height: 78,
          paddingBottom: SPACING.sm,
          paddingTop: SPACING.xs,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#222',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.28,
          shadowRadius: 16,
          elevation: 16,
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 6,
          minHeight: 44,
          minWidth: 44,
        },
        tabBarButton: (props: BottomTabBarButtonProps) => {
          // Fondo bump para el tab activo
          const { accessibilityState, children, onPress, onLongPress, ...rest } = props;
          const focused = accessibilityState?.selected;
          return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 8,
                  right: 8,
                  height: 44,
                  backgroundColor: COLORS.light,
                  borderRadius: 16,
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 2,
                  zIndex: 0,
                }} />
              )}
              <TouchableOpacity
                activeOpacity={0.85}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44, zIndex: 1 }}
                onPress={onPress ?? undefined}
                onLongPress={onLongPress ?? undefined}
              >
                {children}
              </TouchableOpacity>
            </View>
          );
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
      <HomeTab.Screen 
        name="CreateMatch" 
        component={CreateMatchScreen} 
        options={{ 
          title: 'Crear Partido'
        }}
      />
      <HomeTab.Screen 
        name="Groups" 
        component={GroupsScreen} 
        options={{ 
          title: 'Grupos'
        }}
      />
      <HomeTab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Mi Perfil'
        }}
      />
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
        {!user ? (
          <RootStack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <RootStack.Screen 
              name="Home" 
              component={HomeTabs}
              options={{ headerShown: false }}
            />
            <RootStack.Screen 
              name="CreateGroup" 
              component={CreateGroupScreen}
              options={{ headerShown: false }}
            />
          </>
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
          name="GroupDetails" 
          component={GroupDetailsScreen}
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