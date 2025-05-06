import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CustomDialogProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  options?: { text: string; onPress?: () => void; style?: object }[];
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  visible,
  title,
  message,
  onClose,
  options = [{ text: 'OK', onPress: onClose }],
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message}>{message}</Text>
          <View style={styles.optionsRow}>
            {options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.button, option.style]}
                onPress={() => {
                  option.onPress?.();
                  onClose();
                }}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    alignItems: 'center',
    elevation: 5,
    marginHorizontal: 32,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#1e3a8a',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1e3a8a',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default CustomDialog; 