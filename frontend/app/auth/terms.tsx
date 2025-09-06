import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Terms and Conditions</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: December 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By accessing and using the Voyage Yo service, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. User Accounts</Text>
          <Text style={styles.sectionText}>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password.
          </Text>
          <Text style={styles.sectionText}>
            You must be at least 18 years old to create an account. By creating an account, you represent and warrant that you meet this age requirement.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Travel Services</Text>
          <Text style={styles.sectionText}>
            Our service provides AI-powered travel planning and recommendations. While we strive for accuracy, we cannot guarantee the availability, pricing, or quality of third-party travel services.
          </Text>
          <Text style={styles.sectionText}>
            All bookings and purchases are subject to the terms and conditions of the respective service providers (airlines, hotels, tour operators, etc.).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Collection and Privacy</Text>
          <Text style={styles.sectionText}>
            We collect and process your personal information to provide our services, including travel preferences, booking history, and usage data. This information helps us personalize your experience and improve our recommendations.
          </Text>
          <Text style={styles.sectionText}>
            Your data is protected according to our Privacy Policy. We do not sell your personal information to third parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. AI and Machine Learning</Text>
          <Text style={styles.sectionText}>
            Our service uses artificial intelligence and machine learning to provide personalized travel recommendations. These systems learn from your interactions and preferences to improve suggestions over time.
          </Text>
          <Text style={styles.sectionText}>
            While our AI strives for accuracy, recommendations are suggestions only and should not be considered as professional travel advice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. User Content</Text>
          <Text style={styles.sectionText}>
            You may submit reviews, ratings, and feedback about your travel experiences. You retain ownership of your content but grant us a license to use it to improve our services.
          </Text>
          <Text style={styles.sectionText}>
            You agree not to submit false, misleading, or inappropriate content. We reserve the right to remove content that violates our community guidelines.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Payment and Billing</Text>
          <Text style={styles.sectionText}>
            Some features may require payment. All fees are non-refundable unless otherwise stated. We use secure third-party payment processors to handle transactions.
          </Text>
          <Text style={styles.sectionText}>
            Prices and availability are subject to change without notice. We are not responsible for price changes by third-party service providers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            Voyage Yo is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use of our service, including but not limited to travel disruptions, booking errors, or data loss.
          </Text>
          <Text style={styles.sectionText}>
            We are not responsible for the actions of third-party service providers, including airlines, hotels, tour operators, or payment processors.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Service Availability</Text>
          <Text style={styles.sectionText}>
            We strive to maintain high service availability but cannot guarantee uninterrupted access. We may temporarily suspend service for maintenance or updates.
          </Text>
          <Text style={styles.sectionText}>
            We are not responsible for service interruptions caused by factors beyond our control, such as internet connectivity issues or third-party service outages.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Termination</Text>
          <Text style={styles.sectionText}>
            You may terminate your account at any time by contacting our support team. We may terminate your account for violations of these terms or for any other reason at our discretion.
          </Text>
          <Text style={styles.sectionText}>
            Upon termination, your access to the service will cease immediately, but we may retain certain information as required by law or for legitimate business purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
          <Text style={styles.sectionText}>
            We may update these terms from time to time. We will notify you of significant changes via email or through the app. Continued use of the service after changes constitutes acceptance of the new terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Governing Law</Text>
          <Text style={styles.sectionText}>
            These terms are governed by the laws of the jurisdiction in which Voyage Yo operates. Any disputes will be resolved in the appropriate courts of that jurisdiction.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Contact Information</Text>
          <Text style={styles.sectionText}>
            If you have questions about these terms, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>
            Email: legal@voyageyo.com{'\n'}
            Address: 123 Travel Street, Adventure City, AC 12345{'\n'}
            Phone: +1 (555) 123-4567
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Voyage Yo, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sectionText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 12,
    fontWeight: '400',
  },
  contactInfo: {
    fontSize: 16,
    color: '#6366f1',
    lineHeight: 24,
    fontWeight: '500',
    marginTop: 8,
  },
  footer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
}); 