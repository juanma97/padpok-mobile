import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match } from '@app/types/index';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  let dateObj;
  const dateValue: any = match.date;
  if (dateValue instanceof Date) {
    dateObj = dateValue;
  } else if (dateValue && typeof dateValue.toDate === 'function') {
    dateObj = dateValue.toDate();
  } else {
    dateObj = undefined;
  }

  const formattedDate = dateObj
    ? dateObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Fecha no disponible';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{match.title}</Text>
        <View style={styles.playersCount}>
          <Text style={styles.playersCountText}>
            {match.playersJoined.length}/{match.playersNeeded}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#1e3a8a" />
          <Text style={styles.infoText}>{match.location}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#1e3a8a" />
          <Text style={styles.infoText}>{formattedDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={20} color="#1e3a8a" />
          <Text style={styles.infoText}>{match.ageRange}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  playersCount: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playersCountText: {
    fontSize: 14,
    color: '#4b5563',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
  },
}); 