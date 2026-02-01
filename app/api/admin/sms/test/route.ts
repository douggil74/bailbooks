import { NextResponse } from 'next/server';

export async function GET() {
  const PROJECT_ID = process.env.SIGNALWIRE_PROJECT_ID;
  const API_TOKEN = process.env.SIGNALWIRE_API_TOKEN;
  const SPACE_URL = process.env.SIGNALWIRE_SPACE_URL;
  const FROM_NUMBER = process.env.SIGNALWIRE_PHONE_NUMBER;

  const config = {
    project_id: PROJECT_ID ? `${PROJECT_ID.slice(0, 8)}...` : 'MISSING',
    api_token: API_TOKEN ? `${API_TOKEN.slice(0, 6)}...` : 'MISSING',
    space_url: SPACE_URL || 'MISSING',
    from_number: FROM_NUMBER || 'MISSING',
  };

  if (!PROJECT_ID || !API_TOKEN || !SPACE_URL || !FROM_NUMBER) {
    return NextResponse.json({ error: 'SignalWire not fully configured', config });
  }

  // Send a real test SMS to the from number itself
  const url = `https://${SPACE_URL}/api/laml/2010-04-01/Accounts/${PROJECT_ID}/Messages`;
  const auth = 'Basic ' + Buffer.from(`${PROJECT_ID}:${API_TOKEN}`).toString('base64');

  const testPhone = '+19852372805'; // Doug's number from the case
  const params = new URLSearchParams();
  params.append('From', FROM_NUMBER);
  params.append('To', testPhone);
  params.append('Body', 'BailBonds SMS test — if you see this, SignalWire is working.');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    return NextResponse.json({
      config,
      request: { url, from: FROM_NUMBER, to: testPhone },
      response: { status: res.status, statusText: res.statusText, body: data },
    });
  } catch (err) {
    return NextResponse.json({
      config,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
