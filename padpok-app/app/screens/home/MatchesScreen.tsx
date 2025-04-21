import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { Match } from '@app/types';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@app/constants/theme';

const MatchesScreen: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const q = query(collection(db, 'matches'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const matchesData: Match[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          matchesData.push({
            id: doc.id,
            title: data.title,
            date: data.date.toDate(),
            location: data.location,
            playersNeeded: data.playersNeeded,
            playersJoined: data.playersJoined,
            createdBy: data.createdBy,
            level: data.level,
            description: data.description,
          });
        });
        
        setMatches(matchesData);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const renderMatchItem = ({ item }: { item: Match }) => {
    const formattedDate = item.date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="tennisball-outline" size={24} color="#1e3a8a" />
          </View>
          <View style={styles.matchTitleContainer}>
            <Text style={styles.matchTitle}>{item.title}</Text>
            <Text style={styles.matchLocation}>{item.location}</Text>
          </View>
        </View>
        
        <View style={styles.matchFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.footerText}>{formattedDate}</Text>
          </View>
          
          <View style={styles.footerItem}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.footerText}>
              {item.playersJoined.length}/{item.playersNeeded} jugadores
            </Text>
          </View>
          
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{item.level}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Partidos disponibles</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={24} color="#1e3a8a" />
        </TouchableOpacity>
      </View>

      {matches.length > 0 ? (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatchItem}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="tennisball-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            No hay partidos disponibles.{'\n'}¡Crea el primero!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    backgroundColor: 'rgba(30,58,138,0.1)',
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  matchTitleContainer: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchLocation: {
    color: '#6b7280',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    marginLeft: 4,
  },
  levelBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  levelText: {
    color: COLORS.primary,
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default MatchesScreen; 