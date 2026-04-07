import { NextResponse } from 'next/server';
import { updateTaskStatus } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { id, title } = await req.json();

    // Extrai o rawId do título (formato: "Reagente #Nome")
    const rawId = title.split('#')[1] || id;

    // 1. Notifica o n8n para atualizar o Google Sheets
    const n8nWebhook = process.env.N8N_DESCARTE_WEBHOOK;
    
    if (n8nWebhook) {
      try {
        await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawId, id, title })
        });
      } catch (err) {
        console.error('[descarte] Erro ao chamar n8n:', err);
      }
    } else {
      console.warn('[descarte] Variável N8N_DESCARTE_WEBHOOK não configurada');
    }

    // 2. Atualiza o status no banco de dados local (Redis)
    const updated = await updateTaskStatus(id, "Descarte");

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
