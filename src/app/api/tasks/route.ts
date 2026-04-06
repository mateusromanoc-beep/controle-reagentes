import { NextResponse } from 'next/server';
import { getTasks, updateTaskStatus } from '@/lib/db';

export async function GET() {
  const tasks = await getTasks();
  return NextResponse.json(tasks);
}

export async function PATCH(req: Request) {
  const data = await req.json();
  const { id, status } = data;
  const task = await updateTaskStatus(id, status);
  return NextResponse.json(task);
}
