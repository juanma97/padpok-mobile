import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeTabsParamList } from '@app/types/navigation';
import { View, StyleSheet } from 'react-native';
import MatchesScreen from '@app/screens/home/MatchesScreen';
import RankingScreen from '@app/screens/home/RankingScreen';
import CreateMatchScreen from '@app/screens/home/CreateMatchScreen';
import ProfileScreen from '@app/screens/home/ProfileScreen';
import GroupsScreen from '@app/screens/home/GroupsScreen';

const Tab = createBottomTabNavigator<HomeTabsParamList>();

const HexagonIcon = ({ focused }: { focused: boolean }) => (
  <View style={styles.hexagonContainer}>
    <View style={[styles.hexagon, focused && styles.hexagonActive]}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={focused ? "people" : "people-outline"} 
          size={32} 
          color={focused ? "#314E99" : "#666"} 
        />
      </View>
    </View>
  </View>
);

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Groups') {
            return <HexagonIcon focused={focused} />;
          }

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

const styles = StyleSheet.create({
  hexagonContainer: {
    position: 'absolute',
    bottom: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
  },
  hexagon: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#314E99',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  iconContainer: {
    transform: [{ rotate: '-45deg' }],
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexagonActive: {
    backgroundColor: '#f0f4ff',
    borderColor: '#1e3a8a',
  },
});

export default MainTabs; 