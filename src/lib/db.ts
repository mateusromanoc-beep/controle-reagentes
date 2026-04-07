export type StatusType = "Crítico" | "Baixo" | "Vencido" | "Vencendo Breve" | "Uso Vencendo";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: StatusType;
  createdAt: string;
}

// Banco de dados usando Vercel KV (Redis) com variáveis de ambiente injetadas pela Vercel
// Fallback para array em memória se KV não estiver configurado
async function getKV() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function kvGet(key: string): Promise<unknown> {
  const kv = await getKV();
  if (!kv) return null;
  const res = await fetch(`${kv.url}/get/${key}`, {
    headers: { Authorization: `Bearer ${kv.token}` },
    cache: 'no-store'
  });
  if (!res.ok) return null;
  const data = await res.json() as { result: unknown };
  return data.result;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const kv = await getKV();
  if (!kv) return;
  await fetch(`${kv.url}/set/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kv.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(value)
  });
}

export async function getTasks(): Promise<Task[]> {
  try {
    const raw = await kvGet('kanban_tasks');
    if (!raw) return [];
    // O Upstash/KV retorna a string JSON, precisa fazer parse
    if (typeof raw === 'string') return JSON.parse(raw) as Task[];
    if (Array.isArray(raw)) return raw as Task[];
    return [];
  } catch (err) {
    console.error('[db] getTasks error:', err);
    return [];
  }
}

export async function upsertTasks(newTasks: Omit<Task, 'createdAt'>[]): Promise<void> {
  const tasksComData: Task[] = newTasks.map(t => ({
    ...t,
    createdAt: new Date().toISOString()
  }));
  try {
    // Serializa para string para garantir compatibilidade com KV
    await kvSet('kanban_tasks', JSON.stringify(tasksComData));
  } catch (err) {
    console.error('[db] upsertTasks error:', err);
  }
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task | null> {
  const tasks = await getTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;
  tasks[index].status = status;
  try {
    await kvSet('kanban_tasks', JSON.stringify(tasks));
  } catch (err) {
    console.error('[db] updateTaskStatus error:', err);
  }
  return tasks[index];
}
