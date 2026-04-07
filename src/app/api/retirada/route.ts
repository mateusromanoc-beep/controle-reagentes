import { NextResponse } from 'next/server';
import { updateTaskStatus } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { id, title, responsavel, novaValidade } = await req.json();

    const rawId = title.split('#')[1] || id;

    const n8nWebhook = process.env.N8N_RETIRADA_WEBHOOK;
    
    if (n8nWebhook) {
      await fetch(n8nWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawId, id, title, responsavel, novaValidade })
      });
    }

    // Move no Redis para "Uso Vencendo" (ou status similar de uso)
    const updated = await updateTaskStatus(id, "Uso Vencendo");

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
