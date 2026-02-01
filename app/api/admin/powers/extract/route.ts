import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use PNG, JPG, WebP, or PDF.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum 10 MB.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mediaType = file.type === 'application/pdf' ? 'application/pdf' : file.type;
    const dataUrl = `data:${mediaType};base64,${base64}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'high' },
            },
            {
              type: 'text',
              text: `This is a bail bond power document. Extract the following fields and return ONLY a JSON object with no other text:
- "power_number": the power / bond number (alphanumeric string printed on the document)
- "amount": the dollar amount of the power (number, no dollar sign or commas)
- "surety": the surety / insurance company name

If you cannot determine a field, set its value to null.
Return ONLY valid JSON, no markdown fences.`,
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';

    let parsed: { power_number: string | null; amount: number | null; surety: string | null };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: 'Could not parse document. Try a clearer image.' },
        { status: 422 },
      );
    }

    return NextResponse.json({
      power_number: parsed.power_number ?? null,
      amount: parsed.amount ?? null,
      surety: parsed.surety ?? null,
    });
  } catch (err: unknown) {
    console.error('Power extract error:', err);
    return NextResponse.json(
      { error: 'Extraction failed. Please try again.' },
      { status: 500 },
    );
  }
}
