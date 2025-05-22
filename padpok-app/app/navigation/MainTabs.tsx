import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeTabsParamList } from '@app/types/navigation';
import MatchesScreen from '@app/screens/home/MatchesScreen';
import RankingScreen from '@app/screens/home/RankingScreen';
import CreateMatchScreen from '@app/screens/home/CreateMatchScreen';
import ProfileScreen from '@app/screens/home/ProfileScreen';
import GroupsScreen from '@app/screens/home/GroupsScreen';

const Tab = createBottomTabNavigator<HomeTabsParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Matches':
              iconName = focused ? 'tennisball' : 'tennisball-outline';
              break;
            case 'Ranking':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'CreateMatch':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'Groups':
              iconName = focused ? 'people' : 'people-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#314E99',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{
          title: 'Partidos',
        }}
      />
      <Tab.Screen 
        name="Ranking" 
        component={RankingScreen}
        options={{
          title: 'Ranking',
        }}
      />
      <Tab.Screen 
        name="CreateMatch" 
        component={CreateMatchScreen}
        options={{
          title: 'Crear',
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsScreen}
        options={{
          title: 'Grupos',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs; 