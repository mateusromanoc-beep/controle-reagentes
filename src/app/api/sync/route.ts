import { NextResponse } from 'next/server';
import { upsertTasks, StatusType } from '@/lib/db';

export async function GET() {
  return NextResponse.json({ message: "Rota Ativa! Configure seu nó no n8n para fazer requisições POST para este endereço." });
}

export async function POST(req: Request) {
  try {
    let data;
    try {
      // Handles native JSON sent by n8n
      data = await req.json();
    } catch {
      return NextResponse.json({ error: "O Corpo da requisição deve ser um JSON válido" }, { status: 400 });
    }

    const criticos = data.criticos || [];
    const baixos = data.baixos || [];
    const vencidos = data.vencidos || [];
    const vencendo_breve = data.vencendo_breve || [];
    const em_uso_vencendo = data.em_uso_vencendo || [];
    const estoque = data.estoque || [];

    const newTasks: any[] = [];

    const parseEntry = (entryStr: string, status: StatusType) => {
      const idParts = entryStr.split(" | ");
      const rawId = idParts[0].trim().replace(/\s/g, "-");
      
      return {
        id: `REA-${rawId}-${Math.floor(Math.random()*1000)}`,
        title: `Reagente #${idParts[0].trim()}`,
        description: entryStr.replace(`${idParts[0]} | `, ''),
        status
      };
    };

    criticos.forEach((e: string) => newTasks.push(parseEntry(e, "Crítico")));
    vencidos.forEach((e: string) => newTasks.push(parseEntry(e, "Vencido")));
    em_uso_vencendo.forEach((e: string) => newTasks.push(parseEntry(e, "Uso Vencendo")));
    baixos.forEach((e: string) => newTasks.push(parseEntry(e, "Baixo")));
    vencendo_breve.forEach((e: string) => newTasks.push(parseEntry(e, "Vencendo Breve")));
    estoque.forEach((e: string) => newTasks.push(parseEntry(e, "Estoque")));

    // Subtitui tudo diariamente pelo mais atualizado do n8n / sheets
    await upsertTasks(newTasks);

    return NextResponse.json({ success: true, processed: newTasks.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
