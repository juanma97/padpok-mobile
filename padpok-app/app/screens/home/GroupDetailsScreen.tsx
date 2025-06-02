import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MatchCard from '@app/components/MatchCard';
import { useNavigation, useRoute } from '@react-navigation/native';
import MatchChat from '@app/components/MatchChat';
import { doc, deleteDoc, getDoc, serverTimestamp, updateDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import CustomDialog from '@app/components/CustomDialog';
import { useAuth } from '@app/lib/AuthContext';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Match, Score } from '@app/types/models';
import { getMatchUsers } from '@app/lib/matches';
import TeamSelectionModal from '@app/components/TeamSelectionModal';
import ScoreForm from '@app/components/ScoreForm';


const TABS = ['Partidos', 'Ranking', 'Chat'];

export default function GroupDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { groupId } = route.params as any;
  const [selectedTab, setSelectedTab] = useState('Partidos');
  type GroupType = { id: string; ranking?: Record<string, any>; matches?: any[]; members?: string[]; admin?: string; name?: string; [key: string]: any };
  const [group, setGroup] = useState<GroupType | null>(null);
  const [dialog, setDialog] = useState({ visible: false, title: '', message: '', onConfirm: () => {}, onClose: () => {} });
  const [loading, setLoading] = useState(true);
  const [usernames, setUsernames] = useState<{ [id: string]: string }>({});
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [creating, setCreating] = useState(false);
  const [matchForm, setMatchForm] = useState({
    title: '',
    location: '',
    level: 'Intermedio',
    description: '',
    date: new Date(),
    ageRange: 'todas las edades',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [userInfos, setUserInfos] = useState<{ [key: string]: { username: string; gender?: 'Masculino' | 'Femenino' } }>({});
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      const ref = doc(db, 'groups', groupId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const groupData: GroupType = { id: snap.id, ...snap.data() };
        setGroup(groupData);
        // Obtener usernames de los ids del ranking
        const rankingIds = groupData.ranking ? Object.keys(groupData.ranking) : [];
        const usernamesObj: { [id: string]: string } = {};
        for (const uid of rankingIds) {
          const userSnap = await getDoc(doc(db, 'users', uid));
          usernamesObj[uid] = userSnap.exists() ? userSnap.data().username || uid : uid;
        }
        setUsernames(usernamesObj);
      }
      setLoading(false);
    };
    fetchGroup();
  }, [groupId]);

  const handleDeleteGroup = () => {
    setDialog({
      visible: true,
      title: 'Eliminar grupo',
      message: '¿Estás seguro de que quieres eliminar este grupo? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setDialog({ ...dialog, visible: false });
        await deleteDoc(doc(db, 'groups', groupId));
        navigation.goBack();
      },
      onClose: () => setDialog({ ...dialog, visible: false })
    });
  };

  const handleCreateMatchInGroup = async () => {
    // Validación básica
    if (!matchForm.title.trim() || !matchForm.location.trim()) {
      setDialog({
        visible: true,
        title: 'Error',
        message: 'El título y la ubicación son obligatorios',
        onConfirm: () => setDialog({ ...dialog, visible: false }),
        onClose: () => setDialog({ ...dialog, visible: false })
      });
      return;
    }
    setCreating(true);
    try {
      const newMatch = {
        id: Date.now().toString(),
        ...matchForm,
        playersNeeded: 4,
        playersJoined: [user?.uid],
        createdBy: user?.uid,
        admin: user?.uid,
        createdAt: new Date(),
        teams: {
          team1: [user?.uid],
          team2: []
        }
      };
      // Añadir el partido al array matches del grupo
      const groupRef = firestoreDoc(db, 'groups', groupId);
      const updatedMatches = Array.isArray(group?.matches) ? [...group.matches, newMatch] : [newMatch];
      await updateDoc(groupRef, { matches: updatedMatches, updatedAt: serverTimestamp() });
      setShowCreateMatch(false);
      setMatchForm({
        title: '',
        location: '',
        level: 'Intermedio',
        description: '',
        date: new Date(),
        ageRange: 'todas las edades',
      });
      // Recargar grupo
      const snap = await getDoc(groupRef);
      if (snap.exists()) {
        const groupData: GroupType = { id: snap.id, ...snap.data() };
        setGroup(groupData);
      }
    } catch (error) {
      setDialog({
        visible: true,
        title: 'Error',
        message: 'No se pudo crear el partido. Inténtalo de nuevo.',
        onConfirm: () => setDialog({ ...dialog, visible: false }),
        onClose: () => setDialog({ ...dialog, visible: false })
      });
    } finally {
      setCreating(false);
    }
  };

  // 1. Función para actualizar un partido dentro del grupo en Firestore
  type GroupMatchUpdate = (matchId: string, updater: (match: Match) => Match) => Promise<void>;
  const updateGroupMatch: GroupMatchUpdate = async (matchId, updater) => {
    console.log('updateGroupMatch', matchId, updater);
    if (!group) return;
    const groupRef = firestoreDoc(db, 'groups', group.id);
    const matches = Array.isArray(group.matches) ? group.matches : [];
    const idx = matches.findIndex((m: Match) => m.id === matchId);
    if (idx === -1) return;
    const updatedMatch = updater(matches[idx]);
    const updatedMatches = [...matches];
    updatedMatches[idx] = updatedMatch;
    await updateDoc(groupRef, { matches: updatedMatches, updatedAt: serverTimestamp() });
    // Refrescar grupo local
    const snap = await getDoc(groupRef);
    if (snap.exists()) {
      const groupData: GroupType = { id: snap.id, ...snap.data() };
      setGroup(groupData);
      // Actualizar el partido seleccionado si es el mismo
      if (selectedMatch && selectedMatch.id === matchId) {
        setSelectedMatch(updatedMatch);
        setIsJoined(!!user && updatedMatch.playersJoined.includes(user.uid));
        // Actualizar userInfos para los jugadores actuales
        if (updatedMatch.playersJoined.length > 0) {
          getMatchUsers(updatedMatch.playersJoined).then(setUserInfos);
        } else {
          setUserInfos({});
        }
      }
    }
  };

  // Añadir función para recargar el grupo y el partido seleccionado desde Firestore
  const reloadGroupAndSelectedMatch = async (matchId: string) => {
    if (!group) return;
    const groupRef = firestoreDoc(db, 'groups', group.id);
    const snap = await getDoc(groupRef);
    if (snap.exists()) {
      const groupData: GroupType = { id: snap.id, ...snap.data() };
      setGroup(groupData);
      const match = (groupData.matches || []).find((m: Match) => m.id === matchId);
      if (match) {
        setSelectedMatch(match);
        setIsJoined(!!user && match.playersJoined.includes(user.uid));
        if (match.playersJoined.length > 0) {
          getMatchUsers(match.playersJoined).then(setUserInfos);
        } else {
          setUserInfos({});
        }
      }
    }
  };

  // 2. Función para unirse a un partido en grupo
  const handleJoinGroupMatch = async (team: 'team1' | 'team2', position: 'first' | 'second') => {
    if (!user || !selectedMatch) return;
    setMatchLoading(true);
    try {
      await updateGroupMatch(selectedMatch.id, (match) => {
        // Evitar duplicados
        if (match.playersJoined.includes(user.uid)) return match;
        const newTeams = {
          team1: team === 'team1' ? [...(match.teams?.team1 || []), user.uid] : (match.teams?.team1 || []),
          team2: team === 'team2' ? [...(match.teams?.team2 || []), user.uid] : (match.teams?.team2 || [])
        };
        return {
          ...match,
          playersJoined: [...match.playersJoined, user.uid],
          teams: newTeams
        };
      });
      setShowTeamSelection(false);
      await reloadGroupAndSelectedMatch(selectedMatch.id);
    } catch (error) {
      setDialog({
        visible: true,
        title: 'Error',
        message: 'No se pudo unir al partido',
        onConfirm: () => setDialog({ ...dialog, visible: false }),
        onClose: () => setDialog({ ...dialog, visible: false })
      });
    } finally {
      setMatchLoading(false);
    }
  };

  // 3. Función para abandonar un partido en grupo
  const handleLeaveGroupMatch = async () => {
    if (!user || !selectedMatch) return;
    setMatchLoading(true);
    try {
      await updateGroupMatch(selectedMatch.id, (match) => {
        return {
          ...match,
          playersJoined: match.playersJoined.filter((id: string) => id !== user.uid),
          teams: {
            team1: (match.teams?.team1 || []).filter((id: string) => id !== user.uid),
            team2: (match.teams?.team2 || []).filter((id: string) => id !== user.uid)
          }
        };
      });
      await reloadGroupAndSelectedMatch(selectedMatch.id);
    } catch (error) {
      setDialog({
        visible: true,
        title: 'Error',
        message: 'No se pudo abandonar el partido',
        onConfirm: () => setDialog({ ...dialog, visible: false }),
        onClose: () => setDialog({ ...dialog, visible: false })
      });
    } finally {
      setMatchLoading(false);
    }
  };
  // 4. Función para añadir resultado a un partido en grupo
  const handleScoreGroupMatch = async (newScore: Score) => {
    console.log('handleScoreGroupMatch', newScore);
    if (!selectedMatch) return;
    setMatchLoading(true);
    try {
      await updateGroupMatch(selectedMatch.id, (match) => ({ ...match, score: newScore }));
      setShowScoreForm(false);
    } catch (error) {
      setDialog({
        visible: true,
        title: 'Error',
        message: 'No se pudo guardar el resultado',
        onConfirm: () => setDialog({ ...dialog, visible: false }),
        onClose: () => setDialog({ ...dialog, visible: false })
      });
    } finally {
      setMatchLoading(false);
    }
  };

  // 5. Función para eliminar un partido del grupo
  const deleteGroupMatch = async (matchId: string) => {
    if (!group) return;
      const groupRef = firestoreDoc(db, 'groups', group.id);
      const matches = Array.isArray(group.matches) ? group.matches : [];
      const updatedMatches = matches.filter((m: Match) => m.id !== matchId);
      await updateDoc(groupRef, { matches: updatedMatches, updatedAt: serverTimestamp() });
      const snap = await getDoc(groupRef);
      if (snap.exists()) {
        const groupData: GroupType = { id: snap.id, ...snap.data() };
        setGroup(groupData);
      }
      setShowMatchDetails(false);
  };

  // Pull-to-refresh para recargar grupo y usernames
  const refreshGroup = async () => {
    setRefreshing(true);
    const ref = doc(db, 'groups', groupId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const groupData: GroupType = { id: snap.id, ...snap.data() };
      setGroup(groupData);
      // Recargar usernames del ranking
      const rankingIds = groupData.ranking ? Object.keys(groupData.ranking) : [];
      const usernamesObj: { [id: string]: string } = {};
      for (const uid of rankingIds) {
        const userSnap = await getDoc(doc(db, 'users', uid));
        usernamesObj[uid] = userSnap.exists() ? userSnap.data().username || uid : uid;
      }
      setUsernames(usernamesObj);
    }
    setRefreshing(false);
  };

  // Renderizado de partidos
  const renderMatch = ({ item }: { item: Match }) => (
    <TouchableOpacity onPress={() => {
      setSelectedMatch(item);
      setShowMatchDetails(true);
      setIsJoined(!!user && item.playersJoined.includes(user.uid));
      // Cargar info de usuarios
      if (item.playersJoined.length > 0) {
        getMatchUsers(item.playersJoined).then(setUserInfos);
      } else {
        setUserInfos({});
      }
    }}>
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
          <Text style={styles.username}>{usernames[item.id] || item.id}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={16} color="#1e3a8a" />
              <Text style={styles.statText}>{item.points} pts</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="tennisball" size={16} color="#1e3a8a" />
              <Text style={styles.statText}>{item.matchesPlayed} partidos</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={16} color="#1e3a8a" />
              <Text style={styles.statText}>{item.wins} victorias</Text>
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
            <Text style={styles.groupName}>{group?.name}</Text>
            <View style={styles.headerRow}>
              <Ionicons name="people-outline" size={16} color="#1e3a8a" />
              <Text style={styles.membersText}>{((group?.members?.length || 0) + 1)} miembros</Text>
              {group && group.admin === user?.uid && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminText}>Admin</Text>
                </View>
              )}
            </View>
          </View>
          {group && group.admin === user?.uid && (
            <TouchableOpacity onPress={handleDeleteGroup} style={{ marginLeft: 16 }}>
              <Ionicons name="trash" size={22} color="#e11d48" />
            </TouchableOpacity>
          )}
          {/* Icono para salir del grupo si NO es admin */}
          {group && group.admin !== user?.uid && Array.isArray(group.members) && user?.uid && group.members.includes(user.uid) && (
            <TouchableOpacity
              onPress={async () => {
                if (!user?.uid || !Array.isArray(group.members)) return;
                // Eliminar user.uid del array de members en Firestore
                const groupRef = firestoreDoc(db, 'groups', group.id);
                const updatedMembers = group.members.filter((id: string) => id !== user.uid);
                await updateDoc(groupRef, { members: updatedMembers });
                // Navegar a la pantalla de grupos y forzar refresh
                navigation.navigate('Groups', { refresh: true });
              }}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="exit-outline" size={22} color="#e11d48" />
            </TouchableOpacity>
          )}
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
              data={
                Array.isArray(group?.matches)
                  ? group.matches.filter(m => {
                      let matchDate;
                      if (m.date instanceof Date) {
                        matchDate = m.date;
                      } else if (m.date && typeof m.date.toDate === 'function') {
                        matchDate = m.date.toDate();
                      } else if (m.date && typeof m.date === 'object' && 'seconds' in m.date) {
                        // Firestore Timestamp en formato { seconds, nanoseconds }
                        matchDate = new Date(m.date.seconds * 1000);
                      } else if (typeof m.date === 'string' || typeof m.date === 'number') {
                        matchDate = new Date(m.date);
                      } else {
                        matchDate = new Date();
                      }
                      return matchDate >= new Date();
                    })
                  : []
              }
              renderItem={renderMatch}
              keyExtractor={(item, index) => item.id ? String(item.id) : `match-${index}`}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay partidos en este grupo.</Text>}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refreshGroup}
                  colors={['#1e3a8a']}
                  tintColor="#1e3a8a"
                />
              }
            />
          )}
          {selectedTab === 'Ranking' && (
            <FlatList
              data={group ? Object.entries(group.ranking ?? {}).map(([id, stats]) => ({ id, ...(stats as any) })) : []}
              renderItem={renderRanking}
              keyExtractor={item => String(item.id || '')}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay ranking aún.</Text>}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refreshGroup}
                  colors={['#1e3a8a']}
                  tintColor="#1e3a8a"
                />
              }
            />
          )}
          {selectedTab === 'Chat' && group?.id && (
            <MatchChat matchId={group.id} />
          )}
        </View>

        {/* Botón flotante para crear partido solo en la pestaña de Partidos */}
        {selectedTab === 'Partidos' && (
          <>
            <TouchableOpacity style={styles.fab} onPress={() => setShowCreateMatch(true)}>
              <Ionicons name="calendar-outline" size={28} color="#fff" />
            </TouchableOpacity>
            <Modal isVisible={showCreateMatch} onBackdropPress={() => setShowCreateMatch(false)}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '90%', justifyContent: 'flex-start' }}>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 18, color: '#1e3a8a', textAlign: 'center' }}>Crear Partido en el Grupo</Text>
                  {/* Título */}
                  <Text style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: 6 }}>Título del partido *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Partido amistoso nivel medio"
                    value={matchForm.title}
                    onChangeText={text => setMatchForm(f => ({ ...f, title: text }))}
                    placeholderTextColor="#999"
                  />
                  {/* Ubicación */}
                  <Text style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: 6, marginTop: 8 }}>Ubicación *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Club Deportivo Norte - Pista 3"
                    value={matchForm.location}
                    onChangeText={text => setMatchForm(f => ({ ...f, location: text }))}
                    placeholderTextColor="#999"
                  />
                  {/* Descripción */}
                  <Text style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: 6, marginTop: 8 }}>Descripción</Text>
                  <TextInput
                    style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                    placeholder="Añade detalles adicionales..."
                    value={matchForm.description}
                    onChangeText={text => setMatchForm(f => ({ ...f, description: text }))}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#999"
                  />
                  {/* Nivel */}
                  <Text style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: 6, marginTop: 8 }}>Nivel *</Text>
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    {['Principiante', 'Intermedio', 'Avanzado'].map(option => (
                      <TouchableOpacity
                        key={option}
                        style={{
                          flex: 1,
                          backgroundColor: matchForm.level === option ? '#1e3a8a' : '#e5e7eb',
                          padding: 10,
                          borderRadius: 8,
                          marginHorizontal: 2
                        }}
                        onPress={() => setMatchForm(f => ({ ...f, level: option }))}
                      >
                        <Text style={{ color: matchForm.level === option ? '#fff' : '#1e3a8a', textAlign: 'center' }}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* Fecha */}
                  <Text style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: 6, marginTop: 8 }}>Fecha y hora *</Text>
                  <TouchableOpacity
                    style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: matchForm.date ? '#222' : '#999' }}>
                      {matchForm.date instanceof Date
                        ? matchForm.date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                        : 'Selecciona la fecha'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <View style={{ backgroundColor: '#f5f5f5', borderRadius: 12, padding: 8, marginVertical: 8 }}>
                      <DateTimePicker
                        value={matchForm.date || new Date()}
                        mode="date"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) {
                            const currentTime = matchForm.date || new Date();
                            selectedDate.setHours(currentTime.getHours());
                            selectedDate.setMinutes(currentTime.getMinutes());
                            setMatchForm(f => ({ ...f, date: selectedDate }));
                            setTimeout(() => setShowTimePicker(true), 300);
                          }
                        }}
                        minimumDate={new Date()}
                        display="default"
                      />
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={{ color: matchForm.date ? '#222' : '#999' }}>
                      {matchForm.date instanceof Date
                        ? matchForm.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                        : 'Selecciona la hora'}
                    </Text>
                    <Ionicons name="time-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  {showTimePicker && (
                    <View style={{ backgroundColor: '#f5f5f5', borderRadius: 12, padding: 8, marginVertical: 8 }}>
                      <DateTimePicker
                        value={matchForm.date || new Date()}
                        mode="time"
                        is24Hour={true}
                        onChange={(event, selectedTime) => {
                          setShowTimePicker(false);
                          if (selectedTime) {
                            const newDate = new Date(matchForm.date || new Date());
                            newDate.setHours(selectedTime.getHours());
                            newDate.setMinutes(selectedTime.getMinutes());
                            setMatchForm(f => ({ ...f, date: newDate }));
                          }
                        }}
                        display="default"
                      />
                    </View>
                  )}
                  {/* Rango de edad */}
                  <Text style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: 6, marginTop: 8 }}>Rango de edad *</Text>
                  <View style={{ flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' }}>
                    {['18-25', '26-35', '36-45', '46+', 'todas las edades'].map(option => (
                      <TouchableOpacity
                        key={option}
                        style={{
                          flex: 1,
                          minWidth: '40%',
                          backgroundColor: matchForm.ageRange === option ? '#1e3a8a' : '#e5e7eb',
                          padding: 10,
                          borderRadius: 8,
                          margin: 2
                        }}
                        onPress={() => setMatchForm(f => ({ ...f, ageRange: option }))}
                      >
                        <Text style={{ color: matchForm.ageRange === option ? '#fff' : '#1e3a8a', textAlign: 'center' }}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#1e3a8a',
                      borderRadius: 8,
                      paddingVertical: 14,
                      paddingHorizontal: 32,
                      alignSelf: 'center',
                      marginTop: 24,
                      minWidth: 180,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                    onPress={handleCreateMatchInGroup}
                    disabled={creating}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{creating ? 'Creando...' : 'Crear Partido'}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </>
        )}

        {/* Modal de detalles de partido */}
        <Modal isVisible={showMatchDetails} onBackdropPress={() => setShowMatchDetails(false)}>
          {selectedMatch && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 0, maxHeight: '95%', flex: 1, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#fff' }}>
                <TouchableOpacity onPress={() => setShowMatchDetails(false)} style={{ padding: 8, marginRight: 8 }}>
                  <Ionicons name="close" size={24} color="#1e3a8a" />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', flex: 1, color: '#314E99' }}>{selectedMatch.title}</Text>
              </View>
              <ScrollView style={{ flex: 1, backgroundColor: '#F0F0F0' }} contentContainerStyle={{ padding: 16 }}>
                {/* Info principal */}
                <View style={styles.mainInfoCard}>
                  <View style={styles.mainInfoRow}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="location-outline" size={28} color="#1e3a8a" />
                    </View>
                    <View style={styles.mainInfoTextContainer}>
                      <Text style={styles.mainInfoLabel}>Lugar</Text>
                      <Text style={styles.mainInfoText}>{selectedMatch.location}</Text>
                    </View>
                  </View>
                  <View style={styles.mainInfoRow}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="calendar-outline" size={28} color="#1e3a8a" />
                    </View>
                    <View style={styles.mainInfoTextContainer}>
                      <Text style={styles.mainInfoLabel}>Fecha y hora</Text>
                      <Text style={styles.mainInfoText}>{(() => {
                        let dateObj: Date | null = null;
                        const rawDate = selectedMatch.date;
                        if (rawDate instanceof Date) {
                          dateObj = rawDate;
                        } else if (rawDate && typeof (rawDate as any).toDate === 'function') {
                          dateObj = (rawDate as any).toDate();
                        } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
                          dateObj = new Date(rawDate);
                        }
                        return dateObj
                          ? dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Fecha no disponible';
                      })()}</Text>
                    </View>
                  </View>
                  <View style={styles.mainInfoRow}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="trophy-outline" size={28} color="#1e3a8a" />
                    </View>
                    <View style={styles.mainInfoTextContainer}>
                      <Text style={styles.mainInfoLabel}>Nivel</Text>
                      <Text style={styles.mainInfoText}>{selectedMatch.level}</Text>
                    </View>
                  </View>
                  <View style={styles.mainInfoRow}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="people-outline" size={28} color="#1e3a8a" />
                    </View>
                    <View style={styles.mainInfoTextContainer}>
                      <Text style={styles.mainInfoLabel}>Rango de edad</Text>
                      <Text style={styles.mainInfoText}>{selectedMatch.ageRange}</Text>
                    </View>
                  </View>
                </View>
                {/* Jugadores */}
                <View style={styles.playersCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Jugadores</Text>
                    <View style={styles.playersCount}>
                      <Text style={styles.playersCountText}>{selectedMatch.playersJoined.length}/{selectedMatch.playersNeeded}</Text>
                    </View>
                  </View>
                  {selectedMatch.playersJoined.length > 0 ? (
                    <View style={styles.playersList}>
                      {/* Equipo 1 */}
                      {selectedMatch.teams?.team1.map((playerId, index) => (
                        <View key={playerId} style={[styles.playerItem, { justifyContent: 'space-between', width: '100%' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={styles.playerNumber}>
                              <Text style={styles.playerNumberText}>{index + 1}</Text>
                            </View>
                            <TouchableOpacity style={styles.playerNameContainer} onPress={() => { setSelectedUserId(playerId); setShowUserProfile(true); }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.playerName}>{playerId === user?.uid ? 'Tú' : userInfos[playerId]?.username || 'Cargando...'}</Text>
                                {userInfos[playerId]?.gender === 'Masculino' && (
                                  <Ionicons name="male" size={16} color="#3B82F6" style={{ marginLeft: 6 }} />
                                )}
                                {userInfos[playerId]?.gender === 'Femenino' && (
                                  <Ionicons name="female" size={16} color="#EC4899" style={{ marginLeft: 6 }} />
                                )}
                              </View>
                            </TouchableOpacity>
                          </View>
                          <View style={[styles.teamBadge, styles.team1Badge]}>
                            <Text style={styles.teamBadgeText}>Equipo 1</Text>
                          </View>
                        </View>
                      ))}
                      {/* Equipo 2 */}
                      {selectedMatch.teams?.team2.map((playerId, index) => (
                        <View key={playerId} style={[styles.playerItem, { justifyContent: 'space-between', width: '100%' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={styles.playerNumber}>
                              <Text style={styles.playerNumberText}>{index + 1}</Text>
                            </View>
                            <TouchableOpacity style={styles.playerNameContainer} onPress={() => { setSelectedUserId(playerId); setShowUserProfile(true); }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.playerName}>{playerId === user?.uid ? 'Tú' : userInfos[playerId]?.username || 'Cargando...'}</Text>
                                {userInfos[playerId]?.gender === 'Masculino' && (
                                  <Ionicons name="male" size={16} color="#3B82F6" style={{ marginLeft: 6 }} />
                                )}
                                {userInfos[playerId]?.gender === 'Femenino' && (
                                  <Ionicons name="female" size={16} color="#EC4899" style={{ marginLeft: 6 }} />
                                )}
                              </View>
                            </TouchableOpacity>
                          </View>
                          <View style={[styles.teamBadge, styles.team2Badge]}>
                            <Text style={styles.teamBadgeText}>Equipo 2</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noPlayersText}>Aún no hay jugadores apuntados</Text>
                  )}
                </View>
                {/* Resultado del partido (si existe) */}
                {selectedMatch.score && (
                  <View style={styles.scoreSection}>
                    <Text style={styles.scoreTitle}>Resultado</Text>
                    <View style={styles.scoreContainer}>
                      <View style={styles.scoreSet}>
                        <Text style={styles.scoreSetTitle}>Set 1</Text>
                        <Text style={styles.scoreSetValue}>{selectedMatch.score.set1.team1} - {selectedMatch.score.set1.team2}</Text>
                      </View>
                      <View style={styles.scoreSet}>
                        <Text style={styles.scoreSetTitle}>Set 2</Text>
                        <Text style={styles.scoreSetValue}>{selectedMatch.score.set2.team1} - {selectedMatch.score.set2.team2}</Text>
                      </View>
                      {selectedMatch.score.set3 && (
                        <View style={styles.scoreSet}>
                          <Text style={styles.scoreSetTitle}>Set 3</Text>
                          <Text style={styles.scoreSetValue}>{selectedMatch.score.set3.team1} - {selectedMatch.score.set3.team2}</Text>
                        </View>
                      )}
                      <View style={styles.winnerContainer}>
                        <Text style={styles.winnerText}>Ganador: Equipo {selectedMatch.score.winner === 'team1' ? '1' : '2'}</Text>
                      </View>
                    </View>
                  </View>
                )}
                {/* Formulario de resultados (condicional) */}
                {!selectedMatch.score && isJoined && (
                  <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
                    {(() => {
                      let matchDate = selectedMatch.date;
                      // Asegurar que matchDate es un objeto Date
                      if (!(matchDate instanceof Date)) {
                        if (matchDate && typeof (matchDate as any).toDate === 'function') {
                          matchDate = (matchDate as any).toDate();
                        } else if (typeof matchDate === 'string' || typeof matchDate === 'number') {
                          matchDate = new Date(matchDate);
                        } else {
                          matchDate = new Date();
                        }
                      }
                      const now = new Date();
                      const timeDiff = matchDate.getTime() - now.getTime();
                      const minutesRemaining = Math.ceil(timeDiff / (1000 * 60));
                      if (timeDiff <= 0) {
                        return (
                          <TouchableOpacity style={styles.addScoreButton} onPress={() => setShowScoreForm(true)}>
                            <Ionicons name="add-circle-outline" size={20} color="#fff" style={styles.addScoreIcon} />
                            <Text style={styles.addScoreText}>Añadir Resultado</Text>
                          </TouchableOpacity>
                        );
                      }
                      return (
                        <View style={[styles.addScoreButton, styles.addScoreButtonDisabled, { marginTop: 24, width: '100%', alignSelf: 'center' }]}>
                          <Ionicons name="time-outline" size={20} color="#fff" style={styles.addScoreIcon} />
                          <Text style={styles.addScoreText}>
                            {minutesRemaining > 60
                              ? `El partido comienza en ${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}m`
                              : `El partido comienza en ${minutesRemaining}m`}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                )}
                <ScoreForm
                  matchId={selectedMatch.id}
                  onScoreSubmitted={handleScoreGroupMatch}
                  visible={showScoreForm}
                  onClose={() => setShowScoreForm(false)}
                  collection="groups"
                  groupId={group?.id}
                />
                <TeamSelectionModal
                  key={selectedMatch ? selectedMatch.id + '-' + selectedMatch.playersJoined.length : 'empty'}
                  visible={showTeamSelection}
                  onClose={() => setShowTeamSelection(false)}
                  onSelectTeam={handleJoinGroupMatch}
                  match={selectedMatch}
                />
              </ScrollView>
              {/* Botón para unirse o abandonar */}
              {!selectedMatch.score && (
                <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0' }}>
                  {(() => {
                    const isCreatorAndOnlyPlayer = selectedMatch?.createdBy === user?.uid && selectedMatch.playersJoined.length === 1;
                    if (isCreatorAndOnlyPlayer && showDeleteConfirm) {
                      return (
                        <View style={{ marginTop: 16, alignItems: 'center' }}>
                          <Text style={{ color: '#e11d48', fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
                            ¿Seguro que quieres eliminar este partido? Esta acción no se puede deshacer.
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                              style={[styles.joinButton, { backgroundColor: '#aaa' }]}
                              onPress={() => setShowDeleteConfirm(false)}
                            >
                              <Text style={styles.joinButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.joinButton, { backgroundColor: '#e11d48' }]}
                              onPress={async () => {
                                setShowDeleteConfirm(false);
                                await deleteGroupMatch(selectedMatch.id);
                              }}
                            >
                              <Text style={styles.joinButtonText}>Eliminar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }
                    return (
                      <TouchableOpacity
                        style={[
                          styles.joinButton,
                          isJoined ? styles.leaveButton : null,
                          matchLoading && styles.buttonDisabled,
                          selectedMatch.playersJoined.length >= selectedMatch.playersNeeded && !isJoined && styles.buttonDisabled
                        ]}
                        onPress={
                          isCreatorAndOnlyPlayer
                            ? () => setShowDeleteConfirm(true)
                            : (isJoined
                                ? handleLeaveGroupMatch
                                : () => setShowTeamSelection(true))
                        }
                        disabled={matchLoading || (selectedMatch.playersJoined.length >= selectedMatch.playersNeeded && !isJoined)}
                      >
                        {matchLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.joinButtonText}>
                            {isCreatorAndOnlyPlayer
                              ? 'Eliminar partido'
                              : isJoined
                                ? 'Abandonar Partido'
                                : selectedMatch.playersJoined.length >= selectedMatch.playersNeeded
                                  ? 'Partido Completo'
                                  : 'Unirse al Partido'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })()}
                </View>
              )}
            </View>
          )}
        </Modal>
      </SafeAreaView>
      <CustomDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        options={[
          { text: 'Cancelar', onPress: dialog.onClose, style: { backgroundColor: '#aaa' } },
          { text: 'Eliminar', onPress: dialog.onConfirm, style: { backgroundColor: '#e11d48' } }
        ]}
        onClose={dialog.onClose}
      />
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
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mainInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  mainInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30,58,138,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mainInfoTextContainer: {
    flex: 1,
  },
  mainInfoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  mainInfoText: {
    fontSize: 16,
    color: '#4b5563',
  },
  playersCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  playersCount: {
    backgroundColor: 'rgba(30,58,138,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  playersCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 4,
    width: '100%',
    justifyContent: 'space-between',
  },
  playerNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playerNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    color: '#1e3a8a',
  },
  teamBadge: {
    backgroundColor: 'rgba(30,58,138,0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    alignSelf: 'flex-end',
  },
  teamBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  team1Badge: {
    backgroundColor: 'rgba(49,78,153,0.1)',
  },
  team2Badge: {
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  noPlayersText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
  },
  scoreSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreSet: {
    flex: 1,
    marginRight: 8,
  },
  scoreSetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  scoreSetValue: {
    fontSize: 16,
    color: '#4b5563',
  },
  winnerContainer: {
    backgroundColor: 'rgba(30,58,138,0.1)',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  winnerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
  },
  scoreFormContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  addScoreButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addScoreIcon: {
    marginRight: 8,
  },
  addScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  addScoreButtonDisabled: {
    backgroundColor: '#e5e7eb',
    marginTop: 24,
    alignSelf: 'center',
    width: '100%',
  },
  joinButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveButton: {
    backgroundColor: '#e11d48',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#e5e7eb',
  },
}); 