'use client';

import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Dicionário para deixar as energias mais bonitas no Dashboard
const mapaDeEnergia: Record<string, string> = {
  "Normal": "Equilibrada",
  "Tired": "Cansado",
  "Focused": "Foco Total",
  "Overwhelmed": "Sobrecarga"
};

export default function Historico() {
  const [user, setUser] = useState<any>(null);
  const [planos, setPlanos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Controle do Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const fetchUserAndHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        
        // Busca os planos do usuário ordenados do mais recente para o mais antigo
        const { data, error } = await supabase
          .from('planos')
          .select('*')
          .eq('user_id', session.user.id)
          .order('criado_em', { ascending: false });

        if (!error && data) {
          setPlanos(data);
        }
      } else {
        window.location.href = '/login';
      }
      setIsLoading(false);
    };

    fetchUserAndHistory();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // === LÓGICA DO DASHBOARD (GAMIFICAÇÃO) ===
  const totalDias = planos.length;

  // 1. Descobrir a Energia mais comum
  const contagemEnergia = planos.reduce((acc: any, plano: any) => {
    acc[plano.energia] = (acc[plano.energia] || 0) + 1;
    return acc;
  }, {});
  const energiaMaisComumKey = Object.keys(contagemEnergia).length > 0 
    ? Object.keys(contagemEnergia).reduce((a, b) => contagemEnergia[a] > contagemEnergia[b] ? a : b) 
    : null;
  const energiaMaisComum = energiaMaisComumKey ? mapaDeEnergia[energiaMaisComumKey] || energiaMaisComumKey : '-';

  // 2. Calcular a Ofensiva (Streak de dias seguidos)
  let ofensiva = 0;
  if (planos.length > 0) {
    const datasUnicas = Array.from(new Set(planos.map(p => new Date(p.criado_em).toDateString())));
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let dataChecagem = new Date(hoje);
    let fezHoje = datasUnicas.includes(dataChecagem.toDateString());
    
    if (!fezHoje) {
      // Se não fez hoje, checa se fez ontem (para não perder a ofensiva se o dia acabou de virar)
      dataChecagem.setDate(dataChecagem.getDate() - 1);
      let fezOntem = datasUnicas.includes(dataChecagem.toDateString());
      if (fezOntem) {
        while(datasUnicas.includes(dataChecagem.toDateString())) {
          ofensiva++;
          dataChecagem.setDate(dataChecagem.getDate() - 1);
        }
      }
    } else {
      // Se fez hoje, conta para trás
      while(datasUnicas.includes(dataChecagem.toDateString())) {
        ofensiva++;
        dataChecagem.setDate(dataChecagem.getDate() - 1);
      }
    }
  }

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 font-sans p-6 md:p-12 transition-colors duration-500">
      
      {/* CABEÇALHO PREMIUM */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="flex justify-between items-center py-6 border-b border-zinc-200 dark:border-zinc-800/60">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors"></div>
            <span className="font-bold tracking-tighter text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors text-xl">
              DayFlow
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
              title="Alternar Tema"
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              )}
            </button>

            {user && (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Voltar ao Início
                </Link>
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
                <button onClick={handleLogout} className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform">
                  {user.email?.charAt(0).toUpperCase()}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <header className="mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-3xl font-medium text-zinc-900 dark:text-white tracking-tight mb-2">Seu Progresso</h1>
          <p className="text-zinc-500 dark:text-zinc-400">A consistência é o que transforma o planejamento em realidade.</p>
        </header>

        {/* MÓDULO DE GAMIFICAÇÃO (DASHBOARD) */}
        {!isLoading && planos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-12 animate-in fade-in duration-1000 delay-150">
            {/* Card 1: Ofensiva */}
            <div className="glass-card p-4 rounded-[24px] text-center flex flex-col justify-center items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500 mb-1">Ofensiva</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-black text-orange-500 dark:text-orange-400">{ofensiva}</span>
                <span className="text-xs text-zinc-500">dias</span>
              </div>
            </div>

            {/* Card 2: Total de Planos */}
            <div className="glass-card p-4 rounded-[24px] text-center flex flex-col justify-center items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500 mb-1">Planos</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">{totalDias}</span>
                <span className="text-xs text-zinc-500">feitos</span>
              </div>
            </div>

            {/* Card 3: Energia Predominante */}
            <div className="glass-card p-4 rounded-[24px] text-center flex flex-col justify-center items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500 mb-1">Seu Padrão</span>
              <div className="mt-1">
                <span className="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                  {energiaMaisComum}
                </span>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-zinc-500 py-10 animate-pulse font-medium">Carregando seus planos...</div>
        ) : planos.length === 0 ? (
          <div className="glass-card p-10 rounded-[32px] text-center animate-in fade-in duration-1000">
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Você ainda não tem planos salvos. O momento perfeito para começar é agora.</p>
            <Link href="/dashboard" className="inline-block font-bold bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl hover:opacity-90 transition-opacity">
              Criar meu primeiro plano
            </Link>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4 pl-2">Histórico Completo</h2>
            {planos.map((plano) => (
              <div key={plano.id} className="glass-card p-7 rounded-[24px] glass-card-hover transition-all duration-500">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-zinc-200/50 dark:border-zinc-800/50">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
                    {new Date(plano.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400">
                    {mapaDeEnergia[plano.energia] || plano.energia}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {['manha', 'tarde', 'noite'].map(periodo => (
                    plano.dados_do_plano[periodo] && plano.dados_do_plano[periodo].length > 0 && (
                      <div key={periodo}>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">
                          {periodo === 'manha' ? 'Manhã' : periodo === 'tarde' ? 'Tarde' : 'Noite'}
                        </h4>
                        <ul className="space-y-1.5 pl-1">
                          {plano.dados_do_plano[periodo].map((t: any, idx: number) => (
                            <li key={idx} className="text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                              <span className="text-zinc-300 dark:text-zinc-700 mt-0.5">•</span>
                              {t.tarefa} <span className="text-[10px] text-zinc-400 ml-1">({t.duracao})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}