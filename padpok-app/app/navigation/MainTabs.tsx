import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import ProfileScreen from '@app/screens/home/ProfileScreen';

const Tab = createBottomTabNavigator();

// Componentes temporales para las tabs
const ExploreScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Explorar Partidos</Text>
  </View>
);

const CreateMatchScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Crear Partido</Text>
  </View>
);

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Explorar') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Crear') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Explorar" component={ExploreScreen} />
      <Tab.Screen name="Crear" component={CreateMatchScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs; 