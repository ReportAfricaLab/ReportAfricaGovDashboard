import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authAPI } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { theme } from '../theme';

export default function LoginScreen({ navigation }: any) {
  const { setAuth } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      setAuth(res.data.user, res.data.token);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>ReportAfrica</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.form}>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.oauthRow}>
        <TouchableOpacity style={styles.oauthBtn} onPress={() => Alert.alert('Google Sign-In', 'Configure expo-auth-session for Google OAuth')}>
          <Text style={styles.oauthBtnText}>G  Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.oauthBtn, styles.oauthBtnApple]} onPress={() => Alert.alert('Apple Sign-In', 'Configure expo-apple-authentication')}>
          <Text style={[styles.oauthBtnText, { color: '#fff' }]}>  Apple</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
        <Text style={styles.link}>Don&apos;t have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light.background, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 40, alignItems: 'center' },
  brand: { fontSize: 32, fontWeight: '800', color: theme.colors.primary },
  subtitle: { fontSize: theme.fontSize.md, color: theme.colors.light.textSecondary, marginTop: 8 },
  form: { gap: 14 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.light.border, borderRadius: theme.borderRadius.sm, padding: 14, fontSize: theme.fontSize.md },
  btn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: theme.borderRadius.sm, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.light.border },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: theme.colors.light.textSecondary },
  oauthRow: { flexDirection: 'row', gap: 12 },
  oauthBtn: { flex: 1, paddingVertical: 14, borderRadius: theme.borderRadius.sm, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.light.border },
  oauthBtnApple: { backgroundColor: '#000', borderColor: '#000' },
  oauthBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.light.text },
  link: { textAlign: 'center', marginTop: 24, fontSize: theme.fontSize.sm, color: theme.colors.light.textSecondary },
  linkBold: { color: theme.colors.primary, fontWeight: '600' },
});
