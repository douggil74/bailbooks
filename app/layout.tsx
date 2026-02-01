import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import 'leaflet/dist/leaflet.css'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://bailbondsfinanced.com'),
  title: {
    default: 'BailBonds Made Easy | St. Tammany Parish Bail Bonds | 24/7 Service',
    template: '%s | BailBonds Made Easy'
  },
  description: 'Fast, affordable bail bonds in St. Tammany Parish, Louisiana. 24/7 emergency service, flexible payment plans, ICE releases. Serving Covington, Mandeville, Slidell. Call now: 985-264-9519. Licensed Louisiana Bail Agents.',
  keywords: [
    'bail bonds St. Tammany Parish',
    'bail bondsman Covington LA',
    'bail bonds Mandeville Louisiana',
    'bail bonds Slidell LA',
    'ICE release bonds Louisiana',
    'immigration bonds St. Tammany',
    '24/7 bail bonds Louisiana',
    'affordable bail bonds',
    'felony bail bonds Louisiana',
    'DUI bail bonds St. Tammany',
    'jail release St. Tammany Parish',
    'Louisiana bail agents'
  ],
  authors: [{ name: 'BailBonds Made Easy' }],
  creator: 'BailBonds Made Easy',
  publisher: 'BailBonds Made Easy',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  openGraph: {
    title: 'BailBonds Made Easy | 24/7 Bail Bonds St. Tammany Parish',
    description: 'Fast, affordable bail bonds in St. Tammany Parish, Louisiana. 24/7 service, flexible payments, ICE releases. Call 985-264-9519',
    url: 'https://bailbondsfinanced.com',
    siteName: 'BailBonds Made Easy',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image',
        width: 1200,
        height: 630,
        alt: 'BailBonds Made Easy - St. Tammany Parish Bail Bonds',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BailBonds Made Easy | 24/7 Bail Bonds St. Tammany Parish',
    description: 'Fast bail bonds in St. Tammany Parish. 24/7 service. Call 985-264-9519',
    images: ['/og-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes when you have them
    // google: 'your-google-verification-code',
    // bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: 'https://bailbondsfinanced.com',
  },
  category: 'Bail Bonds Services',
}

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': 'https://bailbondsfinanced.com/#business',
      name: 'BailBonds Made Easy',
      description: 'Professional bail bond services in St. Tammany Parish, Louisiana. 24/7 emergency service, flexible payment plans, ICE releases.',
      url: 'https://bailbondsfinanced.com',
      telephone: '+1-985-264-9519',
      email: 'info@bailbondsfinanced.com',
      priceRange: '$$',
      image: 'https://bailbondsfinanced.com/og-image.png',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Covington',
        addressRegion: 'LA',
        addressCountry: 'US',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 30.4755,
        longitude: -90.1009,
      },
      areaServed: [
        { '@type': 'City', name: 'Covington', containedInPlace: { '@type': 'State', name: 'Louisiana' } },
        { '@type': 'City', name: 'Mandeville', containedInPlace: { '@type': 'State', name: 'Louisiana' } },
        { '@type': 'City', name: 'Slidell', containedInPlace: { '@type': 'State', name: 'Louisiana' } },
        { '@type': 'City', name: 'Madisonville', containedInPlace: { '@type': 'State', name: 'Louisiana' } },
        { '@type': 'City', name: 'Abita Springs', containedInPlace: { '@type': 'State', name: 'Louisiana' } },
        { '@type': 'AdministrativeArea', name: 'St. Tammany Parish' },
      ],
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
      sameAs: [
        'https://louisianabailagents.org/',
      ],
      parentOrganization: {
        '@type': 'Organization',
        name: 'Louisiana Bail Agents',
        url: 'https://louisianabailagents.org/',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Bail Bond Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Felony & Misdemeanor Bail Bonds',
              description: 'Bail bond services for all criminal charges including theft, assault, and drug possession.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'DUI & Traffic Bail Bonds',
              description: 'Quick release bail bonds for DUI, DWI, and traffic violations.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Immigration & ICE Bonds',
              description: 'Specialized bail bond services for ICE detentions and immigration cases.',
            },
          },
        ],
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://bailbondsfinanced.com/#website',
      url: 'https://bailbondsfinanced.com',
      name: 'BailBonds Made Easy',
      description: 'St. Tammany Parish Bail Bonds - 24/7 Service',
      publisher: { '@id': 'https://bailbondsfinanced.com/#business' },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://bailbondsfinanced.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How quickly can you get someone out of jail in St. Tammany Parish?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'In most cases, we can begin the release process immediately after you call. Depending on the jail and processing times, release can occur within 2-8 hours. We work around the clock to expedite the process.',
          },
        },
        {
          '@type': 'Question',
          name: 'What payment options do you offer for bail bonds?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We offer flexible payment plans with small down payment options. We accept cash, credit cards, and can work with you on a payment schedule that fits your budget.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do you handle ICE and immigration bonds in Louisiana?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, we specialize in immigration bonds and ICE releases. These cases require specific expertise with federal procedures, and our team is experienced in navigating the immigration bond process.',
          },
        },
        {
          '@type': 'Question',
          name: 'What information do I need to bail someone out?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You will need the full legal name of the person in custody, their date of birth, the jail location, and the charges if known. We can help you gather additional information once you call us.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are your bail bond services confidential?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. We understand the sensitive nature of these situations and maintain complete confidentiality. Your privacy is protected throughout the entire process.',
          },
        },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://bailbondsfinanced.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
