import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { electionsAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { theme } from '../theme';

type Tab = 'feed' | 'incidents' | 'results' | 'hotspots';

export default function ElectionsScreen() {
  const { country } = useAppStore();
  const [tab, setTab] = useState<Tab>('feed');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [tab, country]);

  const loadData = async () => {
    setLoading(true);
    try {
      let res;
      switch (tab) {
        case 'feed': res = await electionsAPI.getFeed(country); break;
        case 'incidents': res = await electionsAPI.getIncidents(country); break;
        case 'results': res = await electionsAPI.getResults(country); break;
        case 'hotspots': res = await electionsAPI.getHotspots(country); break;
      }
      setData(Array.isArray(res?.data) ? res.data : []);
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {item.severity && (
        <View style={[styles.badge, { backgroundColor: item.severity === 'critical' ? theme.colors.emergency : item.severity === 'high' ? theme.colors.humanitarian : theme.colors.secondary }]}>
          <Text style={styles.badgeText}>{item.severity?.toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.cardTitle}>{item.title || item.name || item.location || 'Report'}</Text>
      {item.description && <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>}
      {item.type && <Text style={styles.cardMeta}>Type: {item.type}</Text>}
      {item.count !== undefined && <Text style={styles.cardMeta}>Reports: {item.count}</Text>}
      {item.createdAt && <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleDateString()}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗳️ Election Monitor</Text>
        <Text style={styles.subtitle}>Real-time election reporting</Text>
      </View>

      <View style={styles.tabBar}>
        {(['feed', 'incidents', 'results', 'hotspots'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Loading...' : 'No data available'}</Text>}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light.background },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: theme.colors.light.border },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.light.text },
  subtitle: { fontSize: 12, color: theme.colors.light.textSecondary, marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: theme.colors.light.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 12, color: theme.colors.light.textSecondary, fontWeight: '600' },
  tabTextActive: { color: theme.colors.primary },
  listContent: { padding: 16, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: theme.colors.light.border },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.light.text },
  cardDesc: { fontSize: 12, color: theme.colors.light.textSecondary, marginTop: 4, lineHeight: 18 },
  cardMeta: { fontSize: 11, color: theme.colors.light.textSecondary, marginTop: 4, textTransform: 'capitalize' },
  emptyText: { textAlign: 'center', color: theme.colors.light.textSecondary, marginTop: 40, fontSize: 14 },
});
