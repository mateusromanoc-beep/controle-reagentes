"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Beaker, CalendarClock, Clock, LayoutGrid } from "lucide-react";
import type { Task, StatusType } from "@/lib/db";

const COLUMNS: StatusType[] = ["Crítico", "Baixo", "Vencido", "Vencendo Breve", "Uso Vencendo"];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 2000); 
    return () => clearInterval(interval);
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("taskId", id);
  };

  const handleDrop = async (e: React.DragEvent, status: StatusType) => {
    const id = e.dataTransfer.getData("taskId");
    // Optimistic UI Update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    // API Update
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchTasks();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderColumnHeader = (column: StatusType) => {
    switch (column) {
      case 'Crítico':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" /> CRÍTICO</h3>;
      case 'Baixo':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-400" /> ESTOQUE BAIXO</h3>;
      case 'Vencido':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><CalendarClock className="w-5 h-5 text-purple-400" /> VENCIDO</h3>;
      case 'Vencendo Breve':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /> VENCE 30d</h3>;
      case 'Uso Vencendo':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><Beaker className="w-5 h-5 text-teal-400" /> EM USO</h3>;
    }
  }

  const renderCardColor = (column: StatusType) => {
    switch (column) {
      case 'Crítico': return 'from-red-500/10 to-transparent border-red-500/30';
      case 'Baixo': return 'from-orange-500/10 to-transparent border-orange-500/30';
      case 'Vencido': return 'from-purple-500/10 to-transparent border-purple-500/30';
      case 'Vencendo Breve': return 'from-blue-500/10 to-transparent border-blue-500/30';
      case 'Uso Vencendo': return 'from-teal-500/10 to-transparent border-teal-500/30';
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 font-sans selection:bg-purple-500/30 overflow-x-auto">
      <div className="w-max lg:w-full min-w-full mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 gap-4 sticky left-0">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-2">
              Controle de Reagentes
            </h1>
            <p className="text-slate-400 font-medium">Dashboard Analítico via n8n (Diário)</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800/50 backdrop-blur-md">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Em sincronismo contínuo
          </div>
        </header>

        <div className="flex gap-6 items-start h-full pb-10">
          {COLUMNS.map((column) => (
            <div
              key={column}
              className="flex flex-col gap-4 min-w-[320px] w-[320px] shrink-0"
              onDrop={(e) => handleDrop(e, column)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between px-2">
                {renderColumnHeader(column)}
                <span className="bg-slate-800 text-slate-300 text-xs py-1 px-2.5 rounded-full font-medium shadow-inner">
                  {tasks.filter((t) => t.status === column).length}
                </span>
              </div>

              <div className="flex flex-col gap-3 min-h-[500px] p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm shadow-xl shadow-black/20">
                {tasks
                  .filter((t) => t.status === column)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className={`group flex flex-col gap-3 cursor-grab active:cursor-grabbing p-4 rounded-xl bg-gradient-to-b ${renderCardColor(column)} bg-slate-800/80 hover:bg-slate-700/80 
                                 border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
                          {task.id.split('-')[1] || `#${task.id}`}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-slate-100 text-lg leading-tight group-hover:text-white transition-colors">
                        {task.title}
                      </h4>
                      
                      {task.description && (
                        <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 break-words font-mono text-[11px]">
                          {task.description}
                        </div>
                      )}
                    </div>
                  ))}
                  {tasks.filter((t) => t.status === column).length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-800/80 rounded-xl m-2 opacity-50 bg-slate-900/20">
                      <LayoutGrid className="w-8 h-8 text-slate-600 mb-3" />
                      <p className="text-sm text-slate-500 font-medium">Nenhum evento</p>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
