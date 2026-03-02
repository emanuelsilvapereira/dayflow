'use client';

import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

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

  // NOVO: Estados para controlar a edição de tarefas
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');

  // === EFEITOS ===
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
      alert("Atingiu o limite gratuito de hoje. (Futuramente: Tela de Pagamento!)");
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
      alert("Ops! Houve um problema ao falar com a IA. Tente novamente.");
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

  // NOVO: Funções de Edição
  const startEditing = (taskId: string, currentText: string) => {
    setEditingTaskId(taskId);
    setEditingTaskText(currentText);
  };

  const saveEdit = (periodo: string, taskId: string) => {
    if (!plan || !editingTaskText.trim()) return;
    
    // Cria uma cópia do plano atual
    const updatedPlan = { ...plan };
    // Encontra a tarefa exata e atualiza o texto
    const taskIndex = updatedPlan[periodo].findIndex((t: any) => t.id === taskId);
    if (taskIndex > -1) {
      updatedPlan[periodo][taskIndex].tarefa = editingTaskText;
      setPlan(updatedPlan);
      localStorage.setItem('dayflow_current_plan', JSON.stringify(updatedPlan));
    }
    // Sai do modo de edição
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

    const emjCal = String.fromCodePoint(0x1F5D3, 0xFE0F);
    const emjRoc = String.fromCodePoint(0x1F680);
    const emjMorn = String.fromCodePoint(0x1F304);
    const emjAft = String.fromCodePoint(0x2600, 0xFE0F);
    const emjNig = String.fromCodePoint(0x1F319);
    const emjChk = String.fromCodePoint(0x2705);
    const emjBox = String.fromCodePoint(0x2B1C);

    let text = `${emjCal} *O meu Plano de Hoje no DayFlow* ${emjRoc}\n\n`;

    const formatPeriod = (periodName: string, icon: string, tasks: any[]) => {
      if (!tasks || tasks.length === 0) return '';
      let periodText = `${icon} *${periodName}*\n`;
      tasks.forEach(task => {
        const isDone = completedTasks.includes(task.id) ? emjChk : emjBox;
        periodText += `${isDone} ${task.tarefa} (${task.duracao})\n`;
      });
      return periodText + '\n';
    };

    text += formatPeriod('Manhã', emjMorn, plan.manha);
    text += formatPeriod('Tarde', emjAft, plan.tarde);
    text += formatPeriod('Noite', emjNig, plan.noite);

    text += `\nCria o teu plano também em: https://dayflow-b93axbgw4-emanuelsilvapereiras-projects.vercel.app`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const totalTasks = plan ? (plan.manha?.length || 0) + (plan.tarde?.length || 0) + (plan.noite?.length || 0) : 0;
  const isAllCompleted = totalTasks > 0 && completedTasks.length === totalTasks;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // === RENDERIZAÇÃO DA INTERFACE ===
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-200 p-6 md:p-12 transition-colors duration-500">
      
      {/* BARRA SUPERIOR DE PERFIL / LOGIN */}
      {user ? (
        <div className="max-w-2xl mx-auto flex justify-between items-center bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] mb-8 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm font-medium text-slate-600 hidden sm:block">
              {user.email}
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            {/* NOVO BOTÃO DE HISTÓRICO AQUI */}
            <Link 
              href="/historico"
              className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-teal-50"
            >
              Meu Histórico
            </Link>

            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              Sair
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto flex justify-end items-center mb-8">
          <a 
            href="/login"
            className="text-sm font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-slate-400 hover:text-slate-900 transition-all shadow-sm flex items-center gap-2"
          >
            Entrar / Criar Conta
          </a>
        </div>
      )}

      {showOnboarding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center transform scale-100">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">Bem-vindo ao DayFlow</h2>
            <p className="text-slate-500 text-sm mb-6">Organize a sua mente numa interface livre de distrações.</p>
            <button 
              onClick={closeOnboarding}
              className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 transition-all shadow-md hover:shadow-lg"
            >
              Começar agora
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center mt-2">
          <h1 className="text-xl md:text-2xl font-medium text-slate-400 tracking-tight">
            "Você não precisa fazer tudo. <br/>
            <span className="text-slate-900 font-semibold">Apenas a próxima coisa certa.</span>"
          </h1>
        </header>

        {!plan ? (
          <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Como está a sua energia hoje?
              </label>
              <select 
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all cursor-pointer text-slate-700 font-medium"
              >
                <option value="Normal">Normal — Dia padrão</option>
                <option value="Tired">Cansado — Preciso de pausas</option>
                <option value="Focused">Focado — Pronto para a guerra</option>
                <option value="Overwhelmed">Sobrecarragado — Um passo de cada vez</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Despeje a sua mente
              </label>
              <textarea 
                value={tasksInput}
                onChange={(e) => setTasksInput(e.target.value)}
                placeholder="Ex: academia, responder cliente, editar vídeo..."
                className="w-full p-4 h-40 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none text-slate-700"
              />
            </div>

            <button 
              onClick={handleGeneratePlan}
              disabled={isLoading || !tasksInput.trim()}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" strokeDasharray="32" strokeDashoffset="32" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Organizando...
                </span>
              ) : 'Organizar o meu dia'}
            </button>
            <p className="text-center text-xs text-slate-400 font-medium">
              Planos gratuitos restantes hoje: {3 - generationsToday} de 3
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-700">
            
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <div className="flex justify-between items-end mb-3">
                <span className="font-bold text-slate-800 text-lg">O seu Progresso</span>
                <span className="text-sm text-teal-600 font-bold">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-teal-500 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {['manha', 'tarde', 'noite'].map((periodo) => {
              if (!plan[periodo] || plan[periodo].length === 0) return null;

              return (
                <div key={periodo} className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 capitalize mb-4 flex items-center gap-2">
                    {periodo === 'manha' ? '🌅 Manhã' : periodo === 'tarde' ? '☀️ Tarde' : '🌙 Noite'}
                  </h3>
                  <div className="space-y-2">
                    {plan[periodo].map((task: any) => {
                      const isDone = completedTasks.includes(task.id);
                      
                      return (
                        <div 
                          key={task.id} 
                          className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 border border-transparent hover:bg-slate-50 ${isDone ? 'opacity-60 bg-slate-50' : ''}`}
                        >
                          <div className="relative flex items-center mt-1">
                            <input 
                              type="checkbox" 
                              checked={isDone}
                              onChange={() => toggleTaskCompletion(task.id)}
                              className="w-6 h-6 border-2 border-slate-300 rounded-lg text-teal-500 focus:ring-teal-500 focus:ring-offset-0 transition-all cursor-pointer accent-teal-500"
                            />
                          </div>
                          
                          <div className="flex-1 w-full">
                            {/* LÓGICA DE EDIÇÃO AQUI */}
                            {editingTaskId === task.id ? (
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <input 
                                  type="text"
                                  value={editingTaskText}
                                  onChange={(e) => setEditingTaskText(e.target.value)}
                                  className="flex-1 p-2 text-sm border-2 border-teal-500 rounded-lg focus:outline-none text-slate-700 bg-white"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit(periodo, task.id);
                                    if (e.key === 'Escape') setEditingTaskId(null);
                                  }}
                                />
                                <button 
                                  onClick={() => saveEdit(periodo, task.id)}
                                  className="px-4 py-2 bg-teal-500 text-white text-sm rounded-lg font-bold hover:bg-teal-600 transition-colors"
                                >
                                  Salvar
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-between items-start group">
                                <p 
                                  onClick={() => toggleTaskCompletion(task.id)}
                                  className={`text-slate-800 font-medium transition-all duration-300 cursor-pointer ${isDone ? 'line-through text-slate-400' : ''}`}
                                >
                                  {task.tarefa}
                                </p>
                                <button 
                                  onClick={() => startEditing(task.id, task.tarefa)}
                                  className="text-slate-400 hover:text-teal-600 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1 text-sm ml-2"
                                  title="Editar Tarefa"
                                >
                                  ✏️
                                </button>
                              </div>
                            )}

                            <div className="flex gap-3 mt-1.5 text-xs font-medium">
                              <span className="text-slate-500 flex items-center gap-1">⏱ {task.duracao}</span>
                              <span className={`px-2 py-0.5 rounded-md ${
                                task.prioridade === 'Alta' ? 'bg-red-50 text-red-600' : 
                                task.prioridade === 'Média' ? 'bg-amber-50 text-amber-600' : 
                                'bg-slate-100 text-slate-600'
                              }`}>
                                Prioridade {task.prioridade}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {isAllCompleted && (
              <div className="bg-teal-50 border border-teal-200 p-6 rounded-3xl text-center transform transition-all duration-500 scale-100 shadow-sm">
                <h3 className="text-teal-800 font-bold text-xl mb-2">Dia Concluído! 🎉</h3>
                <p className="text-teal-700 font-medium">{plan.mensagem || "Excelente trabalho hoje!"}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-8">
              <button 
                onClick={shareToWhatsApp}
                className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold hover:bg-[#20bd5a] transition-all shadow-lg flex justify-center items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                Partilhar no WhatsApp
              </button>

              <button 
                onClick={resetApp}
                className="w-full bg-transparent border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-bold hover:border-slate-900 hover:text-slate-900 transition-all"
              >
                Começar um novo dia
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}