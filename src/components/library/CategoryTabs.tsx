import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Category } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { Settings2 } from 'lucide-react-native';

interface CategoryTabsProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  onManageCategories?: () => void;
  getCategoryCount: (catId: string) => number;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  onManageCategories,
  getCategoryCount,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          const count = getCategoryCount(cat.id);

          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.tabPill,
                isActive && [styles.activeTabPill, { backgroundColor: colors.primaryContainer }],
              ]}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textSecondary },
                  isActive && [styles.activeTabText, { color: colors.primary }],
                ]}
              >
                {cat.name}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: colors.surfaceVariant },
                  isActive && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    { color: colors.textSecondary },
                    isActive && { color: colors.onPrimary },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {onManageCategories && (
        <TouchableOpacity
          style={[styles.manageBtn, { backgroundColor: colors.surfaceVariant }]}
          onPress={onManageCategories}
          activeOpacity={0.7}
        >
          <Settings2 size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTabPill: {
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  manageBtn: {
    padding: 10,
    marginRight: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
