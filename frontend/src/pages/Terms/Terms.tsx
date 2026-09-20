import LegalPageLayout from '../../components/LegalPageLayout';

const sections = [
  {
    heading: '1. Acceptable Use',
    body: 'Zero Bite is provided for public health monitoring, prevention, and response. Platform accounts are issued to Ministry, District, and Community Health Worker personnel for official use; sharing login credentials or using the platform outside your assigned role is not permitted.',
  },
  {
    heading: '2. Advisory, Not Diagnostic',
    body: 'Risk scores and predictions are statistical estimates based on satellite and weather data. They are decision-support tools, not a substitute for clinical diagnosis or professional medical advice. Always consult a health professional for symptoms of illness.',
  },
  {
    heading: '3. SMS Alerts and Charges',
    body: 'SMS alert subscriptions are free to sign up for. Standard carrier SMS rates from your mobile provider may still apply. You can unsubscribe at any time by texting STOP.',
  },
  {
    heading: '4. Service Availability',
    body: 'We aim for continuous availability but do not guarantee the platform will be uninterrupted or error-free. Satellite and weather data providers occasionally have outages outside our control, which may delay updated risk scores.',
  },
  {
    heading: '5. Limitation of Liability',
    body: 'Zero Bite and its partners are not liable for outcomes resulting from reliance on predictive risk data in place of on-the-ground field verification and clinical judgment.',
  },
  {
    heading: '6. Changes to These Terms',
    body: 'We may update these terms as the platform evolves. Continued use of Zero Bite after a change constitutes acceptance of the updated terms.',
  },
];

export default function Terms() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      updated="September 2026"
      intro="These terms govern your use of the Zero Bite platform, whether you're a Ministry official, a District Health Officer, a Community Health Worker, or a member of the public using the free portal."
      sections={sections}
    />
  );
}
