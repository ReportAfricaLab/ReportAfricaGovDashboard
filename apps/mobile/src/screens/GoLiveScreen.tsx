import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getCurrentLocation } from '../services/location';
import { livestreamAPI, WS_URL, getAuthToken } from '../services/api';
import { theme } from '../theme';
import io, { Socket } from 'socket.io-client';

type Tab = 'watch' | 'golive' | 'recordings';

interface Stream {
  id: string;
  title: string;
  description?: string;
  status: string;
  viewerCount?: number;
  playbackUrl?: string;
  createdAt: string;
  user?: { displayName: string };
}

interface ChatMessage {
  id?: string;
  userId: string;
  username: string;
  text: string;
  createdAt?: string;
}

export default function GoLiveScreen() {
  const { token, user, country } = useAppStore();
  const [tab, setTab] = useState<Tab>('watch');

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {(['watch', 'golive', 'recordings'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'watch' ? '📺 Live' : t === 'golive' ? '🔴 Go Live' : '🎬 Replay'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'watch' && <WatchTab country={country} token={token} user={user} />}
      {tab === 'golive' && <GoLiveTab token={token} user={user} />}
      {tab === 'recordings' && <RecordingsTab country={country} />}
    </View>
  );
}

// === WATCH TAB ===
function WatchTab({ country, token, user }: { country: string; token: string | null; user: any }) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selected, setSelected] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreams();
  }, [country]);

  const loadStreams = async () => {
    try {
      const res = await livestreamAPI.getActive(country);
      setStreams(Array.isArray(res.data) ? res.data : []);
    } catch { setStreams([]); }
    finally { setLoading(false); }
  };

  if (selected) {
    return <StreamViewer stream={selected} token={token} user={user} onBack={() => setSelected(null)} />;
  }

  return (
    <FlatList
      data={streams}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Loading...' : 'No live streams right now'}</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.streamCard} onPress={() => setSelected(item)}>
          <View style={styles.streamCardHeader}>
            <View style={styles.liveDot} />
            <Text style={styles.streamViewers}>{item.viewerCount || 0} watching</Text>
          </View>
          <Text style={styles.streamTitle}>{item.title}</Text>
          <Text style={styles.streamMeta}>{item.user?.displayName || 'Anonymous'}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

// === STREAM VIEWER WITH CHAT ===
function StreamViewer({ stream, token, user, onBack }: { stream: Stream; token: string | null; user: any; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [viewers, setViewers] = useState(stream.viewerCount || 0);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load chat history
    livestreamAPI.getChatHistory(stream.id).then(res => {
      if (Array.isArray(res.data)) setMessages(res.data);
    }).catch(() => {});

    // Connect socket
    const socket = io(WS_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:stream', { streamId: stream.id });
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('viewer:count', (count: number) => setViewers(count));

    return () => {
      socket.emit('leave:stream', { streamId: stream.id });
      socket.disconnect();
    };
  }, [stream.id]);

  const sendMessage = () => {
    if (!chatText.trim() || !socketRef.current) return;
    socketRef.current.emit('chat:send', { streamId: stream.id, text: chatText.trim() });
    setChatText('');
  };

  return (
    <KeyboardAvoidingView style={styles.viewerContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Stream info header */}
      <View style={styles.viewerHeader}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
        <View style={styles.viewerInfo}>
          <View style={styles.liveDot} />
          <Text style={styles.viewerCount}>{viewers} watching</Text>
        </View>
      </View>

      {/* Video placeholder */}
      <View style={styles.videoPlaceholder}>
        <Text style={styles.videoText}>📺 {stream.title}</Text>
        <Text style={styles.videoSub}>{stream.playbackUrl ? 'Stream playing...' : 'Connecting...'}</Text>
      </View>

      {/* Chat */}
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          style={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item }) => (
            <View style={styles.chatMsg}>
              <Text style={styles.chatUser}>{item.username}</Text>
              <Text style={styles.chatMsgText}>{item.text}</Text>
            </View>
          )}
        />
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            value={chatText}
            onChangeText={setChatText}
            placeholder="Say something..."
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.chatSendBtn} onPress={sendMessage}>
            <Text style={styles.chatSendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// === GO LIVE TAB ===
function GoLiveTab({ token, user }: { token: string | null; user: any }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stream, setStream] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [viewers, setViewers] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const createStream = async () => {
    if (!title) { Alert.alert('Error', 'Enter a title'); return; }
    setCreating(true);
    try {
      const loc = await getCurrentLocation();
      const res = await livestreamAPI.create({ title, description, latitude: loc?.latitude, longitude: loc?.longitude });
      setStream(res.data);
    } catch { Alert.alert('Error', 'Failed to create stream'); }
    finally { setCreating(false); }
  };

  const goLive = async () => {
    try {
      await livestreamAPI.goLive(stream.id);
      setIsLive(true);
      // Connect socket for chat
      const socket = io(WS_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('join:stream', { streamId: stream.id }));
      socket.on('chat:message', (msg: ChatMessage) => setMessages(prev => [...prev, msg]));
      socket.on('viewer:count', (count: number) => setViewers(count));
    } catch { Alert.alert('Error', 'Failed to go live'); }
  };

  const endStream = async () => {
    try {
      await livestreamAPI.end(stream.id);
      socketRef.current?.disconnect();
      setIsLive(false);
      setStream(null);
      setTitle('');
      setDescription('');
      setMessages([]);
      Alert.alert('Stream Ended', 'Your livestream has been saved.');
    } catch { Alert.alert('Error', 'Failed to end stream'); }
  };

  const sendMessage = () => {
    if (!chatText.trim() || !socketRef.current) return;
    socketRef.current.emit('chat:send', { streamId: stream.id, text: chatText.trim() });
    setChatText('');
  };

  // Live state with chat
  if (isLive && stream) {
    return (
      <KeyboardAvoidingView style={styles.liveContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.liveHeader}>
          <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>● LIVE</Text></View>
          <Text style={styles.viewerCount}>{viewers} watching</Text>
        </View>
        <Text style={styles.liveTitle}>{stream.title}</Text>

        {/* Live chat */}
        <FlatList
          data={messages}
          keyExtractor={(_, i) => String(i)}
          style={styles.liveChatList}
          renderItem={({ item }) => (
            <View style={styles.chatMsg}>
              <Text style={[styles.chatUser, { color: '#aaa' }]}>{item.username}</Text>
              <Text style={[styles.chatMsgText, { color: '#fff' }]}>{item.text}</Text>
            </View>
          )}
        />
        <View style={styles.chatInputRow}>
          <TextInput style={[styles.chatInput, { color: '#fff', borderColor: '#444' }]} value={chatText} onChangeText={setChatText} placeholder="Chat..." placeholderTextColor="#666" onSubmitEditing={sendMessage} returnKeyType="send" />
          <TouchableOpacity style={styles.chatSendBtn} onPress={sendMessage}><Text style={styles.chatSendText}>Send</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.endBtn} onPress={endStream}>
          <Text style={styles.endBtnText}>End Stream</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  // Stream ready
  if (stream) {
    return (
      <ScrollView contentContainerStyle={styles.padded}>
        <Text style={styles.heading}>Stream Ready</Text>
        <Text style={styles.subheading}>{stream.title}</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Ingest Endpoint:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>{stream.ingestEndpoint}</Text>
        </View>
        <TouchableOpacity style={styles.goLiveBtn} onPress={goLive}>
          <Text style={styles.goLiveBtnText}>🔴 GO LIVE</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Use a streaming app (e.g. Larix) with the ingest endpoint, or tap GO LIVE to mark active.</Text>
      </ScrollView>
    );
  }

  // Create form
  return (
    <ScrollView contentContainerStyle={styles.padded}>
      <Text style={styles.heading}>Start a Livestream</Text>
      <Text style={styles.subheading}>Broadcast what's happening in real time</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Stream title" />
      <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Description (optional)" multiline />
      <TouchableOpacity style={[styles.goLiveBtn, creating && { opacity: 0.6 }]} onPress={createStream} disabled={creating}>
        <Text style={styles.goLiveBtnText}>{creating ? 'Setting up...' : 'Create Stream'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// === RECORDINGS TAB ===
function RecordingsTab({ country }: { country: string }) {
  const [recordings, setRecordings] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    livestreamAPI.getRecordings(country).then(res => {
      setRecordings(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [country]);

  return (
    <FlatList
      data={recordings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Loading...' : 'No recordings yet'}</Text>}
      renderItem={({ item }) => (
        <View style={styles.streamCard}>
          <Text style={styles.streamTitle}>{item.title}</Text>
          <Text style={styles.streamMeta}>{item.user?.displayName} · {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light.background },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: theme.colors.light.border, paddingTop: 50 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.emergency },
  tabText: { fontSize: 13, color: theme.colors.light.textSecondary, fontWeight: '600' },
  tabTextActive: { color: theme.colors.emergency },
  listContent: { padding: 16, gap: 12 },
  streamCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.light.border },
  streamCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.emergency },
  streamViewers: { fontSize: 12, color: theme.colors.light.textSecondary },
  streamTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.light.text },
  streamMeta: { fontSize: 12, color: theme.colors.light.textSecondary, marginTop: 4 },
  emptyText: { textAlign: 'center', color: theme.colors.light.textSecondary, marginTop: 60, fontSize: 14 },
  // Viewer
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  viewerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingTop: 50 },
  backBtn: { color: '#fff', fontSize: 14, fontWeight: '600' },
  viewerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewerCount: { color: '#ccc', fontSize: 12 },
  videoPlaceholder: { height: 200, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  videoText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  videoSub: { color: '#666', fontSize: 12, marginTop: 4 },
  chatContainer: { flex: 1, backgroundColor: '#111' },
  chatList: { flex: 1, padding: 12 },
  chatMsg: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chatUser: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  chatMsgText: { fontSize: 12, color: theme.colors.light.text, flex: 1 },
  chatInputRow: { flexDirection: 'row', padding: 8, gap: 8, borderTopWidth: 1, borderTopColor: '#333' },
  chatInput: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, borderWidth: 1, borderColor: theme.colors.light.border },
  chatSendBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  chatSendText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  // Go Live
  liveContainer: { flex: 1, backgroundColor: '#000', padding: 16, paddingTop: 50 },
  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  liveBadge: { backgroundColor: theme.colors.emergency, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  liveBadgeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  liveTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  liveChatList: { flex: 1, marginBottom: 8 },
  endBtn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  endBtnText: { color: theme.colors.emergency, fontSize: 16, fontWeight: '700' },
  // Create
  padded: { padding: 16, paddingTop: 20 },
  heading: { fontSize: 20, fontWeight: '700', color: theme.colors.light.text },
  subheading: { fontSize: 13, color: theme.colors.light.textSecondary, marginBottom: 20 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.light.border, borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12 },
  infoBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.light.border, marginBottom: 12 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.light.textSecondary, marginBottom: 4 },
  infoValue: { fontSize: 11, color: theme.colors.light.text, fontFamily: 'monospace' },
  goLiveBtn: { backgroundColor: theme.colors.emergency, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  goLiveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  hint: { marginTop: 14, fontSize: 12, color: theme.colors.light.textSecondary, textAlign: 'center', lineHeight: 18 },
});
