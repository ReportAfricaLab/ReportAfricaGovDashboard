import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { searchAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { theme } from '../theme';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  severity: string;
  createdAt: string;
}

export default function SearchScreen() {
  const { country } = useAppStore();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    searchAPI.trending(country).then(res => {
      setTrending(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  }, [country]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await searchAPI.search(q, country);
      setResults(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, [country]);

  useEffect(() => {
    const timeout = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(timeout);
  }, [query, doSearch]);

  const getSeverityColor = (s: string) => {
    switch (s) {
      case 'critical': return theme.colors.emergency;
      case 'high': return theme.colors.humanitarian;
      case 'medium': return theme.colors.secondary;
      default: return theme.colors.info;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Search</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search reports, incidents..."
          autoFocus
          returnKeyType="search"
        />
      </View>

      {!query.trim() && trending.length > 0 && (
        <View style={styles.trendingSection}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <View style={styles.trendingChips}>
            {trending.slice(0, 8).map((t, i) => (
              <TouchableOpacity key={i} style={styles.chip} onPress={() => setQuery(t)}>
                <Text style={styles.chipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          query.trim() ? (
            <Text style={styles.emptyText}>{searching ? 'Searching...' : 'No results found'}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resultCard} onPress={() => navigation.navigate('ReportDetail', { id: item.id })}>
            <View style={styles.resultHeader}>
              <View style={[styles.severityDot, { backgroundColor: getSeverityColor(item.severity) }]} />
              <Text style={styles.resultCategory}>{item.category?.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
            {item.description && <Text style={styles.resultDesc} numberOfLines={2}>{item.description}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light.background },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: theme.colors.light.border },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.light.text, marginBottom: 12 },
  searchInput: { backgroundColor: theme.colors.light.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 1, borderColor: theme.colors.light.border },
  trendingSection: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.light.text, marginBottom: 10 },
  trendingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.light.border },
  chipText: { fontSize: 13, color: theme.colors.primary, fontWeight: '500' },
  listContent: { padding: 16, gap: 10 },
  resultCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: theme.colors.light.border },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  resultCategory: { fontSize: 11, color: theme.colors.light.textSecondary, textTransform: 'capitalize' },
  resultTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.light.text },
  resultDesc: { fontSize: 12, color: theme.colors.light.textSecondary, marginTop: 4, lineHeight: 18 },
  emptyText: { textAlign: 'center', color: theme.colors.light.textSecondary, marginTop: 40, fontSize: 14 },
});
