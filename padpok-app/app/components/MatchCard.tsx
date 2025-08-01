import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match } from '@app/types/index';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
}

export default function MatchCard({ match, onPress }: MatchCardProps) {
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

  // Verificar si el partido está pendiente de resultado
  const isPendingResult = React.useMemo(() => {
    if (!dateObj || match.score) return false;
    const now = new Date();
    return dateObj < now && match.playersJoined.length >= match.playersNeeded;
  }, [dateObj, match.score, match.playersJoined.length, match.playersNeeded]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isPendingResult && styles.cardPendingResult
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{match.title}</Text>
        <View style={styles.playersCount}>
          <Ionicons name="people-outline" size={SIZES.md} color={COLORS.primary} style={{ marginRight: 2 }} />
          <Text style={styles.playersCountText}>
            {match.playersJoined.length}/{match.playersNeeded}
          </Text>
        </View>
        {isPendingResult && (
          <View style={styles.pendingResultBadge}>
            <Ionicons name="add-circle-outline" size={SIZES.sm} color={COLORS.white} />
            <Text style={styles.pendingResultText}>Añadir Resultado</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={SIZES.md} color={COLORS.primary} />
          <Text style={styles.infoText}>{match.location}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={SIZES.md} color={COLORS.primary} />
          <Text style={styles.infoText}>{formattedDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="trophy-outline" size={SIZES.md} color={COLORS.primary} />
          <Text style={styles.infoText}>{match.level}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={SIZES.md} color={COLORS.primary} />
          <Text style={styles.infoText}>{match.ageRange}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardPendingResult: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  playersCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    minWidth: 48,
    justifyContent: 'center',
  },
  playersCountText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    fontFamily: FONTS.medium,
  },
  pendingResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    marginLeft: SPACING.sm,
  },
  pendingResultText: {
    fontSize: SIZES.xs,
    color: COLORS.white,
    fontFamily: FONTS.bold,
    marginLeft: 4,
  },
  cardContent: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  infoText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    fontFamily: FONTS.regular,
  },
}); 