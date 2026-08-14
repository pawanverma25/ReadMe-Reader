import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react-native';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertConfig {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isDestructive?: boolean;
}

export const ThemedAlert: React.FC<AlertConfig> = ({
  visible,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  isDestructive,
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={28} color={colors.success} />;
      case 'warning':
        return <AlertCircle size={28} color="#FF9800" />;
      case 'error':
        return <XCircle size={28} color={colors.danger} />;
      default:
        return <Info size={28} color={colors.primary} />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            {renderIcon()}
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          </View>

          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.actionsRow}>
            {cancelText && (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.surfaceVariant }]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnText, { color: colors.textPrimary }]}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: isDestructive ? colors.danger : colors.primary },
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: colors.onPrimary, fontWeight: '700' }]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
