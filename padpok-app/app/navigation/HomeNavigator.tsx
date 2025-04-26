import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import HomeScreen from '../screens/home/HomeScreen';
import MatchesScreen from '../screens/home/MatchesScreen';
import CreateMatchScreen from '../screens/home/CreateMatchScreen';
import MatchDetailsScreen from '../screens/home/MatchDetailsScreen';
import ProfileScreen from '../screens/home/ProfileScreen';
import RankingScreen from '../screens/home/RankingScreen';
import MedalsScreen from '../screens/home/MedalsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Matches" component={MatchesScreen} />
      <Stack.Screen name="CreateMatch" component={CreateMatchScreen} />
      <Stack.Screen name="MatchDetails" component={MatchDetailsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Ranking" component={RankingScreen} />
      <Stack.Screen name="Medals" component={MedalsScreen} />
    </Stack.Navigator>
  );
};

export default HomeNavigator; 