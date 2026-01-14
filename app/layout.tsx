import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bailbonds Financed | St. Tammany Parish Bail Bonds | 24/7 Service',
  description: 'Fast, affordable bail bonds in St. Tammany Parish, Louisiana. 24/7 service, flexible payment plans, ICE releases. Call now: 985-264-9519. Licensed Louisiana Bail Agents.',
  keywords: 'bail bonds, St. Tammany Parish, Louisiana, ICE release, immigration bonds, 24/7 bail bonds, Covington, Mandeville, Slidell',
  openGraph: {
    title: 'Bailbonds Financed | St. Tammany Parish Bail Bonds',
    description: 'Fast, affordable bail bonds in St. Tammany Parish. 24/7 service. Call 985-264-9519',
    type: 'website',
  },
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
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
