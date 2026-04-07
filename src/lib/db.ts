import { createClient } from 'redis';

export type StatusType = "Crítico" | "Baixo" | "Vencido" | "Vencendo Breve" | "Uso Vencendo" | "Descarte";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: StatusType;
  createdAt: string;
}

const REDIS_KEY = 'kanban_tasks';

// Reutiliza a conexão entre chamadas no mesmo container serverless
let client: ReturnType<typeof createClient> | null = null;

async function getClient() {
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('[redis] Client error:', err));
  }
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

export async function getTasks(): Promise<Task[]> {
  try {
    const redis = await getClient();
    const raw = await redis.get(REDIS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Task[];
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
    const redis = await getClient();
    await redis.set(REDIS_KEY, JSON.stringify(tasksComData));
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
    const redis = await getClient();
    await redis.set(REDIS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('[db] updateTaskStatus error:', err);
  }
  return tasks[index];
}
