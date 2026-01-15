import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage: 'linear-gradient(135deg, #1a4d2e 0%, #0f3620 50%, #0a0a0a 100%)',
        }}
      >
        {/* Shield Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d4af37"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        {/* Company Name */}
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 800,
            color: 'white',
            marginBottom: 10,
          }}
        >
          Bailbonds{' '}
          <span style={{ color: '#d4af37', marginLeft: 16 }}>Financed</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#9ca3af',
            marginBottom: 40,
          }}
        >
          24/7 Bail Bonds • St. Tammany Parish, LA
        </div>

        {/* Phone */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#d4af37',
            color: '#0a0a0a',
            padding: '16px 40px',
            borderRadius: 50,
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          📞 985-264-9519
        </div>

        {/* Services */}
        <div
          style={{
            display: 'flex',
            gap: 30,
            marginTop: 40,
            fontSize: 20,
            color: '#9ca3af',
          }}
        >
          <span>✓ Felony & Misdemeanor</span>
          <span>✓ DUI Bonds</span>
          <span>✓ ICE Releases</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
