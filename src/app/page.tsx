"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Beaker, CalendarClock, Clock, LayoutGrid, Search, Trash2, Box, Plus, X, Loader2, User, CalendarDays } from "lucide-react";
import type { Task, StatusType } from "@/lib/db";

const COLUMNS: StatusType[] = ["Estoque", "Crítico", "Baixo", "Vencido", "Vencendo Breve", "Uso Vencendo", "Descarte"];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [showNewModal, setShowNewModal] = useState(false);
  const [showRetiradaModal, setShowRetiradaModal] = useState<{id: string, title: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const title = e.dataTransfer.getData("taskTitle");
    const currentStatus = e.dataTransfer.getData("currentStatus") as StatusType;

    if (id === "") return;

    // Se estiver saindo do Estoque (ou alertas) para Uso, abre modal
    if (status === "Uso Vencendo" && currentStatus !== "Uso Vencendo") {
      setShowRetiradaModal({ id, title });
      return;
    }

    // Fluxo normal
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));

    if (status === "Descarte") {
      await fetch("/api/descarte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title }),
      });
    } else {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    }
    fetchTasks();
  };

  const handleNewReagent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await fetch("/api/entrada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setShowNewModal(false);
      fetchTasks();
    } catch (err) {
      alert("Erro ao cadastrar reagente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRetirada = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showRetiradaModal) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await fetch("/api/retirada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: showRetiradaModal.id,
          title: showRetiradaModal.title,
          responsavel: formData.get("responsavel"),
          novaValidade: formData.get("novaValidade")
        }),
      });
      setShowRetiradaModal(null);
      fetchTasks();
    } catch (err) {
      alert("Erro ao processar retirada");
    } finally {
      setIsSubmitting(false);
    }
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
      case 'Estoque':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><Box className="w-5 h-5 text-indigo-400" /> ESTOQUE</h3>;
      case 'Crítico':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> CRÍTICO</h3>;
      case 'Baixo':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-400" /> ESTOQUE BAIXO</h3>;
      case 'Vencido':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><CalendarClock className="w-5 h-5 text-purple-400" /> VENCIDO</h3>;
      case 'Vencendo Breve':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /> VENCE 30d</h3>;
      case 'Uso Vencendo':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><Beaker className="w-5 h-5 text-teal-400" /> EM USO</h3>;
      case 'Descarte':
        return <h3 className="font-semibold text-slate-200 flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-600" /> DESCARTE</h3>;
    }
  }

  const renderCardColor = (column: StatusType) => {
    switch (column) {
      case 'Estoque': return 'from-indigo-500/10 to-transparent border-indigo-500/30';
      case 'Crítico': return 'from-red-500/10 to-transparent border-red-500/30';
      case 'Baixo': return 'from-orange-500/10 to-transparent border-orange-500/30';
      case 'Vencido': return 'from-purple-500/10 to-transparent border-purple-500/30';
      case 'Vencendo Breve': return 'from-blue-500/10 to-transparent border-blue-500/30';
      case 'Uso Vencendo': return 'from-teal-500/10 to-transparent border-teal-500/30';
      case 'Descarte': return 'from-red-900/20 to-transparent border-red-900/50 grayscale hover:grayscale-0';
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 font-sans selection:bg-purple-500/30 overflow-x-auto relative">
      
      {/* Botão Flutuante de Adição */}
      <button 
        onClick={() => setShowNewModal(true)}
        className="fixed bottom-8 right-8 z-50 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-2xl shadow-indigo-500/40 transition-all hover:scale-110 active:scale-95 flex items-center gap-2 pr-6"
      >
        <Plus className="w-6 h-6" />
        <span className="font-bold">Novo Reagente</span>
      </button>

      <div className="w-max lg:w-full min-w-full mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 gap-6 sticky left-0 z-40 bg-slate-950/80 backdrop-blur-lg">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-2">
              Controle de Reagentes
            </h1>
            <p className="text-slate-400 font-medium">Gestão Completa de Estoque & Ciclo de Vida</p>
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
              Sincronizado
            </div>
          </div>
        </header>

        <div className="flex gap-6 items-start h-full pb-20">
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
                  {filteredTasks.filter((t) => t.status === column).length === 0 && !loading && (
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

      {/* Modal Novo Reagente */}
      {showNewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-indigo-600/10">
              <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-400" /> Cadastrar Reagente</h2>
              <button onClick={() => setShowNewModal(false)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors"><X/></button>
            </div>
            <form onSubmit={handleNewReagent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Nome do Reagente</label>
                  <input name="reagente_id" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Lote</label>
                  <input name="Lote" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Validade</label>
                  <input name="Validade" placeholder="DD/MM/AAAA" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Fabricante</label>
                  <input name="Fabricante" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Quantidade</label>
                  <input name="Quantidade" type="number" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">CAS (Opcional)</label>
                  <input name="cas" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Confirmar Entrada"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Retirada */}
      {showRetiradaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="p-6 border-b border-slate-800 flex flex-col gap-1 bg-teal-600/10">
              <h2 className="text-xl font-bold flex items-center gap-2"><Beaker className="w-5 h-5 text-teal-400" /> Confirmar Retirada</h2>
              <p className="text-sm text-slate-400 font-mono text-xs">{showRetiradaModal.title}</p>
            </div>
            <form onSubmit={handleConfirmRetirada} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase px-1 flex items-center gap-1"><User className="w-3 h-3"/> Responsável</label>
                  <input name="responsavel" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase px-1 flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Nova Validade (Pós-Abertura)</label>
                  <input name="novaValidade" placeholder="DD/MM/AAAA (Opcional)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRetiradaModal(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold transition-all">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 py-3 rounded-xl font-bold shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Iniciar Uso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
