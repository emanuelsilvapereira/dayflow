'use client';

import { supabase } from '../../lib/supabase';
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // === ESTADOS DO CRONÔMETRO (MODO FOCO) ===
  const [activeTimerTask, setActiveTimerTask] = useState<{ id: string, name: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutos em segundos
  const [isTimerRunning, setIsTimerRunning] = useState(false);

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

  // Efeito do Cronômetro
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      // Aqui poderíamos tocar um som (beep) no futuro!
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

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
      if (session) {
        setUser(session.user);

        const { data: profileData } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setUserProfile(profileData);
        }
      }
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
    setUserProfile(null);
    localStorage.removeItem('dayflow_current_plan');
    localStorage.removeItem('dayflow_progress');
    localStorage.removeItem('dayflow_count');
    window.location.href = '/login';
  };

  const handleGeneratePlan = async () => {
    if (!tasksInput.trim()) return;
    if (generationsToday >= 3 && userProfile?.plano !== 'PRO') {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasksInput,
          mood: mood,
          perfil: userProfile
        }),
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

  // Funções do Cronômetro
  const openTimer = (taskId: string, taskName: string) => {
    setActiveTimerTask({ id: taskId, name: taskName });
    setTimeLeft(25 * 60);
    setIsTimerRunning(false);
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);

  const closeTimer = () => {
    setIsTimerRunning(false);
    setActiveTimerTask(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const totalTasks = plan ? (plan.manha?.length || 0) + (plan.tarde?.length || 0) + (plan.noite?.length || 0) : 0;
  const isAllCompleted = totalTasks > 0 && completedTasks.length === totalTasks;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  return (
    <main className="min-h-screen relative bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 font-sans p-6 md:p-12 transition-colors duration-500 overflow-x-hidden">

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

      <div className="max-w-2xl mx-auto pb-32"> {/* pb-32 para o cronômetro flutuante não tampar o final */}
        <header className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-2xl md:text-3xl font-normal text-zinc-400 dark:text-zinc-500 tracking-tight leading-relaxed">
            Não precisas de fazer tudo. <br />
            <span className="text-zinc-900 dark:text-zinc-200 font-medium">Apenas a próxima coisa certa{userProfile?.nome ? `, ${userProfile.nome.split(' ')[0]}` : ''}.</span>
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

            {/* MENSAGEM DA IA */}
            {plan.mensagem && (
              <div className="text-center italic text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                "{plan.mensagem}"
              </div>
            )}

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
                          className={`group flex items-start gap-4 p-5 rounded-2xl border glass-card-hover transition-all duration-500 ${isDone ? 'opacity-40 grayscale bg-zinc-100/50 dark:bg-zinc-900/20 border-transparent' : 'glass-card'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggleTaskCompletion(task.id)}
                            className="w-5 h-5 mt-0.5 border-zinc-300 dark:border-zinc-700 rounded-full accent-zinc-900 dark:accent-white cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <p className={`text-base font-medium transition-all truncate ${isDone ? 'line-through text-zinc-500' : 'text-zinc-800 dark:text-zinc-100'}`}>
                                {task.tarefa}
                              </p>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => startEditing(task.id, task.tarefa)} className="text-[10px] text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  Editar
                                </button>
                                {/* BOTÃO DE FOCAR */}
                                {!isDone && (
                                  <button onClick={() => openTimer(task.id, task.tarefa)} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                    Focar
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border border-zinc-300/30 dark:border-zinc-700/30">{task.duracao}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${task.prioridade === 'Alta' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 border-zinc-300/30'
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

      {/* WIDGET DO CRONÔMETRO (FLUTUANTE) */}
      {activeTimerTask && (
        <div className="fixed bottom-6 right-6 z-50 glass-card p-6 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 flex flex-col items-center gap-3 border border-zinc-200/50 dark:border-zinc-700/50 w-72 md:w-80 backdrop-blur-2xl">
          <button onClick={closeTimer} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <div className="text-center w-full px-2 mt-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Foco na Tarefa</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate w-full" title={activeTimerTask.name}>
              {activeTimerTask.name}
            </p>
          </div>

          <div className="text-6xl font-black tracking-tighter text-zinc-900 dark:text-white font-mono my-2">
            {formatTime(timeLeft)}
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={toggleTimer}
              className={`flex-1 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${isTimerRunning ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-105'}`}
            >
              {isTimerRunning ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                  Pausar
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  Iniciar
                </>
              )}
            </button>
            <button
              onClick={() => { setTimeLeft(25 * 60); setIsTimerRunning(false); }}
              className="px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Reiniciar 25min"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
            </button>
          </div>
        </div>
      )}
      {/* MODAL DE PAYWALL (BARREIRA DE PAGAMENTO) */}
      {showPaywall && (
        <div className="fixed inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-50 transition-all p-4">
          <div className="bg-white dark:bg-zinc-900 p-8 md:p-10 border border-zinc-200 dark:border-zinc-800 rounded-[32px] shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>

            <h2 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white tracking-tight">Eleve o seu Foco</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
              Você atingiu o limite do plano gratuito. Assine o <strong>DayFlow PRO</strong> para desbloquear a organização com IA ilimitada e dominar a sua rotina.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                <svg className="text-emerald-500 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Planos IA ilimitados
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                <svg className="text-emerald-500 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Dashboard de gamificação avançado
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                <svg className="text-emerald-500 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Modo Foco Ininterrupto
              </div>
            </div>

            <button
              onClick={() => window.location.href = "https://buy.stripe.com/test_fZu4gAa7eevc9eMaPGbsc00"}
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold hover:scale-[1.02] transition-transform shadow-xl shadow-zinc-900/10 dark:shadow-white/10"
            >
              Assinar por R$ 19/mês
            </button>
            <p className="text-center text-[10px] text-zinc-400 mt-4 uppercase tracking-wider font-bold">
              Cancele quando quiser
            </p>
          </div>
        </div>
      )}
    </main>
  );
}