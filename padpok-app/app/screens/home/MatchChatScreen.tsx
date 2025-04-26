import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@app/types';
import MatchChat from '@app/components/MatchChat';

type Props = NativeStackScreenProps<HomeStackParamList, 'MatchChat'>;

const MatchChatScreen: React.FC<Props> = ({ route }) => {
  const { matchId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <MatchChat matchId={matchId} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default MatchChatScreen; 