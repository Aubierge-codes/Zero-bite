import LegalPageLayout from '../../components/LegalPageLayout';

const sections = [
  {
    heading: '1. Information We Collect',
    body: 'When you use the Public Portal or subscribe to SMS alerts, we collect the phone number and district you provide. Registered platform users (Ministry, District, and CHW accounts) additionally have a name, role, and assigned district on file. We do not collect location data from your device -- risk lookups are based on the district you search for.',
  },
  {
    heading: '2. How We Use Your Information',
    body: 'Phone numbers are used solely to deliver malaria risk alerts and prevention guidance for the district you subscribed to. Platform account data is used to grant the correct level of dashboard access and to attribute field actions (alert dispatches, treatment logs) to the responsible team.',
  },
  {
    heading: '3. Data Sharing',
    body: 'We share aggregated, de-identified risk data with the Ministry of Health for national planning. We do not sell personal data to third parties. SMS delivery partners only receive the minimum information required to route a message.',
  },
  {
    heading: '4. Data Retention',
    body: 'Subscriber phone numbers are retained until you unsubscribe by texting STOP. Platform account activity logs are retained for one season for compliance review, in line with Rwanda Ministry of Health data privacy standards.',
  },
  {
    heading: '5. Your Rights',
    body: 'You can unsubscribe from SMS alerts at any time by texting STOP. Registered users can request a copy of, or the deletion of, their account data by contacting our support team.',
  },
  {
    heading: '6. Contact Us',
    body: 'Questions about this policy can be sent to hello@zerobite.rw or through our Contact page.',
  },
];

export default function Privacy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      updated="September 2026"
      intro="Zero Bite is built to protect communities, which starts with protecting your data. This policy explains what we collect, why, and how you stay in control of it."
      sections={sections}
    />
  );
}
