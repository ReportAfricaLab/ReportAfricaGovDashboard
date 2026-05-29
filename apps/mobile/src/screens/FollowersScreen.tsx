import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { followsAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { theme } from '../theme';

export default function FollowersScreen({ route }: any) {
  const { userId, tab: initialTab } = route.params || {};
  const { user } = useAppStore();
  const targetId = userId || user?.id;
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab || 'followers');
  const [data, setData] = useState<any[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) return;
    followsAPI.getCounts(targetId).then((r) => setCounts(r.data)).catch(() => {});
  }, [targetId]);

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    const fetcher = tab === 'followers' ? followsAPI.getFollowers(targetId) : followsAPI.getFollowing(targetId);
    fetcher.then((r) => setData(r.data?.data || [])).finally(() => setLoading(false));
  }, [targetId, tab]);

  const handleFollow = async (id: string) => {
    try {
      await followsAPI.follow(id);
      setData((prev) => prev.map((u) => u.id === id ? { ...u, isFollowing: true } : u));
    } catch {}
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{item.displayName?.[0] || '?'}</Text></View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.displayName}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      {item.id !== user?.id && (
        <TouchableOpacity style={styles.followBtn} onPress={() => handleFollow(item.id)}>
          <Text style={styles.followBtnText}>Follow</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'followers' && styles.tabActive]} onPress={() => setTab('followers')}>
          <Text style={[styles.tabText, tab === 'followers' && styles.tabTextActive]}>Followers ({counts.followers})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'following' && styles.tabActive]} onPress={() => setTab('following')}>
          <Text style={[styles.tabText, tab === 'following' && styles.tabTextActive]}>Following ({counts.following})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : data.length === 0 ? (
        <Text style={styles.loadingText}>No {tab} yet</Text>
      ) : (
        <FlatList data={data} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light.background, paddingTop: 60 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.light.border, alignItems: 'center' },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: theme.colors.light.textSecondary },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.light.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: theme.colors.light.text },
  username: { fontSize: 12, color: theme.colors.light.textSecondary, marginTop: 1 },
  followBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: theme.colors.primary, borderRadius: 6 },
  followBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  loadingText: { textAlign: 'center', color: theme.colors.light.textSecondary, marginTop: 40 },
});
