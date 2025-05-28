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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@app/types/navigation';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { useAuth } from '@app/lib/AuthContext';

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

const GroupsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedTab, setSelectedTab] = React.useState<'mis' | 'explorar'>('mis');
  const [search, setSearch] = React.useState('');
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    await updateDoc(groupRef, { members: updatedMembers });
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
      >
        <View style={styles.groupInfoCompact}>
          <Text style={styles.groupName}>{item.name}</Text>
          <View style={styles.memberInfo}>
            <Ionicons name="people-outline" size={14} color="#666" />
            <Text style={styles.memberCount}>{(item.members?.length || 0) + 1} miembros</Text>
          </View>
        </View>
        {item.admin === user?.uid && selectedTab === 'mis' && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>Admin</Text>
          </View>
        )}
        {selectedTab === 'explorar' && !isMember && (
          <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinGroup(item)}>
            <Text style={styles.joinButtonText}>Unirse</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Control de pestañas manual
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'mis' && styles.tabSelected]}
        onPress={() => setSelectedTab('mis')}
      >
        <Text style={[styles.tabText, selectedTab === 'mis' && styles.tabTextSelected]}>Mis Grupos</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'explorar' && styles.tabSelected]}
        onPress={() => setSelectedTab('explorar')}
      >
        <Text style={[styles.tabText, selectedTab === 'explorar' && styles.tabTextSelected]}>Explorar Grupos</Text>
      </TouchableOpacity>
    </View>
  );

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Tabs */}
        {renderTabs()}

        {/* Buscador solo en explorar */}
        {selectedTab === 'explorar' && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar grupo..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#aaa"
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
                <Ionicons name="people-outline" size={48} color="#ccc" />
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
          />
        )}

        {/* Botón flotante para crear grupo */}
        <TouchableOpacity style={styles.fab} onPress={handleCreateGroup}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    backgroundColor: 'transparent',
    padding: 0,
  },
  listContent: {
    padding: 8,
    paddingBottom: 80,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  groupInfoCompact: {
    flex: 1,
    minWidth: 0,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 2,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 13,
    color: '#666',
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
  joinButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    alignSelf: 'center',
    marginLeft: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
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
});

export default GroupsScreen; 