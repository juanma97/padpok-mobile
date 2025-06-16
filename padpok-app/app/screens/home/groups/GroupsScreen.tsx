import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
  RefreshControl,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@app/types/navigation';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { useAuth } from '@app/lib/AuthContext';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';
import SegmentedControl from '@app/components/SegmentedControl';

// Si usas expo, puedes instalar este paquete para un control nativo:
// import SegmentedControl from '@react-native-segmented-control/segmented-control';
// Para este ejemplo, haré un control simple manual.

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Group {
  id: string;
  name: string;
  members: number;
  isAdmin: boolean;
}

const tabOptions = [
  { label: 'Mis Grupos', value: 'mis' },
  { label: 'Explorar Grupos', value: 'explorar' },
];

const GroupsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = React.useState<'mis' | 'explorar'>('mis');
  const [search, setSearch] = React.useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'groups'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(data);
      setLoading(false);
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    if ((route as any).params?.refresh) {
      const fetchGroups = async () => {
        setLoading(true);
        const snapshot = await getDocs(collection(db, 'groups'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGroups(data);
        setLoading(false);
      };
      fetchGroups();
      // Limpiar el parámetro para evitar recargas infinitas
      navigation.setParams && navigation.setParams({ refresh: undefined });
    }
  }, [route]);

  // Filtrar grupos según el usuario
  const myGroups = groups.filter(
    g => g.admin === user?.uid || (g.members && g.members.includes(user?.uid))
  );
  const exploreGroups = groups.filter(
    g => g.admin !== user?.uid && (!g.members || !g.members.includes(user?.uid))
  );

  // Filtro de búsqueda para explorar grupos
  const filteredPublicGroups = exploreGroups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  // Navegar a los detalles del grupo
  const handleGroupPress = (group: any) => {
    navigation.navigate('GroupDetails', { groupId: group.id });
  };

  // Unirse a un grupo
  const handleJoinGroup = async (group: any) => {
    if (!user) return;
    const groupRef = doc(db, 'groups', group.id);
    // Evitar duplicados
    const currentMembers = Array.isArray(group.members) ? group.members : [];
    if (currentMembers.includes(user.uid)) return;
    const updatedMembers = [...currentMembers, user.uid];

    // --- NUEVO: Actualizar ranking ---
    const currentRanking = group.ranking || {};
    if (!currentRanking[user.uid]) {
      currentRanking[user.uid] = {
        points: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0
      };
    }
    // --- FIN NUEVO ---

    await updateDoc(groupRef, { members: updatedMembers, ranking: currentRanking });
    // Refrescar grupos
    const snapshot = await getDocs(collection(db, 'groups'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setGroups(data);
    setSelectedTab('mis');
    // Navegar a detalles del grupo
    navigation.navigate('GroupDetails', { groupId: group.id });
  };

  // Renderizado de cada grupo
  const renderGroupItem = ({ item }: { item: any }) => {
    const isMember = item.admin === user?.uid || (item.members && item.members.includes(user?.uid));
    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => {
          if (selectedTab === 'mis' || isMember) {
            handleGroupPress(item);
          }
        }}
        disabled={selectedTab === 'explorar' && !isMember}
        activeOpacity={0.85}
      >
        <View style={styles.groupInfoCompact}>
          <Text style={styles.groupName}>{item.name}</Text>
          <View style={styles.memberInfo}>
            <Ionicons name="people-outline" size={SIZES.sm} color={COLORS.gray} />
            <Text style={styles.memberCount}>{item.members?.length} miembro{item.members?.length === 1 ? '' : 's'}</Text>
          </View>
        </View>
        {item.admin === user?.uid && selectedTab === 'mis' && (
          <View style={styles.adminBadge}>
            <Ionicons name="star" size={SIZES.sm} color={COLORS.white} style={{ marginRight: 2 }} />
            <Text style={styles.adminText}>Admin</Text>
          </View>
        )}
        {selectedTab === 'explorar' && !isMember && (
          <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinGroup(item)} activeOpacity={0.85}>
            <Text style={styles.joinButtonText}>Unirse</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  // Pull-to-refresh para recargar grupos
  const refreshGroups = async () => {
    setRefreshing(true);
    const snapshot = await getDocs(collection(db, 'groups'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setGroups(data);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />
      <View style={styles.container}>
        {/* Header premium con tabs */}
        <View style={styles.header}>
          <SegmentedControl
            options={tabOptions.map(o => o.label)}
            value={tabOptions.find(o => o.value === selectedTab)?.label || tabOptions[0].label}
            onChange={label => {
              const found = tabOptions.find(o => o.label === label);
              if (found) setSelectedTab(found.value as 'mis' | 'explorar');
            }}
            style={{ marginBottom: SPACING.md }}
            testID="segmented-control"
          />
        </View>
        {/* Buscador solo en explorar */}
        {selectedTab === 'explorar' && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={SIZES.md} color={COLORS.gray} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar grupo..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={COLORS.gray}
            />
          </View>
        )}
        {/* Lista de grupos */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Cargando grupos...</Text>
          </View>
        ) : (
          <FlatList
            data={selectedTab === 'mis' ? myGroups : filteredPublicGroups}
            renderItem={renderGroupItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={SIZES.xl} color={COLORS.lightGray} />
                <Text style={styles.emptyText}>
                  {selectedTab === 'mis'
                    ? 'No tienes grupos aún'
                    : 'No hay grupos para mostrar'}
                </Text>
                {selectedTab === 'mis' && (
                  <Text style={styles.emptySubtext}>
                    Crea un grupo o únete a uno existente
                  </Text>
                )}
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshGroups}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          />
        )}
        {/* FAB premium */}
        <TouchableOpacity style={styles.fab} onPress={handleCreateGroup} activeOpacity={0.85} testID="fab-create-group">
          <Ionicons name="add" size={SIZES.xl} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.dark,
    backgroundColor: 'transparent',
    padding: 0,
    fontFamily: FONTS.regular,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  groupInfoCompact: {
    flex: 1,
    minWidth: 0,
  },
  groupName: {
    fontSize: SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: 2,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
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
  joinButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'center',
    marginLeft: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  joinButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.gray,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: FONTS.regular,
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
});

export default GroupsScreen; 