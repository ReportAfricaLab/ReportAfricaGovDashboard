import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { reportsAPI } from '../services/api';
import { getCurrentLocation } from '../services/location';
import { theme } from '../theme';

interface MapReport {
  id: string;
  title: string;
  category: string;
  severity: string;
  latitude: number;
  longitude: number;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return theme.colors.emergency;
    case 'high': return theme.colors.humanitarian;
    case 'medium': return theme.colors.secondary;
    default: return theme.colors.info;
  }
};

const buildMapHTML = (lat: number, lng: number, reports: MapReport[]) => {
  const markers = reports.map(r => `
    L.circleMarker([${r.latitude}, ${r.longitude}], {
      radius: 10, fillColor: '${getSeverityColor(r.severity)}', color: '#fff', weight: 2, fillOpacity: 0.9
    }).addTo(map).on('click', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({id:'${r.id}',title:${JSON.stringify(r.title)},category:'${r.category}',severity:'${r.severity}'}));
    });
  `).join('\n');

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%}</style>
</head><body>
<div id="map"></div>
<script>
var map = L.map('map').setView([${lat}, ${lng}], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);
L.circleMarker([${lat}, ${lng}], {radius:8, fillColor:'#0F7B6C', color:'#fff', weight:3, fillOpacity:1}).addTo(map).bindPopup('You are here');
${markers}
</script>
</body></html>`;
};

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const [reports, setReports] = useState<MapReport[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selected, setSelected] = useState<MapReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const loc = await getCurrentLocation();
        if (loc) {
          setLocation({ latitude: loc.latitude, longitude: loc.longitude });
          const res = await reportsAPI.getNearby(loc.latitude, loc.longitude, 15);
          setReports(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.log('Location error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setSelected(data);
    } catch {}
  };

  if (loading || !location) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{loading ? 'Loading map...' : 'Unable to detect location'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        style={styles.map}
        source={{ html: buildMapHTML(location.latitude, location.longitude, reports) }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
      />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{reports.length} nearby</Text>
      </View>

      {selected && (
        <View style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.severityDot, { backgroundColor: getSeverityColor(selected.severity) }]} />
            <Text style={styles.cardCategory}>{selected.category?.replace('_', ' ')} · {selected.severity}</Text>
            <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{selected.title}</Text>
          <TouchableOpacity style={styles.viewBtn} onPress={() => { setSelected(null); navigation.navigate('ReportDetail', { id: selected.id }); }}>
            <Text style={styles.viewBtnText}>View Report →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, width: Dimensions.get('window').width },
  badge: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  badgeText: { fontSize: 12, fontWeight: '600', color: theme.colors.light.text },
  bottomCard: { position: 'absolute', bottom: 30, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  severityDot: { width: 10, height: 10, borderRadius: 5 },
  cardCategory: { flex: 1, fontSize: 12, color: theme.colors.light.textSecondary, textTransform: 'capitalize' },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 16, color: theme.colors.light.textSecondary },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.light.text, marginBottom: 12 },
  viewBtn: { backgroundColor: theme.colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  viewBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.light.background },
  loadingText: { color: theme.colors.light.textSecondary, fontSize: 14 },
});
