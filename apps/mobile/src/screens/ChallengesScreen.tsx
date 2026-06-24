import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Linking, RefreshControl } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { API_URL } from '../constants';

export default function ChallengesScreen({ navigation }: any) {
  const { token, user } = useAppStore();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [reportId, setReportId] = useState('');
  const [loading, setLoading] = useState(true);

  const loadChallenges = () => {
    setLoading(true);
    fetch(`${API_URL}/challenges/feed?country=${user?.country || 'NG'}`)
      .then(r => r.json())
      .then(d => setChallenges(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadChallenges(); }, []);

  const loadDetail = (id: string) => {
    Promise.all([
      fetch(`${API_URL}/challenges/${id}`).then(r => r.json()),
      fetch(`${API_URL}/challenges/${id}/leaderboard`).then(r => r.json()),
    ]).then(([c, lb]) => {
      setSelected(c);
      setLeaderboard(Array.isArray(lb) ? lb : []);
    });
  };

  const handleEnter = async () => {
    if (!token || !reportId.trim() || !selected) return;
    try {
      const res = await fetch(`${API_URL}/challenges/${selected.id}/enter`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: reportId.trim() }),
      });
      const data = await res.json();
      if (res.ok) { Alert.alert('Success', 'Entry submitted! 🎉'); setReportId(''); loadDetail(selected.id); }
      else Alert.alert('Error', data.message || 'Failed');
    } catch { Alert.alert('Error', 'Failed to submit'); }
  };

  if (selected) {
    const daysLeft = Math.max(0, Math.ceil((new Date(selected.deadline).getTime() - Date.now()) / 86400000));
    const pool70 = Number(selected.potAmount) * 0.7;
    const splits = [34, 24, 19, 13, 10];

    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity onPress={() => setSelected(null)} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#0F7B6C', fontSize: 13 }}>← Back to Challenges</Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 4 }}>{selected.title}</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{selected.description}</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 8, padding: 8, alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', color: '#0F7B6C' }}>{selected.currency} {Number(selected.potAmount).toLocaleString()}</Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>Pot</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#fef3c7', borderRadius: 8, padding: 8, alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', color: '#92400e' }}>{daysLeft}d left</Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>Deadline</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', color: '#111' }}>{selected.entryCount}</Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>Entries</Text>
            </View>
          </View>

          <Text style={{ fontSize: 11, fontWeight: '600', color: '#92400e', marginBottom: 4 }}>💰 Prize Split (70% of pot):</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            {splits.map((s, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold' }}>#{i + 1}</Text>
                <Text style={{ fontSize: 9, color: '#92400e' }}>{Math.round(pool70 * s / 100).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {token && selected.status === 'active' && daysLeft > 0 && (
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>🎬 Submit Entry</Text>
            <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Create a video report about this product, then paste the report ID.</Text>
            <TextInput value={reportId} onChangeText={setReportId} placeholder="Paste report ID"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 8 }} />
            <TouchableOpacity onPress={handleEnter} style={{ backgroundColor: '#0F7B6C', borderRadius: 8, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Submit Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 12 }}>🏆 Leaderboard</Text>
          {leaderboard.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No entries yet</Text>
          ) : leaderboard.map((e: any, i: number) => (
            <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < leaderboard.length - 1 ? 1 : 0, borderColor: '#f3f4f6' }}>
              <Text style={{ width: 28, fontWeight: 'bold', color: i < 3 ? '#d97706' : '#9ca3af' }}>#{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500' }}>{e.reporter?.displayName || 'Reporter'}</Text>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>👁 {e.viewCount} views</Text>
              </View>
              {e.paidOut && <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#059669' }}>{selected.currency} {Number(e.payoutAmount).toLocaleString()}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadChallenges} />}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 4 }}>🎯 Promo Challenges</Text>
      <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Make videos about products. Top 5 creators win from the pot.</Text>

      <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: '#92400e' }}>💡 Businesses post challenges. You create video reports. Top 5 by views split 70% of the pot. Need Academy courses 1-3.</Text>
      </View>

      {challenges.length === 0 && !loading && (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🎯</Text>
          <Text style={{ color: '#6b7280', fontWeight: '500' }}>No active challenges</Text>
        </View>
      )}

      {challenges.map((c: any) => {
        const daysLeft = Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000));
        return (
          <TouchableOpacity key={c.id} onPress={() => loadDetail(c.id)}
            style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 4 }}>{c.title}</Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }} numberOfLines={2}>{c.description}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0F7B6C' }}>{c.currency} {Number(c.potAmount).toLocaleString()}</Text>
              <Text style={{ fontSize: 11, color: '#6b7280' }}>{c.entryCount} entries</Text>
              <Text style={{ fontSize: 11, color: '#dc2626' }}>⏰ {daysLeft}d</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
