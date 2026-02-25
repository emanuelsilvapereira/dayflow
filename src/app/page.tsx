'use client';

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

  // === EFEITOS (Memória do Navegador) ===
  useEffect(() => {
    // Verifica primeira visita
    const hasVisited = localStorage.getItem('dayflow_visited');
    if (!hasVisited) setShowOnboarding(true);

    // Controlo de limite diário
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('dayflow_date');
    if (storedDate !== today) {
      localStorage.setItem('dayflow_date', today);
      localStorage.setItem('dayflow_count', '0');
    } else {
      setGenerationsToday(parseInt(localStorage.getItem('dayflow_count') || '0'));
    }

    // NOVA FUNCIONALIDADE: Recupera o plano se a pessoa recarregar a página!
    const savedPlan = localStorage.getItem('dayflow_current_plan');
    const savedProgress = localStorage.getItem('dayflow_progress');
    if (savedPlan) setPlan(JSON.parse(savedPlan));
    if (savedProgress) setCompletedTasks(JSON.parse(savedProgress));
  }, []);

  // === FUNÇÕES ===
  const closeOnboarding = () => {
    localStorage.setItem('dayflow_visited', 'true');
    setShowOnboarding(false);
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

      // Atualiza o estado e guarda na memória local para não perder ao recarregar
      setPlan(data);
      setCompletedTasks([]);
      localStorage.setItem('dayflow_current_plan', JSON.stringify(data));
      localStorage.setItem('dayflow_progress', JSON.stringify([]));
      
      const newCount = generationsToday + 1;
      setGenerationsToday(newCount);
      localStorage.setItem('dayflow_count', newCount.toString());

    } catch (error) {
      console.error("Erro:", error);
      alert("Ops! Houve um problema ao falar com a IA. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // NOVA FUNCIONALIDADE: Guarda o progresso sempre que clica numa tarefa
  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = completedTasks.includes(taskId)
      ? completedTasks.filter(id => id !== taskId)
      : [...completedTasks, taskId];
    
    setCompletedTasks(updatedTasks);
    localStorage.setItem('dayflow_progress', JSON.stringify(updatedTasks));
  };

  const resetApp = () => {
    setPlan(null);
    setTasksInput('');
    localStorage.removeItem('dayflow_current_plan');
    localStorage.removeItem('dayflow_progress');
  };

  // Cálculos para a Barra de Progresso
  const totalTasks = plan ? (plan.manha?.length || 0) + (plan.tarde?.length || 0) + (plan.noite?.length || 0) : 0;
  const isAllCompleted = totalTasks > 0 && completedTasks.length === totalTasks;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // === RENDERIZAÇÃO DA INTERFACE ===
  // Usamos bg-slate-50 para um fundo muito limpo e letras em slate-800 para contraste suave
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-200 p-6 md:p-12 transition-colors duration-500">
      
      {/* MODAL DE ONBOARDING */}
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
        {/* HERO MESSAGE */}
        <header className="mb-10 text-center mt-8">
          <h1 className="text-xl md:text-2xl font-medium text-slate-400 tracking-tight">
            "Você não precisa fazer tudo. <br/>
            <span className="text-slate-900 font-semibold">Apenas a próxima coisa certa.</span>"
          </h1>
        </header>

        {!plan ? (
          /* TELA DE INPUT (Antes de gerar o plano) */
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
          /* TELA DO PLANO GERADO */
          <div className="space-y-6 animate-in fade-in duration-700">
            
            {/* NOVO: Barra de Progresso Visual */}
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

            {/* Listagem das Tarefas */}
            {['manha', 'tarde', 'noite'].map((periodo) => {
              if (!plan[periodo] || plan[periodo].length === 0) return null; // Esconde o bloco se não tiver tarefas

              return (
                <div key={periodo} className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 capitalize mb-4 flex items-center gap-2">
                    {periodo === 'manha' ? '🌅 Manhã' : periodo === 'tarde' ? '☀️ Tarde' : '🌙 Noite'}
                  </h3>
                  <div className="space-y-2">
                    {plan[periodo].map((task: any) => {
                      const isDone = completedTasks.includes(task.id);
                      return (
                        <label 
                          key={task.id} 
                          className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 border border-transparent hover:bg-slate-50 ${isDone ? 'opacity-60 bg-slate-50' : ''}`}
                        >
                          <div className="relative flex items-center mt-1">
                            <input 
                              type="checkbox" 
                              checked={isDone}
                              onChange={() => toggleTaskCompletion(task.id)}
                              className="w-6 h-6 border-2 border-slate-300 rounded-lg text-teal-500 focus:ring-teal-500 focus:ring-offset-0 transition-all cursor-pointer accent-teal-500"
                            />
                          </div>
                          <div className="flex-1">
                            <p className={`text-slate-800 font-medium transition-all duration-300 ${isDone ? 'line-through text-slate-400' : ''}`}>
                              {task.tarefa}
                            </p>
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
                        </label>
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

            <button 
              onClick={resetApp}
              className="w-full bg-transparent border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-bold hover:border-slate-900 hover:text-slate-900 transition-all"
            >
              Começar um novo dia
            </button>
          </div>
        )}
      </div>
    </main>
  );
}