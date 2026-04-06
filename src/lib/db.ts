import { kv } from '@vercel/kv';

export type StatusType = "Crítico" | "Baixo" | "Vencido" | "Vencendo Breve" | "Uso Vencendo";

export interface Task {
  id: string; 
  title: string;
  description: string;
  status: StatusType;
  createdAt: string;
}

export async function getTasks(): Promise<Task[]> {
  try {
    const data = await kv.get<Task[]>('tasks');
    return data || [];
  } catch (err) {
    console.error("Vercel KV get error:", err);
    // Retorna array vazio em ambiente local caso as chaves não existam ainda
    return [];
  }
}

export async function upsertTasks(newTasks: Omit<Task, 'createdAt'>[]): Promise<void> {
  const tasksComData = newTasks.map(t => ({
    ...t,
    createdAt: new Date().toISOString()
  }));

  try {
    await kv.set('tasks', tasksComData);
  } catch (err) {
    console.error("Vercel KV set error:", err);
  }
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task | null> {
  const tasks = await getTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;
  tasks[index].status = status;
  try {
    await kv.set('tasks', tasks);
  } catch (err) {
    console.error("Vercel KV status set error:", err);
  }
  return tasks[index];
}
