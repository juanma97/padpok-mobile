import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SPACING } from '@app/constants/theme';

interface CustomDialogProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  options?: { text: string; onPress?: () => void; style?: object; type?: 'default' | 'error' | 'success' | 'warning' }[];
  type?: 'info' | 'error' | 'success' | 'warning';
}

const ICONS = {
  info: { name: 'information-circle-outline', color: COLORS.primary },
  error: { name: 'close-circle-outline', color: COLORS.error },
  success: { name: 'checkmark-circle-outline', color: COLORS.success },
  warning: { name: 'alert-circle-outline', color: COLORS.warning },
};

const CustomDialog: React.FC<CustomDialogProps> = ({
  visible,
  title,
  message,
  onClose,
  options = [{ text: 'OK', onPress: onClose }],
  type = 'info',
}) => {
  const icon = ICONS[type] || ICONS.info;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconWrapper}>
            <Ionicons name={icon.name as any} size={SIZES.xl} color={icon.color} />
          </View>
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message}>{message}</Text>
          <View style={styles.optionsRow}>
            {options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.button,
                  option.type === 'error' && styles.buttonError,
                  option.type === 'success' && styles.buttonSuccess,
                  option.type === 'warning' && styles.buttonWarning,
                  option.style,
                ]}
                onPress={() => {
                  option.onPress?.();
                  onClose();
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={option.text}
              >
                <Text style={styles.buttonText}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    minWidth: 300,
    alignItems: 'center',
    elevation: 8,
    marginHorizontal: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  iconWrapper: {
    marginBottom: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
    marginBottom: SPACING.sm,
    color: COLORS.primary,
    textAlign: 'center',
  },
  message: {
    fontSize: SIZES.md,
    color: COLORS.dark,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.md,
  },
  buttonError: {
    backgroundColor: COLORS.error,
  },
  buttonSuccess: {
    backgroundColor: COLORS.success,
  },
  buttonWarning: {
    backgroundColor: COLORS.warning,
  },
});

export default CustomDialog; 