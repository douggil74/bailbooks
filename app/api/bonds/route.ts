import { Client } from 'pg';
import { NextResponse } from 'next/server';

function getClient() {
  return new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
}

// Initialize table if not exists
async function initTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS bonds (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      phone VARCHAR(20),
      date DATE,
      amt DECIMAL(12,2) DEFAULT 0,
      down DECIMAL(12,2) DEFAULT 0,
      jail_fee DECIMAL(12,2) DEFAULT 30,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  // Add columns if they don't exist (for existing tables)
  await client.query(`ALTER TABLE bonds ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`);
  await client.query(`ALTER TABLE bonds ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
}

// GET - fetch all bonds
export async function GET() {
  const client = getClient();
  try {
    await client.connect();
    await initTable(client);
    const { rows } = await client.query('SELECT * FROM bonds ORDER BY date DESC, id DESC');

    // Transform to match frontend format
    const bonds = rows.map(row => ({
      id: row.id,
      name: row.name || '',
      phone: row.phone || '',
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
      amt: parseFloat(row.amt) || 0,
      down: parseFloat(row.down) || 0,
      jailFee: parseFloat(row.jail_fee) || 30,
      status: row.status || 'active',
    }));

    return NextResponse.json(bonds);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bonds' }, { status: 500 });
  } finally {
    await client.end();
  }
}

// POST - create new bond
export async function POST(request: Request) {
  const client = getClient();
  try {
    await client.connect();
    await initTable(client);
    const body = await request.json();

    const { rows } = await client.query(
      'INSERT INTO bonds (name, phone, date, amt, down, jail_fee, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [body.name || '', body.phone || '', body.date || null, body.amt || 0, body.down || 0, body.jailFee || 30, 'active']
    );

    const bond = {
      id: rows[0].id,
      name: rows[0].name || '',
      phone: rows[0].phone || '',
      date: rows[0].date ? new Date(rows[0].date).toISOString().split('T')[0] : '',
      amt: parseFloat(rows[0].amt) || 0,
      down: parseFloat(rows[0].down) || 0,
      jailFee: parseFloat(rows[0].jail_fee) || 30,
      status: rows[0].status || 'active',
    };

    return NextResponse.json(bond);
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Failed to create bond' }, { status: 500 });
  } finally {
    await client.end();
  }
}

// PUT - update bond
export async function PUT(request: Request) {
  const client = getClient();
  try {
    await client.connect();
    const body = await request.json();

    const { rows } = await client.query(
      'UPDATE bonds SET name = $1, phone = $2, date = $3, amt = $4, down = $5, jail_fee = $6, status = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
      [body.name || '', body.phone || '', body.date || null, body.amt || 0, body.down || 0, body.jailFee || 30, body.status || 'active', body.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Bond not found' }, { status: 404 });
    }

    const bond = {
      id: rows[0].id,
      name: rows[0].name || '',
      phone: rows[0].phone || '',
      date: rows[0].date ? new Date(rows[0].date).toISOString().split('T')[0] : '',
      amt: parseFloat(rows[0].amt) || 0,
      down: parseFloat(rows[0].down) || 0,
      jailFee: parseFloat(rows[0].jail_fee) || 30,
      status: rows[0].status || 'active',
    };

    return NextResponse.json(bond);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Failed to update bond' }, { status: 500 });
  } finally {
    await client.end();
  }
}

// DELETE - delete bond
export async function DELETE(request: Request) {
  const client = getClient();
  try {
    await client.connect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await client.query('DELETE FROM bonds WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete bond' }, { status: 500 });
  } finally {
    await client.end();
  }
}
