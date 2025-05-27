import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MatchCard from '@app/components/MatchCard';
import { useNavigation } from '@react-navigation/native';
import MatchChat from '@app/components/MatchChat';

// Datos ficticios para el grupo
const group = {
  id: '1',
  name: 'Padel Friends',
  members: 10,
  isAdmin: true,
};

// Datos ficticios de partidos del grupo
const groupMatches = [
  {
    id: 'm1',
    title: 'Partido de viernes',
    date: new Date(),
    location: 'Club Padel Norte',
    playersJoined: [1, 2, 3],
    playersNeeded: 4,
    ageRange: '18-35',
    level: 'Intermedio',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'm2',
    title: 'Sábado por la tarde',
    date: new Date(Date.now() + 86400000),
    location: 'Padel Sur',
    playersJoined: [1, 2],
    playersNeeded: 4,
    ageRange: '18-40',
    level: 'Avanzado',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Datos ficticios de ranking interno
const groupRanking = [
  { id: 'u1', username: 'Juan', stats: { points: 120, matchesPlayed: 10, wins: 7, losses: 3 } },
  { id: 'u2', username: 'Ana', stats: { points: 110, matchesPlayed: 12, wins: 6, losses: 6 } },
  { id: 'u3', username: 'Luis', stats: { points: 90, matchesPlayed: 8, wins: 5, losses: 3 } },
  { id: 'u4', username: 'Marta', stats: { points: 80, matchesPlayed: 7, wins: 4, losses: 3 } },
];

// Datos ficticios de chat
const groupChat = [
  { id: 'c1', user: 'Juan', message: '¿Quién viene el viernes?', time: '10:00' },
  { id: 'c2', user: 'Ana', message: '¡Yo me apunto!', time: '10:01' },
  { id: 'c3', user: 'Luis', message: '¿A qué hora es?', time: '10:02' },
];

const TABS = ['Partidos', 'Ranking', 'Chat'];

export default function GroupDetailsScreen() {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('Partidos');
  const [chatInput, setChatInput] = useState('');

  // Renderizado de partidos
  const renderMatch = ({ item }: any) => (
    <TouchableOpacity onPress={() => {}}>
      <MatchCard match={item} />
    </TouchableOpacity>
  );

  // Renderizado de ranking
  const renderRanking = ({ item, index }: any) => {
    const isTopThree = index < 3;
    const medalColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32';
    return (
      <View style={styles.userCard}>
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Ionicons name="medal" size={24} color={medalColor} />
          ) : (
            <Text style={styles.rankNumber}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={16} color="#1e3a8a" />
              <Text style={styles.statText}>{item.stats.points} pts</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="tennisball" size={16} color="#1e3a8a" />
              <Text style={styles.statText}>{item.stats.matchesPlayed} partidos</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={16} color="#1e3a8a" />
              <Text style={styles.statText}>{item.stats.wins} victorias</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {/* Header del grupo */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={styles.headerRow}>
              <Ionicons name="people-outline" size={16} color="#1e3a8a" />
              <Text style={styles.membersText}>{group.members} miembros</Text>
              {group.isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminText}>Admin</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabSelected]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextSelected]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contenido según tab */}
        <View style={styles.contentContainer}>
          {selectedTab === 'Partidos' && (
            <FlatList
              data={groupMatches}
              renderItem={renderMatch}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay partidos en este grupo.</Text>}
            />
          )}
          {selectedTab === 'Ranking' && (
            <FlatList
              data={groupRanking}
              renderItem={renderRanking}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay ranking aún.</Text>}
            />
          )}
          {selectedTab === 'Chat' && (
            <MatchChat matchId={group.id} />
          )}
        </View>

        {/* Botón flotante para crear partido solo en la pestaña de Partidos */}
        {selectedTab === 'Partidos' && (
          <TouchableOpacity style={styles.fab} onPress={() => {}}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  membersText: {
    fontSize: 14,
    color: '#1e3a8a',
    marginLeft: 4,
  },
  adminBadge: {
    backgroundColor: '#314E99',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  adminText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    margin: 16,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabSelected: {
    backgroundColor: '#1e3a8a',
  },
  tabText: {
    color: '#1e3a8a',
    fontWeight: '600',
    fontSize: 16,
  },
  tabTextSelected: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#1e3a8a',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  // Ranking styles reutilizados
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30,58,138,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#4b5563',
  },
  // Chat styles
  chatContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chatListContent: {
    padding: 16,
    paddingBottom: 60,
  },
  chatMessage: {
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 10,
  },
  chatUser: {
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 2,
  },
  chatText: {
    fontSize: 15,
    color: '#222',
  },
  chatTime: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
  },
  chatInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    backgroundColor: 'transparent',
    padding: 0,
  },
  sendButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
  },
}); 