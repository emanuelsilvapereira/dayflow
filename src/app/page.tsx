'use client';

import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DayFlow() {
  // === ESTADOS DA APLICAÇÃO ===
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tasksInput, setTasksInput] = useState('');
  const [mood, setMood] = useState('Normal');
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generationsToday, setGenerationsToday] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [mounted, setMounted] = useState(false);

  // Controle do Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(true);

  // === EFEITOS ===
  useEffect(() => {
    setMounted(true);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const hasVisited = localStorage.getItem('dayflow_visited');
    if (!hasVisited) setShowOnboarding(true);

    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('dayflow_date');
    if (storedDate !== today) {
      localStorage.setItem('dayflow_date', today);
      localStorage.setItem('dayflow_count', '0');
    } else {
      setGenerationsToday(parseInt(localStorage.getItem('dayflow_count') || '0'));
    }

    const savedPlan = localStorage.getItem('dayflow_current_plan');
    const savedProgress = localStorage.getItem('dayflow_progress');
    if (savedPlan) setPlan(JSON.parse(savedPlan));
    if (savedProgress) setCompletedTasks(JSON.parse(savedProgress));

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
    };
    checkUser();
  }, []);

  if (!mounted) return null;

  // === FUNÇÕES ===
  const closeOnboarding = () => {
    localStorage.setItem('dayflow_visited', 'true');
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('dayflow_current_plan');
    localStorage.removeItem('dayflow_progress');
    localStorage.removeItem('dayflow_count');
    window.location.href = '/login';
  };

  const handleGeneratePlan = async () => {
    if (!tasksInput.trim()) return;
    if (generationsToday >= 3) {
      alert("Atingiu o limite gratuito de hoje.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasksInput, mood: mood }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || "Erro ao processar as tarefas.");

      setPlan(data);
      setCompletedTasks([]);
      localStorage.setItem('dayflow_current_plan', JSON.stringify(data));
      localStorage.setItem('dayflow_progress', JSON.stringify([]));

      const newCount = generationsToday + 1;
      setGenerationsToday(newCount);
      localStorage.setItem('dayflow_count', newCount.toString());

      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData.user;

      if (currentUser) {
        await supabase.from('planos').insert([
          { user_id: currentUser.id, energia: mood, dados_do_plano: data }
        ]);
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Houve um problema ao falar com a IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = completedTasks.includes(taskId)
      ? completedTasks.filter(id => id !== taskId)
      : [...completedTasks, taskId];

    setCompletedTasks(updatedTasks);
    localStorage.setItem('dayflow_progress', JSON.stringify(updatedTasks));
  };

  const startEditing = (taskId: string, currentText: string) => {
    setEditingTaskId(taskId);
    setEditingTaskText(currentText);
  };

  const saveEdit = (periodo: string, taskId: string) => {
    if (!plan || !editingTaskText.trim()) return;

    const updatedPlan = { ...plan };
    const taskIndex = updatedPlan[periodo].findIndex((t: any) => t.id === taskId);
    if (taskIndex > -1) {
      updatedPlan[periodo][taskIndex].tarefa = editingTaskText;
      setPlan(updatedPlan);
      localStorage.setItem('dayflow_current_plan', JSON.stringify(updatedPlan));
    }
    setEditingTaskId(null);
  };

  const resetApp = () => {
    setPlan(null);
    setTasksInput('');
    localStorage.removeItem('dayflow_current_plan');
    localStorage.removeItem('dayflow_progress');
  };

  const shareToWhatsApp = () => {
    if (!plan) return;
    let text = `*O meu Plano de Hoje no DayFlow*\n\n`;
    const formatPeriod = (name: string, tasks: any[]) => {
      if (!tasks || tasks.length === 0) return '';
      let pt = `*${name}*\n`;
      tasks.forEach(task => {
        const isDone = completedTasks.includes(task.id) ? '✅' : '⬜';
        pt += `${isDone} ${task.tarefa} (${task.duracao})\n`;
      });
      return pt + '\n';
    };
    text += formatPeriod('Manhã', plan.manha);
    text += formatPeriod('Tarde', plan.tarde);
    text += formatPeriod('Noite', plan.noite);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const totalTasks = plan ? (plan.manha?.length || 0) + (plan.tarde?.length || 0) + (plan.noite?.length || 0) : 0;
  const isAllCompleted = totalTasks > 0 && completedTasks.length === totalTasks;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 font-sans p-6 md:p-12 transition-colors duration-500">

      {/* CABEÇALHO */}
      <div className="max-w-2xl mx-auto mb-16">
        <div className="flex justify-between items-center py-6 border-b border-zinc-200 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-white animate-pulse"></div>
            <span className="font-bold tracking-tighter text-zinc-900 dark:text-white text-xl">DayFlow</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/historico" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  Histórico
                </Link>
                <button onClick={handleLogout} className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-xs font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-white border-b border-zinc-900 dark:border-white">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <header className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-2xl md:text-3xl font-normal text-zinc-400 dark:text-zinc-500 tracking-tight leading-relaxed">
            Não precisas de fazer tudo. <br />
            <span className="text-zinc-900 dark:text-zinc-200 font-medium">Apenas a próxima coisa certa.</span>
          </h1>
        </header>

        {!plan ? (
          /* CARD DE ENTRADA GLASSMORPHISM */
          <div className="space-y-8 animate-in fade-in duration-1000 max-w-lg mx-auto glass-card p-10 rounded-[32px]">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Energia</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full p-4 bg-white/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-1 focus:ring-zinc-400 outline-none transition-all text-zinc-800 dark:text-zinc-200 appearance-none"
              >
                <option value="Normal">Normal — Dia padrão</option>
                <option value="Tired">Cansado — Preciso de pausas</option>
                <option value="Focused">Focado — Pronto para a guerra</option>
                <option value="Overwhelmed">Sobrecarregado — Um passo de cada vez</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Tarefas (despejo mental)</label>
              <textarea
                value={tasksInput}
                onChange={(e) => setTasksInput(e.target.value)}
                placeholder="O que está na tua cabeça?"
                className="w-full p-4 h-40 bg-white/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-1 focus:ring-zinc-400 outline-none transition-all resize-none text-zinc-800 dark:text-zinc-200"
              />
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={isLoading || !tasksInput.trim()}
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold hover:opacity-90 transition-all disabled:opacity-30"
            >
              {isLoading ? 'A processar...' : 'Organizar o meu dia'}
            </button>
          </div>
        ) : (
          /* LISTA DE TAREFAS GERADA */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-lg mx-auto">
            
            {/* PROGRESSO */}
            <div className="mb-10 px-2">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Progresso</span>
                <span className="text-sm text-zinc-900 dark:text-zinc-200 font-bold">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-zinc-900 dark:bg-white h-1.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {['manha', 'tarde', 'noite'].map((periodo) => (
              plan[periodo] && plan[periodo].length > 0 && (
                <div key={periodo} className="space-y-3">
                  <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] pl-2">
                    {periodo === 'manha' ? 'Manhã' : periodo === 'tarde' ? 'Tarde' : 'Noite'}
                  </h3>
                  <div className="grid gap-3">
                    {plan[periodo].map((task: any) => {
                      const isDone = completedTasks.includes(task.id);
                      return (
                        <div
                          key={task.id}
                          className={`group flex items-start gap-4 p-5 rounded-2xl border glass-card-hover transition-all duration-500 ${
                            isDone ? 'opacity-40 grayscale bg-zinc-100/50 dark:bg-zinc-900/20 border-transparent' : 'glass-card'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggleTaskCompletion(task.id)}
                            className="w-5 h-5 mt-0.5 border-zinc-300 dark:border-zinc-700 rounded-full accent-zinc-900 dark:accent-white cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className={`text-base font-medium transition-all ${isDone ? 'line-through text-zinc-500' : 'text-zinc-800 dark:text-zinc-100'}`}>
                                {task.tarefa}
                              </p>
                              <button onClick={() => startEditing(task.id, task.tarefa)} className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">Editar</button>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border border-zinc-300/30 dark:border-zinc-700/30">{task.duracao}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                task.prioridade === 'Alta' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 border-zinc-300/30'
                              }`}>{task.prioridade}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}

            <div className="flex flex-col gap-3 mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800/50">
              <button onClick={shareToWhatsApp} className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold hover:scale-[1.01] transition-all shadow-lg shadow-green-500/20">WhatsApp</button>
              <button onClick={resetApp} className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-500 py-4 rounded-2xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">Começar novo dia</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}