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
  Dimensions,
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
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';
import SegmentedControl from '@app/components/SegmentedControl';
import { createNotification } from '@app/lib/notifications';

const TABS = [
  { label: 'Partidos', value: 'Partidos' },
  { label: 'Ranking', value: 'Ranking' },
  { label: 'Chat', value: 'Chat' },
];
const PARTIDOS_TABS = [
  { label: 'Disponibles', value: 'disponibles' },
  { label: 'Mis Partidos', value: 'mis' },
];

export default function GroupDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { groupId } = route.params as any;
  const [selectedTab, setSelectedTab] = useState('Partidos');
  const [partidosTab, setPartidosTab] = useState<'disponibles' | 'mis'>('disponibles');
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
  const [sortBy, setSortBy] = useState<'points' | 'matchesPlayed' | 'wins'>('points');

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

  // Al cargar los partidos del grupo (fetchGroup y refreshGroup), añade la lógica de cancelación automática:
  const cancelIncompleteGroupMatches = async (groupData: GroupType) => {
    if (!Array.isArray(groupData.matches)) return;
    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    let updated = false;
    for (const match of groupData.matches) {
      // Convertir la fecha del partido a Date si es necesario
      let matchDate;
      if (match.date instanceof Date) matchDate = match.date;
      else if (match.date && typeof match.date.toDate === 'function') matchDate = (match.date as any).toDate();
      else if (typeof match.date === 'string' || typeof match.date === 'number') matchDate = new Date(match.date);
      else continue; // Si no se puede parsear la fecha, saltar este partido
      
      // Solo cancelar si: faltan menos de 24h Y no está completo Y no está ya cancelado/completado
      if (
        match.status !== 'cancelled' &&
        match.status !== 'completed' &&
        matchDate <= minDate && // Faltan menos de 24h
        match.playersJoined && 
        Array.isArray(match.playersJoined) &&
        match.playersJoined.length < match.playersNeeded // No está completo
      ) {
        match.status = 'cancelled';
        updated = true;
        // Notificación al creador
        await createNotification(
          'match_cancelled',
          match.id,
          match.title,
          match.createdBy,
          { reason: 'No se completaron los jugadores 24h antes del inicio.' }
        );
      }
    }
    if (updated) {
      const groupRef = firestoreDoc(db, 'groups', groupData.id);
      await updateDoc(groupRef, { matches: groupData.matches });
    }
  };

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
    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (matchForm.date < minDate) {
      setDialog({
        visible: true,
        title: 'Error',
        message: 'La fecha y hora del partido deben ser al menos 24 horas en el futuro.',
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
        await cancelIncompleteGroupMatches(groupData);
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
    if (!group) return;
    const groupRef = firestoreDoc(db, 'groups', group.id);
    const matches = Array.isArray(group.matches) ? group.matches : [];
    const idx = matches.findIndex((m: Match) => m.id === matchId);
    if (idx === -1) return;
    const updatedMatch = updater(matches[idx]);
    const updatedMatches = [...matches];
    updatedMatches[idx] = updatedMatch;
    
    // Actualizar Firestore
    await updateDoc(groupRef, { matches: updatedMatches, updatedAt: serverTimestamp() });
    
    // Pequeño delay para asegurar que Firestore se actualice
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Actualizar estado local directamente
    const newGroupData = { ...group, matches: updatedMatches };
    setGroup(newGroupData);
    
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
  };

  // 2. Función para unirse a un partido en grupo
  const handleJoinGroupMatch = async (team: 'team1' | 'team2', position: 'first' | 'second') => {
    if (!user || !selectedMatch || !group) return;
    
    setMatchLoading(true);
    
    try {
      // Añadir usuario al partido
      const groupRef = firestoreDoc(db, 'groups', group.id);
      const matches = Array.isArray(group.matches) ? group.matches : [];
      const idx = matches.findIndex((m: Match) => m.id === selectedMatch.id);
      
      if (idx !== -1) {
        const match = matches[idx];
        const newTeams = {
          team1: team === 'team1' ? [...(match.teams?.team1 || []), user.uid] : (match.teams?.team1 || []),
          team2: team === 'team2' ? [...(match.teams?.team2 || []), user.uid] : (match.teams?.team2 || [])
        };
        
        const updatedMatch = {
          ...match,
          playersJoined: [...(match.playersJoined || []), user.uid],
          teams: newTeams
        };
        
        const updatedMatches = [...matches];
        updatedMatches[idx] = updatedMatch;
        
        // Actualizar Firestore
        await updateDoc(groupRef, { matches: updatedMatches, updatedAt: serverTimestamp() });
        
        // Actualizar estado local
        setGroup({ ...group, matches: updatedMatches } as GroupType);
      }
      
      // Cerrar modales
      setShowTeamSelection(false);
      setShowMatchDetails(false);
      setSelectedMatch(null);
      
    } catch (error) {
      console.error('Error al unirse al partido:', error);
      setDialog({
        visible: true,
        title: 'Error',
        message: 'No se pudo unir al partido. Inténtalo de nuevo.',
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
      await cancelIncompleteGroupMatches(groupData);
    }
    setRefreshing(false);
  };

  // Renderizado de partidos
  const renderMatch = ({ item }: { item: Match }) => (
    <MatchCard
      match={item}
      onPress={() => {
        setSelectedMatch(item);
        setShowMatchDetails(true);
        setIsJoined(!!user && item.playersJoined.includes(user.uid));
        if (item.playersJoined.length > 0) {
          getMatchUsers(item.playersJoined).then(setUserInfos);
        } else {
          setUserInfos({});
        }
      }}
    />
  );

  // Renderizado de ranking
  const renderRanking = ({ item, index }: any) => {
    const isTopThree = index < 3;
    const medalColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32';
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(30,58,138,0.08)',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: SPACING.md,
        }}>
          {isTopThree ? (
            <Ionicons name="medal" size={SIZES.lg} color={medalColor} />
          ) : (
            <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary }}>{index + 1}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary, marginBottom: SPACING.xs }}>
            {usernames[item.id] || item.id}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <Ionicons name="trophy" size={SIZES.md} color={COLORS.primary} />
              <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.medium, marginLeft: 4 }}>{item.points} pts.</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <Ionicons name="tennisball" size={SIZES.md} color={COLORS.primary} />
              <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.medium, marginLeft: 4 }}>{item.matchesPlayed} part.</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <Ionicons name="checkmark-circle" size={SIZES.md} color={COLORS.primary} />
              <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.medium, marginLeft: 4 }}>{item.wins} vict.</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Partidos disponibles (futuros) - NO incluir partidos donde ya estoy unido
  const disponibles = Array.isArray(group?.matches)
    ? group.matches.filter(m => {
        let matchDate;
        if (m.date instanceof Date) matchDate = m.date;
        else if (m.date && typeof m.date.toDate === 'function') matchDate = (m.date as any).toDate();
        else if (typeof m.date === 'string' || typeof m.date === 'number') matchDate = new Date(m.date);
        else matchDate = new Date();
        
        const now = new Date();
        const isFuture = matchDate >= now;
        const isNotCancelled = m.status !== 'cancelled';
        const isNotCompleted = m.status !== 'completed';
        const isNotFull = m.playersJoined && Array.isArray(m.playersJoined) && m.playersJoined.length < m.playersNeeded;
        const isNotJoined = !user || !m.playersJoined || !Array.isArray(m.playersJoined) || !m.playersJoined.includes(user.uid);
        
        return isFuture && isNotCancelled && isNotCompleted && isNotFull && isNotJoined;
      })
    : [];

  // Mis partidos (todos los que me he unido)
  const misPartidos = Array.isArray(group?.matches) && user
    ? group.matches.filter(m => 
        m.playersJoined && 
        Array.isArray(m.playersJoined) && 
        m.playersJoined.includes(user.uid)
      )
    : [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />
        {/* Header premium */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={SIZES.xl} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.groupName}>{group?.name}</Text>
            <View style={styles.headerRow}>
              <Ionicons name="people-outline" size={SIZES.sm} color={COLORS.primary} />
              <Text style={styles.membersText}>{((group?.members?.length || 0))} miembros</Text>
              {group && group.admin === user?.uid && (
                <View style={styles.adminBadge}>
                  <Ionicons name="star" size={SIZES.sm} color={COLORS.white} style={{ marginRight: 2 }} />
                  <Text style={styles.adminText}>Admin</Text>
                </View>
              )}
            </View>
          </View>
          {group && group.admin === user?.uid && (
            <TouchableOpacity onPress={handleDeleteGroup} style={{ marginLeft: 16 }}>
              <Ionicons name="trash" size={SIZES.lg} color={COLORS.error} />
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
                navigation.navigate('Home', { screen: 'Groups', params: { refresh: true } });
              }}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="exit-outline" size={SIZES.md} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs premium */}
        <View style={styles.tabsWrapper}>
          <SegmentedControl
            options={TABS.map(t => t.label)}
            value={TABS.find(t => t.value === selectedTab)?.label || TABS[0].label}
            onChange={label => {
              const found = TABS.find(t => t.label === label);
              if (found) setSelectedTab(found.value);
            }}
            style={{ marginBottom: SPACING.md }}
          />
        </View>

        {/* Contenido según tab */}
        <View style={styles.contentContainer}>
          {selectedTab === 'Partidos' && (
            <>
              {/* Subtabs premium */}
              <View style={styles.tabsWrapper}>
                <SegmentedControl
                  options={PARTIDOS_TABS.map(t => t.label)}
                  value={PARTIDOS_TABS.find(t => t.value === partidosTab)?.label || PARTIDOS_TABS[0].label}
                  onChange={label => {
                    const found = PARTIDOS_TABS.find(t => t.label === label);
                    if (found) setPartidosTab(found.value as 'disponibles' | 'mis');
                  }}
                  style={{ marginBottom: SPACING.md }}
                />
              </View>
              {/* Lista según subtab */}
              {partidosTab === 'disponibles' ? (
                <FlatList
                  data={disponibles}
                  renderItem={renderMatch}
                  keyExtractor={(item, index) => item.id ? String(item.id) : `match-${index}`}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={<Text style={styles.emptyText}>No hay partidos en este grupo.</Text>}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={refreshGroup}
                      colors={[COLORS.primary]}
                      tintColor={COLORS.primary}
                    />
                  }
                />
              ) : (
                <FlatList
                  data={misPartidos}
                  renderItem={renderMatch}
                  keyExtractor={(item, index) => item.id ? String(item.id) : `match-${index}`}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={<Text style={styles.emptyText}>No te has unido a ningún partido</Text>}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={refreshGroup}
                      colors={[COLORS.primary]}
                      tintColor={COLORS.primary}
                    />
                  }
                />
              )}
            </>
          )}
          {selectedTab === 'Ranking' && (
            <>
              {/* SegmentedControl para ordenamiento */}
              <View style={styles.tabsWrapper}>
                <SegmentedControl
                  options={['Puntos', 'Partidos', 'Victorias']}
                  value={
                    sortBy === 'points' ? 'Puntos' : sortBy === 'matchesPlayed' ? 'Partidos' : 'Victorias'
                  }
                  onChange={label => {
                    if (label === 'Puntos') setSortBy('points');
                    else if (label === 'Partidos') setSortBy('matchesPlayed');
                    else setSortBy('wins');
                  }}
                  style={{ marginBottom: SPACING.md }}
                />
              </View>
              <FlatList
                data={group ? [...Object.entries(group.ranking ?? {}).map(([id, stats]) => ({ id, ...(stats as any) }))].sort((a, b) => {
                  if (sortBy === 'points') {
                    return (b.points || 0) - (a.points || 0);
                  } else if (sortBy === 'matchesPlayed') {
                    return (b.matchesPlayed || 0) - (a.matchesPlayed || 0);
                  } else {
                    return (b.wins || 0) - (a.wins || 0);
                  }
                }) : []}
                renderItem={renderRanking}
                keyExtractor={item => String(item.id || '')}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay ranking aún.</Text>}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refreshGroup}
                    colors={[COLORS.primary]}
                    tintColor={COLORS.primary}
                  />
                }
              />
            </>
          )}
          {selectedTab === 'Chat' && group?.id && (
            <MatchChat matchId={group.id} />
          )}
        </View>

        {/* FAB premium para crear partido solo en la pestaña de Partidos */}
        {selectedTab === 'Partidos' && (
          <>
            <TouchableOpacity style={styles.fab} onPress={() => setShowCreateMatch(true)} activeOpacity={0.85}>
              <Ionicons name="calendar-outline" size={SIZES.xl} color={COLORS.white} />
            </TouchableOpacity>
            {/* Sheet premium para crear partido */}
            <Modal
              isVisible={showCreateMatch}
              onBackdropPress={() => setShowCreateMatch(false)}
              style={{ margin: 0, justifyContent: 'flex-end' }}
              backdropOpacity={0.25}
              animationIn="slideInUp"
              animationOut="slideOutDown"
              useNativeDriver
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.sheetContainer}>
                  {/* Header sheet */}
                  <View style={styles.sheetHeader}>
                    <TouchableOpacity onPress={() => setShowCreateMatch(false)} style={styles.sheetCloseButton} accessibilityRole="button" accessibilityLabel="Cerrar">
                      <Ionicons name="close" size={SIZES.xl} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.sheetTitle}>Crear Partido en el Grupo</Text>
                  </View>
                  {/* Formulario en secciones */}
                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                    <View style={{ backgroundColor: '#FFF8E1', borderRadius: 10, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#FFD700' }}>
                      <Text style={{ color: '#B8860B', fontFamily: FONTS.medium, fontSize: SIZES.md }}>
                        Recuerda: solo puedes crear partidos con al menos 24 horas de antelación. Si no se completan los jugadores necesarios 24h antes del inicio, el partido se cancelará automáticamente y se notificará al creador.
                      </Text>
                    </View>
                    {/* Sección: Información básica */}
                    <View style={styles.sheetSection}>
                      <Text style={styles.sheetSectionTitle}>Información básica</Text>
                      <Text style={styles.sheetLabel}>Título *</Text>
                      <TextInput
                        style={styles.sheetInput}
                        placeholder="Ej: Partido amistoso nivel medio"
                        value={matchForm.title}
                        onChangeText={text => setMatchForm(f => ({ ...f, title: text }))}
                        placeholderTextColor={COLORS.gray}
                        autoCapitalize="sentences"
                        maxLength={40}
                        accessibilityLabel="Título del partido"
                      />
                      <Text style={styles.sheetLabel}>Ubicación *</Text>
                      <TextInput
                        style={styles.sheetInput}
                        placeholder="Ej: Club Deportivo Norte - Pista 3"
                        value={matchForm.location}
                        onChangeText={text => setMatchForm(f => ({ ...f, location: text }))}
                        placeholderTextColor={COLORS.gray}
                        autoCapitalize="sentences"
                        maxLength={60}
                        accessibilityLabel="Ubicación del partido"
                      />
                    </View>
                    {/* Sección: Detalles */}
                    <View style={styles.sheetSection}>
                      <Text style={styles.sheetSectionTitle}>Detalles</Text>
                      <Text style={styles.sheetLabel}>Descripción</Text>
                      <TextInput
                        style={[styles.sheetInput, styles.sheetTextArea]}
                        placeholder="Añade detalles adicionales..."
                        value={matchForm.description}
                        onChangeText={text => setMatchForm(f => ({ ...f, description: text }))}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor={COLORS.gray}
                        accessibilityLabel="Descripción del partido"
                        maxLength={200}
                      />
                      <Text style={styles.sheetLabel}>Nivel *</Text>
                      <SegmentedControl
                        options={['Principiante', 'Intermedio', 'Avanzado']}
                        value={matchForm.level}
                        onChange={option => setMatchForm(f => ({ ...f, level: option }))}
                        style={{ marginBottom: SPACING.md }}
                      />
                      <Text style={styles.sheetLabel}>Rango de edad *</Text>
                      <View style={styles.sheetAgeRangeRow}>
                        {['18-25', '26-35', '36-45', '46+', 'todas las edades'].map(option => (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.sheetAgeRangeOption,
                              matchForm.ageRange === option && styles.sheetAgeRangeOptionSelected
                            ]}
                            onPress={() => setMatchForm(f => ({ ...f, ageRange: option }))}
                            accessibilityRole="button"
                            accessibilityLabel={option}
                          >
                            <Text style={[
                              styles.sheetAgeRangeText,
                              matchForm.ageRange === option && styles.sheetAgeRangeTextSelected
                            ]}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    {/* Sección: Fecha y hora */}
                    <View style={styles.sheetSection}>
                      <Text style={styles.sheetSectionTitle}>Fecha y hora</Text>
                      <Text style={styles.sheetLabel}>Fecha *</Text>
                      <TouchableOpacity
                        style={styles.sheetInput}
                        onPress={() => setShowDatePicker(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Seleccionar fecha"
                      >
                        <Text style={{ color: matchForm.date ? COLORS.dark : COLORS.gray, fontFamily: FONTS.medium }}>
                          {matchForm.date instanceof Date
                            ? matchForm.date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                            : 'Selecciona la fecha'}
                        </Text>
                        <Ionicons name="calendar-outline" size={SIZES.md} color={COLORS.primary} style={{ position: 'absolute', right: 12, top: 14 }} />
                      </TouchableOpacity>
                      {showDatePicker && (
                        <View style={styles.sheetDatePickerWrapper}>
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
                            minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                            display="default"
                          />
                        </View>
                      )}
                      <Text style={styles.sheetLabel}>Hora *</Text>
                      <TouchableOpacity
                        style={styles.sheetInput}
                        onPress={() => setShowTimePicker(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Seleccionar hora"
                      >
                        <Text style={{ color: matchForm.date ? COLORS.dark : COLORS.gray, fontFamily: FONTS.medium }}>
                          {matchForm.date instanceof Date
                            ? matchForm.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                            : 'Selecciona la hora'}
                        </Text>
                        <Ionicons name="time-outline" size={SIZES.md} color={COLORS.primary} style={{ position: 'absolute', right: 12, top: 14 }} />
                      </TouchableOpacity>
                      {showTimePicker && (
                        <View style={styles.sheetDatePickerWrapper}>
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
                    </View>
                  </ScrollView>
                  {/* Botón fijo premium */}
                  <View style={styles.sheetButtonWrapper}>
                    <TouchableOpacity
                      style={[styles.sheetCreateButton, creating && { opacity: 0.7 }]}
                      onPress={handleCreateMatchInGroup}
                      disabled={creating}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Crear partido"
                    >
                      {creating ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <Text style={styles.sheetCreateButtonText}>Crear Partido</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </>
        )}

        {/* Modal de detalles de partido como sheet premium */}
        <Modal
          isVisible={showMatchDetails}
          onBackdropPress={() => {
            setShowMatchDetails(false);
            setSelectedMatch(null);
          }}
          onModalHide={() => {
            setShowMatchDetails(false);
            setSelectedMatch(null);
          }}
          style={{ margin: 0, justifyContent: 'flex-end' }}
          backdropOpacity={0.25}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          useNativeDriver
        >
          {selectedMatch && (
            <View style={styles.sheetContainer}>
              {/* Header sheet */}
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setShowMatchDetails(false)} style={styles.sheetCloseButton} accessibilityRole="button" accessibilityLabel="Cerrar">
                  <Ionicons name="close" size={SIZES.xl} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.sheetTitle} numberOfLines={1}>{selectedMatch.title}</Text>
              </View>
              {/* Contenido en secciones visuales */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                {/* Sección: Información principal */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>Información del partido</Text>
                  <View style={styles.mainInfoRow}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="location-outline" size={28} color={COLORS.primary} />
                    </View>
                    <View style={styles.mainInfoTextContainer}>
                      <Text style={styles.mainInfoLabel}>Lugar</Text>
                      <Text style={styles.mainInfoText}>{selectedMatch.location}</Text>
                    </View>
                  </View>
                  <View style={styles.mainInfoRow}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="calendar-outline" size={28} color={COLORS.primary} />
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
                      <Ionicons name="trophy-outline" size={28} color={COLORS.primary} />
                    </View>
                    <View style={styles.mainInfoTextContainer}>
                      <Text style={styles.mainInfoLabel}>Nivel</Text>
                      <Text style={styles.mainInfoText}>{selectedMatch.level}</Text>
                    </View>
                  </View>
                  <View style={styles.mainInfoRow}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="people-outline" size={28} color={COLORS.primary} />
                    </View>
                    <View style={styles.mainInfoTextContainer}>
                      <Text style={styles.mainInfoLabel}>Rango de edad</Text>
                      <Text style={styles.mainInfoText}>{selectedMatch.ageRange}</Text>
                    </View>
                  </View>
                </View>
                {/* Sección: Jugadores */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>Jugadores</Text>
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
                                <Text style={styles.playerName}>
                                  {playerId === user?.uid ? 'Tú' : userInfos[playerId]?.username || 'Cargando...'}
                                </Text>
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
                                <Text style={styles.playerName}>
                                  {playerId === user?.uid ? 'Tú' : userInfos[playerId]?.username || 'Cargando...'}
                                </Text>
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
                {/* Sección: Resultado del partido (si existe) */}
                {selectedMatch.score && (
                  <View style={styles.sheetSection}>
                    <Text style={styles.sheetSectionTitle}>Resultado</Text>
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
                  <View style={styles.sheetSection}>
                    {(() => {
                      let matchDate = selectedMatch.date;
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
                      if (selectedMatch.playersJoined.length < 4 && timeDiff <= 0) {
                        return (
                          <View style={[styles.addScoreButton, styles.addScoreButtonDisabled, { marginTop: 24, width: '100%', alignSelf: 'center', backgroundColor: '#000' }]}> 
                            <Text style={styles.addScoreText}>Partido incompleto</Text>
                            <Text style={styles.addScoreText}>No se alcanzó el número de jugadores</Text>
                          </View>
                        );
                      }
                      if (timeDiff <= 0 && selectedMatch.playersJoined.length === 4) {
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
                            {minutesRemaining > 1380 
                              ? `El partido comienza en ${Math.floor(minutesRemaining / 1440)}d ${Math.floor((minutesRemaining % 1440) / 60)}h`
                              : minutesRemaining > 60
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
                  userInfos={userInfos}
                  currentUserId={user?.uid}
                />
              </ScrollView>
              {/* Botón fijo premium para unirse/abandonar/eliminar */}
              {!selectedMatch.score && (
                <View style={styles.sheetButtonWrapper}>
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
                              : isJoined && !isCreatorAndOnlyPlayer
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
    backgroundColor: COLORS.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: SPACING.lg,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  membersText: {
    fontSize: SIZES.sm,
    color: COLORS.primary,
    marginLeft: 4,
    fontFamily: FONTS.medium,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  adminText: {
    color: COLORS.white,
    fontSize: SIZES.xs,
    fontFamily: FONTS.bold,
    marginLeft: 2,
  },
  tabsWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: 0,
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 32,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
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
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: Dimensions.get('window').height * 0.85,
    maxHeight: Dimensions.get('window').height * 0.98,
    paddingBottom: 0,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  sheetCloseButton: {
    marginRight: SPACING.md,
    padding: 4,
  },
  sheetTitle: {
    flex: 1,
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginRight: SIZES.xl + SPACING.md,
  },
  sheetSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  sheetSectionTitle: {
    fontSize: SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: 8,
  },
  sheetLabel: {
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginBottom: 4,
    marginTop: 8,
  },
  sheetInput: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: FONTS.regular,
    color: COLORS.dark,
    marginBottom: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  sheetTextArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  sheetAgeRangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  sheetAgeRangeOption: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: COLORS.light,
    padding: 10,
    borderRadius: 8,
    margin: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetAgeRangeOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sheetAgeRangeText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    fontSize: SIZES.sm,
  },
  sheetAgeRangeTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  sheetDatePickerWrapper: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 8,
    marginVertical: 8,
  },
  sheetButtonWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  sheetCreateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  sheetCreateButtonText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
  },
}); 