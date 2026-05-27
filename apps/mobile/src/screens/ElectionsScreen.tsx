import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { electionsAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { theme } from '../theme';

type Tab = 'feed' | 'incidents' | 'results' | 'hotspots';

const ELECTIONS = ['2027 General Election', '2025 Off-Cycle Governorship'];

const INCIDENT_COLORS: Record<string, string> = {
  violence: '#DC2626',
  vote_buying: '#F97316',
  intimidation: '#7C2D12',
  ballot_snatching: '#991B1B',
  result_upload: '#059669',
  observer_report: '#2563EB',
};

export default function ElectionsScreen() {
  const { country } = useAppStore();
  const [tab, setTab] = useState<Tab>('feed');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState(ELECTIONS[0]);

  useEffect(() => { loadData(); }, [tab, country, election]);

  const loadData = async () => {
    setLoading(true);
    try {
      let res;
      switch (tab) {
        case 'feed': res = await electionsAPI.getFeed(country, election); break;
        case 'incidents': res = await electionsAPI.getIncidents(country); break;
        case 'results': res = await electionsAPI.getResults(country, election); break;
        case 'hotspots': res = await electionsAPI.getHotspots(country, election); break;
      }
      setData(Array.isArray(res?.data) ? res.data : []);
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  const renderFeedItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.typeBadge, { backgroundColor: INCIDENT_COLORS[item.type] || '#6B7280' }]}>
          <Text style={styles.typeBadgeText}>{item.type?.replace('_', ' ').toUpperCase()}</Text>
        </View>
        {item.state && <Text style={styles.stateMeta}>{item.state}</Text>}
      </View>
      <Text style={styles.cardDesc} numberOfLines={3}>{item.description || item.electionName}</Text>
      {item.results && Object.keys(item.results).length > 0 && (
        <View style={styles.resultsBox}>
          {Object.entries(item.results).map(([party, votes]) => (
            <View key={party} style={styles.resultRow}>
              <Text style={styles.resultParty}>{party}</Text>
              <Text style={styles.resultVotes}>{String(votes)}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.cardTime}>
        {item.user?.displayName || 'Anonymous'} · {new Date(item.createdAt).toLocaleString()}
        {item.isVerifiedObserver ? ' ✓ Observer' : ''}
      </Text>
    </View>
  );

  const renderHotspot = ({ item }: { item: any }) => (
    <View style={styles.hotspotCard}>
      <View style={styles.hotspotHeader}>
        <Text style={styles.hotspotState}>{item.state || 'Unknown'}</Text>
        <View style={[styles.typeBadge, { backgroundColor: INCIDENT_COLORS[item.type] || '#6B7280' }]}>
          <Text style={styles.typeBadgeText}>{item.type?.replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.hotspotCount}>{item.count}</Text>
      <Text style={styles.hotspotLabel}>reports</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗳️ Election Monitor</Text>
        <View style={styles.electionSelector}>
          {ELECTIONS.map((e) => (
            <TouchableOpacity key={e} style={[styles.electionChip, election === e && styles.electionChipActive]} onPress={() => setElection(e)}>
              <Text style={[styles.electionChipText, election === e && styles.electionChipTextActive]} numberOfLines={1}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.tabBar}>
        {([['feed', '📰 Feed'], ['incidents', '⚠️ Incidents'], ['results', '📊 Results'], ['hotspots', '🔥 Hot']] as [Tab, string][]).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>{tab === 'incidents' ? '✅' : '🗳️'}</Text>
            <Text style={styles.emptyTitle}>{loading ? 'Loading...' : tab === 'incidents' ? 'No incidents reported' : 'No data yet'}</Text>
            <Text style={styles.emptyDesc}>Reports will appear here during elections</Text>
          </View>
        }
        renderItem={tab === 'hotspots' ? renderHotspot : renderFeedItem}
        numColumns={tab === 'hotspots' ? 2 : 1}
        key={tab === 'hotspots' ? 'grid' : 'list'}
        columnWrapperStyle={tab === 'hotspots' ? styles.hotspotRow : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light.background },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: theme.colors.light.border },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.light.text },
  electionSelector: { flexDirection: 'row', gap: 8, marginTop: 10 },
  electionChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: theme.colors.light.background, borderWidth: 1, borderColor: theme.colors.light.border },
  electionChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  electionChipText: { fontSize: 11, color: theme.colors.light.textSecondary },
  electionChipTextActive: { color: '#fff', fontWeight: '600' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: theme.colors.light.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 12, color: theme.colors.light.textSecondary, fontWeight: '600' },
  tabTextActive: { color: theme.colors.primary },
  listContent: { padding: 16, gap: 10 },
  // Feed/Incidents cards
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: theme.colors.light.border },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },
  stateMeta: { fontSize: 11, color: theme.colors.light.textSecondary },
  cardDesc: { fontSize: 13, color: theme.colors.light.text, lineHeight: 19 },
  resultsBox: { marginTop: 8, backgroundColor: theme.colors.light.background, borderRadius: 8, padding: 10 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  resultParty: { fontSize: 12, fontWeight: '500', color: theme.colors.light.text },
  resultVotes: { fontSize: 12, fontWeight: '700', color: theme.colors.light.text },
  cardTime: { fontSize: 11, color: theme.colors.light.textSecondary, marginTop: 8 },
  // Hotspots
  hotspotRow: { gap: 10 },
  hotspotCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: theme.colors.light.border },
  hotspotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hotspotState: { fontSize: 13, fontWeight: '600', color: theme.colors.light.text },
  hotspotCount: { fontSize: 24, fontWeight: '800', color: theme.colors.light.text },
  hotspotLabel: { fontSize: 11, color: theme.colors.light.textSecondary },
  // Empty
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.light.text },
  emptyDesc: { fontSize: 12, color: theme.colors.light.textSecondary, marginTop: 4 },
});
