"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Beaker, CalendarClock, Clock, LayoutGrid, Search, ExternalLink, Box } from "lucide-react";
import type { Task, StatusType } from "@/lib/db";

const COLUMNS: StatusType[] = ["Vencido", "Vencendo Breve", "Uso Vencendo"];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleDragStart = (e: React.DragEvent, id: string, title: string, currentStatus: StatusType) => {
    e.dataTransfer.setData("taskId", id);
    e.dataTransfer.setData("taskTitle", title);
    e.dataTransfer.setData("currentStatus", currentStatus);
  };

  const handleDrop = async (e: React.DragEvent, status: StatusType) => {
    const id = e.dataTransfer.getData("taskId");
    const currentStatus = e.dataTransfer.getData("currentStatus") as StatusType;

    if (id === "" || status === currentStatus) return;

    // Atualização Otimista
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));

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

  const filteredTasks = tasks.filter((t) => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderColumnHeader = (column: StatusType) => {
    switch (column) {
      case 'Vencido':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><CalendarClock className="w-5 h-5 text-purple-400" /> VENCIDOS</h3>;
      case 'Vencendo Breve':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /> VENCENDO (30 DIAS)</h3>;
      case 'Uso Vencendo':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><Beaker className="w-5 h-5 text-teal-400" /> EM USO</h3>;
      default:
        return null;
    }
  }

  const renderCardColor = (column: StatusType) => {
    switch (column) {
      case 'Vencido': return 'from-purple-500/10 to-transparent border-purple-500/30';
      case 'Vencendo Breve': return 'from-blue-500/10 to-transparent border-blue-500/30';
      case 'Uso Vencendo': return 'from-teal-500/10 to-transparent border-teal-500/30';
      default: return 'from-slate-500/10 to-transparent border-slate-500/30';
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 font-sans selection:bg-purple-500/30 overflow-x-auto relative">
      
      <div className="w-max lg:w-full min-w-full mx-auto space-y-10">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-8 gap-8 sticky left-0 z-40 bg-slate-950/80 backdrop-blur-lg">
          <div className="flex items-center gap-6">
            <img src="/logo.png" alt="Flo Tech Logo" className="h-16 w-auto object-contain brightness-110" />
            <div className="h-12 w-px bg-slate-800 hidden md:block" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                Controle de Reagentes
              </h1>
              <p className="text-slate-400 font-medium">Monitoramento de Validade e Uso</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar reagente, lote ou ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800/50 backdrop-blur-md shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Monitoramento Ativo
            </div>
          </div>
        </header>

        {/* Seção de Links Oficiais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <a 
            href="https://swimmingseal-n8n.cloudfy.live/form/4a198632-6a61-494c-afc2-e2cc80e1960e"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-6 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl hover:bg-indigo-600/20 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Entrada de Reagentes</h3>
                <p className="text-sm text-slate-400">Cadastrar novos itens no estoque</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>

          <a 
            href="https://swimmingseal-n8n.cloudfy.live/form/982c22e6-5697-463f-95a7-2e1a2a32bec1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-6 bg-teal-600/10 border border-teal-500/30 rounded-2xl hover:bg-teal-600/20 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-500 rounded-xl shadow-lg shadow-teal-500/20">
                <Beaker className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Saída de Reagentes</h3>
                <p className="text-sm text-slate-400">Registrar uso ou descarte de itens</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-teal-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
        </div>

        {/* Tabela de Monitoramento */}
        <div className="flex gap-6 items-start h-full pb-20 overflow-x-auto">
          {COLUMNS.map((column) => (
            <div
              key={column}
              className="flex flex-col gap-4 min-w-[350px] w-[350px] shrink-0"
              onDrop={(e) => handleDrop(e, column)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between px-2">
                {renderColumnHeader(column)}
                <span className="bg-slate-800 text-slate-300 text-xs py-1 px-2.5 rounded-full font-medium shadow-inner border border-slate-700">
                  {filteredTasks.filter((t) => t.status === column).length}
                </span>
              </div>

              <div className="flex flex-col gap-3 min-h-[500px] p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm shadow-xl shadow-black/20">
                {filteredTasks
                  .filter((t) => t.status === column)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id, task.title, task.status)}
                      className={`group flex flex-col gap-4 cursor-grab active:cursor-grabbing p-5 rounded-xl bg-gradient-to-b ${renderCardColor(column)} bg-slate-800/80 hover:bg-slate-700/80 
                                 border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                          {task.id.split('-')[1] || `#${task.id}`}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-slate-100 text-lg leading-tight group-hover:text-white transition-colors">
                        {task.title}
                      </h4>
                      
                      {task.description && (
                        <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 break-words font-mono">
                          {task.description}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredTasks.filter((t) => t.status === column).length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-800/80 rounded-2xl m-2 opacity-50 bg-slate-900/10">
                      <LayoutGrid className="w-10 h-10 text-slate-700 mb-4" />
                      <p className="text-sm text-slate-600 font-medium">Nenhum reagente</p>
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
