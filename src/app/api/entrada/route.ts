import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const n8nWebhook = process.env.N8N_ENTRADA_WEBHOOK;
    
    if (n8nWebhook) {
      const res = await fetch(n8nWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) throw new Error('Erro ao comunicar com n8n');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
