import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

const PAGES: Record<string, { title: string; content: () => React.ReactNode }> = {
  About: {
    title: 'About ReportAfrica',
    content: () => (
      <>
        <Section title="Our Mission">
          ReportAfrica is Africa's citizen-powered live reporting platform. We empower everyday Africans to document, share, and verify events happening in their communities in real time — from traffic incidents and emergencies to government accountability and elections.
        </Section>
        <Section title="Our Story">
          Born out of the need for trustworthy, real-time information across Africa, ReportAfrica was built to give citizens a voice. Traditional media often can't cover the breadth of events happening across the continent. We bridge that gap by turning every citizen into a verified reporter.
        </Section>
        <Section title="Coverage">
          ReportAfrica operates across 32+ African countries including Nigeria, Ghana, Kenya, South Africa, Egypt, Morocco, Ethiopia, Tanzania, and many more.
        </Section>
      </>
    ),
  },
  HowItWorks: {
    title: 'How It Works',
    content: () => (
      <>
        {[
          { num: '1', title: 'Sign Up', desc: 'Create your free account in seconds.' },
          { num: '2', title: 'Report an Incident', desc: 'Add details, photos or video. Location is captured automatically.' },
          { num: '3', title: 'AI Verification', desc: 'Our AI moderates and assigns a verification level.' },
          { num: '4', title: 'Community Verification', desc: 'Nearby citizens confirm or dispute your report.' },
          { num: '5', title: 'Build Trust', desc: 'Accurate reports earn trust points and unlock features.' },
          { num: '6', title: 'Earn & Impact', desc: 'Media houses can license your content. Your reporting makes a difference.' },
        ].map((step) => (
          <View key={step.num} style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>{step.num}</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </>
    ),
  },
  FAQ: {
    title: 'FAQ',
    content: () => (
      <>
        {[
          { q: 'Is it free to use?', a: 'Yes! Creating an account, submitting reports, and viewing the feed is completely free.' },
          { q: 'Can I report anonymously?', a: 'Yes. Toggle anonymous mode when creating a report. Your identity will be hidden.' },
          { q: 'How do trust scores work?', a: 'You earn points for accurate reports and verifications. Points are deducted for flagged content.' },
          { q: 'How do donations work?', a: 'Verified users can create campaigns. Donors contribute via Paystack. Campaigns are reviewed for fraud.' },
          { q: 'Can media houses use my content?', a: 'Yes! Through Media Licensing, news organizations can license your reports. You earn 50% of the fee.' },
          { q: 'What countries are supported?', a: '32+ African countries including Nigeria, Ghana, Kenya, South Africa, Egypt, and more.' },
        ].map((item) => (
          <View key={item.q} style={styles.faqItem}>
            <Text style={styles.faqQ}>{item.q}</Text>
            <Text style={styles.faqA}>{item.a}</Text>
          </View>
        ))}
      </>
    ),
  },
  Guidelines: {
    title: 'Community Guidelines',
    content: () => (
      <>
        <Section title="✅ Do">
          {`• Report only what you personally witness\n• Provide accurate location and details\n• Verify other reports honestly\n• Respect privacy — use face blur\n• Report emergencies to authorities first`}
        </Section>
        <Section title="❌ Don't">
          {`• Submit false or misleading reports\n• Post hate speech or incitement to violence\n• Harass or doxx other users\n• Spam with duplicate content\n• Manipulate trust scores\n• Create fraudulent campaigns\n• Upload, share, or distribute pornographic, sexually explicit, or nude content — this results in an immediate permanent ban`}
        </Section>
        <Section title="Enforcement">
          Violations result in warnings, temporary suspensions, or permanent bans depending on severity.
        </Section>
      </>
    ),
  },
  Privacy: {
    title: 'Privacy Policy',
    content: () => (
      <>
        <Section title="Information We Collect">
          Account info (email, username, country), reports you submit, location data (only when reporting), payment info (processed by Paystack), and usage analytics.
        </Section>
        <Section title="How We Use It">
          To provide the platform, verify reports, calculate trust scores, process payments, send alerts, and prevent fraud.
        </Section>
        <Section title="Anonymous Reporting">
          When you report anonymously, your identity is hidden from other users. We support face blur and voice masking.
        </Section>
        <Section title="Data Sharing">
          We do not sell your data. We share with payment processors and cloud providers as needed.
        </Section>
        <Section title="Contact">
          privacy@reportafrica.com
        </Section>
      </>
    ),
  },
  Terms: {
    title: 'Terms of Service',
    content: () => (
      <>
        <Section title="Content & Reporting">
          You retain ownership of content you submit. Reports must be truthful. False reports result in penalties.
        </Section>
        <Section title="Media Licensing">
          Revenue from licensing is split 50/50 between reporter and platform.
        </Section>
        <Section title="Donations">
          Fraudulent campaigns will be removed. Donations are non-refundable once disbursed.
        </Section>
        <Section title="Prohibited Conduct">
          {`• False reports\n• Hate speech\n• Spam\n• Impersonation\n• Trust score manipulation`}
        </Section>
        <Section title="Contact">
          legal@reportafrica.com
        </Section>
      </>
    ),
  },
  Contact: {
    title: 'Contact Us',
    content: () => (
      <>
        <Section title="Email">support@reportafrica.com</Section>
        <Section title="Office">Lagos, Nigeria</Section>
        <Section title="Social Media">
          Twitter/X: @reportafrica{'\n'}Instagram: @reportafrica{'\n'}LinkedIn: /company/reportafrica
        </Section>
        <Section title="Response Time">We typically respond within 24 hours on business days.</Section>
      </>
    ),
  },
  Careers: {
    title: 'Careers',
    content: () => (
      <>
        <Text style={styles.sectionBody}>Join us in building Africa's most trusted citizen reporting platform. We're remote-first and passionate about civic technology.</Text>
        {[
          'Senior Backend Engineer — Remote',
          'Mobile Engineer (React Native) — Remote',
          'AI/ML Engineer — Remote',
          'Product Designer — Remote',
          'Community Manager — Lagos',
          'Country Lead — Nairobi',
        ].map((role) => (
          <View key={role} style={styles.jobItem}>
            <Text style={styles.jobTitle}>{role}</Text>
          </View>
        ))}
        <Text style={[styles.sectionBody, { marginTop: 16 }]}>Send your CV to careers@reportafrica.com</Text>
      </>
    ),
  },
  Press: {
    title: 'Press & Media Kit',
    content: () => (
      <>
        <Section title="About">
          ReportAfrica is Africa's citizen-powered live reporting platform covering 32+ countries with AI-verified citizen journalism.
        </Section>
        <Section title="Key Facts">
          {`• 32+ African countries\n• 8 report categories\n• Founded 2024\n• HQ: Lagos, Nigeria\n• Platforms: Web, iOS, Android\n• 9+ languages`}
        </Section>
        <Section title="Press Contact">press@reportafrica.com</Section>
      </>
    ),
  },
  Partners: {
    title: 'Partners',
    content: () => (
      <>
        <Section title="Media Houses">
          License verified citizen content for your newsroom. Access real-time reports from across Africa.
        </Section>
        <Section title="Government Agencies">
          Real-time incident monitoring, emergency response coordination, and public safety analytics.
        </Section>
        <Section title="NGOs & Civil Society">
          Leverage citizen reports for humanitarian response, election monitoring, and human rights documentation.
        </Section>
        <Section title="Become a Partner">partners@reportafrica.com</Section>
      </>
    ),
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

export default function InfoScreen({ route }: any) {
  const page = PAGES[route.params?.page] || PAGES.About;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>{page.title}</Text>
      {page.content()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 6 },
  sectionBody: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-start' },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0F7B6C', justifyContent: 'center', alignItems: 'center' },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  stepDesc: { fontSize: 13, color: '#6B7280' },
  faqItem: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  faqQ: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 4 },
  faqA: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  jobItem: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  jobTitle: { fontSize: 14, fontWeight: '500', color: '#111' },
});
