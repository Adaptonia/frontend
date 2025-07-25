import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Goal Pack - Adaptonia',
  description: 'Transform your dreams into achievable goals with Adaptonia. Join thousands of users achieving their goals with our structured approach and community support.',
  openGraph: {
    title: 'Goal Pack - Adaptonia',
    description: 'Transform your dreams into achievable goals with Adaptonia. Join thousands of users achieving their goals with our structured approach and community support.',
    type: 'website',
    url: 'https://adaptonia.com',
    siteName: 'Adaptonia',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Adaptonia - Transform dreams into achievable goals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Goal Pack - Adaptonia',
    description: 'Transform your dreams into achievable goals with Adaptonia. Join thousands of users achieving their goals with our structured approach and community support.',
    images: ['/logo.png'],
  },
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 