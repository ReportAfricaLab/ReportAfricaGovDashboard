import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Linking, RefreshControl } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { API_URL } from '../constants';

type Path = null | 'business' | 'reporter';

export default function ChallengesScreen({ navigation }: any) {
  const { token, user } = useAppStore();
  const [path, setPath] = useState<Path>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [reportId, setReportId] = useState('');
  const [loading, setLoading] = useState(false);

  const loadChallenges = () => {
    setLoading(true);
    fetch(`${API_URL}/challenges/feed?country=${user?.country || 'NG'}`)
      .then(r => r.json())
      .then(d => setChallenges(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (path === 'reporter') loadChallenges(); }, [path]);

  const loadDetail = (id: string) => {
    Promise.all([
      fetch(`${API_URL}/challenges/${id}`).then(r => r.json()),
      fetch(`${API_URL}/challenges/${id}/leaderboard`).then(r => r.json()),
    ]).then(([c, lb]) => { setSelected(c); setLeaderboard(Array.isArray(lb) ? lb : []); });
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

  // Landing — two paths
  if (!path) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 20, paddingTop: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>💰 Promo Gigs</Text>
        <Text style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>Promote products or earn money making videos</Text>

        <TouchableOpacity onPress={() => setPath('business')}
          style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 2, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🏢</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111' }}>I'm a Business</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>I want reporters to promote my product or service with video content.</Text>
          <Text style={{ fontSize: 12, color: '#0F7B6C', fontWeight: '600', marginTop: 12 }}>Create a Promo Gig →</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setPath('reporter')}
          style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 2, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🎬</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111' }}>I'm a Reporter</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>I want to earn money by making video reports about products and brands.</Text>
          <Text style={{ fontSize: 12, color: '#0F7B6C', fontWeight: '600', marginTop: 12 }}>Find Promo Gigs →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Business Path
  if (path === 'business') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity onPress={() => setPath(null)} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#0F7B6C', fontSize: 13 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>🏢 For Businesses</Text>
        <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Get dozens of video promotions for your product from trained reporters.</Text>

        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 12 }}>How it works</Text>
          {[
            ['1️⃣', 'Post a Promo Gig', 'Set product, prize pot (min $200), and deadline (min 14 days)'],
            ['2️⃣', 'Reporters Create Videos', 'Trained reporters make videos showcasing your product'],
            ['3️⃣', 'Top 5 Win, You Win', 'Top reporters get paid. You get multiple organic video ads'],
          ].map(([icon, title, desc]) => (
            <View key={title} style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <Text style={{ fontSize: 18 }}>{icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600' }}>{title}</Text>
                <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#0F7B6C', marginBottom: 8 }}>Why Promo Gigs?</Text>
          {['Multiple video reviews from different creators', 'Organic reach — reporters share with followers', 'Pay for results — only top performers earn', 'Trained reporters = quality content', 'Reach audiences across Africa'].map(t => (
            <Text key={t} style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>✅ {t}</Text>
          ))}
        </View>

        <TouchableOpacity onPress={() => Linking.openURL('https://www.reportafrica.africa/challenges/create')}
          style={{ backgroundColor: '#0F7B6C', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Create a Promo Gig</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>You need to register a business first.</Text>
      </ScrollView>
    );
  }

  // Reporter Path — Challenge Detail
  if (selected) {
    const daysLeft = Math.max(0, Math.ceil((new Date(selected.deadline).getTime() - Date.now()) / 86400000));
    const pool70 = Number(selected.potAmount) * 0.7;
    const splits = [34, 24, 19, 13, 10];

    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity onPress={() => setSelected(null)} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#0F7B6C', fontSize: 13 }}>← Back to Gigs</Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{selected.title}</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{selected.description}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 8, padding: 8, alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', color: '#0F7B6C', fontSize: 12 }}>{selected.currency} {Number(selected.potAmount).toLocaleString()}</Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>Pot</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#fef3c7', borderRadius: 8, padding: 8, alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', color: '#92400e', fontSize: 12 }}>{daysLeft}d</Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>Left</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{selected.entryCount}</Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>Entries</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: '#92400e', fontWeight: '600' }}>💰 Prize: {splits.map((s, i) => `#${i+1}=${Math.round(pool70*s/100).toLocaleString()}`).join(' · ')}</Text>
        </View>

        {token && selected.status === 'active' && daysLeft > 0 && (
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>🎬 Submit Entry</Text>
            <TextInput value={reportId} onChangeText={setReportId} placeholder="Paste your report ID"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 8 }} />
            <TouchableOpacity onPress={handleEnter} style={{ backgroundColor: '#0F7B6C', borderRadius: 8, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Submit</Text>
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

  // Reporter Path — Feed
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadChallenges} />}>
      <TouchableOpacity onPress={() => setPath(null)} style={{ marginBottom: 12 }}>
        <Text style={{ color: '#0F7B6C', fontSize: 13 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>🎬 For Reporters</Text>
      <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Make video reports about products. Top 5 by views win cash.</Text>

      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>How it works</Text>
        <Text style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>1️⃣ Find a gig below</Text>
        <Text style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>2️⃣ Create a video report about the product</Text>
        <Text style={{ fontSize: 12, color: '#374151' }}>3️⃣ Top 5 by views split 70% of the pot (34/24/19/13/10%)</Text>
      </View>

      <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 11, color: '#92400e' }}>⚠️ You need Academy courses 1, 2, and 3 completed to participate.</Text>
      </View>

      <Text style={{ fontWeight: 'bold', marginBottom: 12 }}>🔥 Active Gigs</Text>

      {challenges.length === 0 && !loading && (
        <View style={{ alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', borderRadius: 12 }}>
          <Text style={{ fontSize: 28, marginBottom: 8 }}>🎯</Text>
          <Text style={{ color: '#6b7280' }}>No active gigs right now</Text>
        </View>
      )}

      {challenges.map((c: any) => (
        <TouchableOpacity key={c.id} onPress={() => loadDetail(c.id)}
          style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 4 }}>{c.title}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }} numberOfLines={2}>{c.description}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0F7B6C' }}>{c.currency} {Number(c.potAmount).toLocaleString()}</Text>
            <Text style={{ fontSize: 11, color: '#6b7280' }}>{c.entryCount} entries</Text>
            <Text style={{ fontSize: 11, color: '#dc2626' }}>⏰ {Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000))}d</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
