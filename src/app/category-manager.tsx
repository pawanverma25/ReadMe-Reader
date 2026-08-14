import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useLibrary } from '../contexts/LibraryContext';
import { AlertConfig, ThemedAlert } from '../components/common/ThemedAlert';
import { ArrowLeft, Edit2, Plus, Trash2, X } from 'lucide-react-native';

export default function CategoryManagerScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { categories, createCategory, editCategory, deleteCategory } = useLibrary();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const handleCreate = async () => {
    if (!newCatName.trim()) return;
    await createCategory(newCatName);
    setNewCatName('');
    setShowAddModal(false);
  };

  const handleSaveEdit = async () => {
    if (editingId && editCatName.trim()) {
      await editCategory(editingId, editCatName);
      setEditingId(null);
      setEditCatName('');
    }
  };

  const handleDelete = (id: string, name: string) => {
    setAlertConfig({
      visible: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${name}"? Books in this category will remain in your main library.`,
      type: 'warning',
      confirmText: 'Delete Category',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        await deleteCategory(id);
      },
      onCancel: () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Edit Library Categories
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Categories appear as top tabs in your library. Books can belong to multiple categories.
        </Text>

        {categories.map((cat) => (
          <View
            key={cat.id}
            style={[
              styles.catCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.catLeft}>
              <View style={[styles.catBadge, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[styles.catBadgeText, { color: colors.primary }]}>
                  {cat.name.substring(0, 1).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.catName, { color: colors.textPrimary }]}>{cat.name}</Text>
              {cat.isDefault && (
                <View style={[styles.defaultTag, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.defaultTagText, { color: colors.textSecondary }]}>
                    Default
                  </Text>
                </View>
              )}
            </View>

            {!cat.isDefault && (
              <View style={styles.catActions}>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => {
                    setEditingId(cat.id);
                    setEditCatName(cat.name);
                  }}
                >
                  <Edit2 size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => handleDelete(cat.id, cat.name)}
                >
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Add Category Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Category</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.modalInput,
                { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              placeholder="Category Name (e.g. Work, Manga)"
              placeholderTextColor={colors.textSecondary}
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={handleCreate}
              >
                <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Category Modal */}
      <Modal visible={Boolean(editingId)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Category</Text>
              <TouchableOpacity onPress={() => setEditingId(null)}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.modalInput,
                { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              value={editCatName}
              onChangeText={setEditCatName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setEditingId(null)}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={handleSaveEdit}
              >
                <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Mihon Alert Dialog */}
      <ThemedAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  catName: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  defaultTag: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  catActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '90%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
