'use client';

import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Historico() {
  const [planos, setPlanos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlanos() {
      // 1. Verifica quem está logado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // 2. Busca os planos desse usuário específico lá no Supabase
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('criado_em', { ascending: false }); // Traz os mais recentes primeiro

      if (error) {
        console.error('Erro ao buscar planos:', error);
      } else {
        setPlanos(data || []);
      }
      setIsLoading(false);
    }

    fetchPlanos();
  }, []);

  // Formata a data feia do banco de dados para o padrão brasileiro bonito
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-2xl mx-auto">
        
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">O seu Histórico</h1>
            <p className="text-slate-500 text-sm mt-1">Todos os dias que você organizou.</p>
          </div>
          <Link 
            href="/"
            className="bg-white border-2 border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl hover:border-slate-900 hover:text-slate-900 transition-all text-sm font-bold shadow-sm"
          >
            Voltar
          </Link>
        </header>

        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center">
             <svg className="animate-spin h-8 w-8 text-teal-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" strokeDasharray="32" strokeDashoffset="32" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <p className="text-slate-500 font-medium">Puxando seus arquivos...</p>
          </div>
        ) : planos.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <span className="text-4xl mb-4 block">📭</span>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum plano salvo ainda</h3>
            <p className="text-slate-500 mb-6">Comece a organizar os seus dias para ver o histórico aqui.</p>
            <Link href="/" className="inline-block bg-teal-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-600 transition-colors shadow-md">
              Criar o meu primeiro plano
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {planos.map((plano) => (
              <div key={plano.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-lg">
                <div className="flex flex-wrap gap-4 justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <span className="font-bold text-slate-800 text-lg capitalize">{formatarData(plano.criado_em)}</span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    ⚡ Energia: {plano.energia === 'Normal' ? 'Normal' : plano.energia === 'Tired' ? 'Cansado' : plano.energia === 'Focused' ? 'Focado' : 'Sobrecarragado'}
                  </span>
                </div>
                
                <div className="space-y-5">
                  {['manha', 'tarde', 'noite'].map((periodo) => {
                    const tarefas = plano.dados_do_plano[periodo];
                    if (!tarefas || tarefas.length === 0) return null;
                    return (
                      <div key={periodo}>
                        <h4 className="text-sm font-bold text-slate-900 capitalize mb-3 flex items-center gap-2">
                          {periodo === 'manha' ? '🌅 Manhã' : periodo === 'tarde' ? '☀️ Tarde' : '🌙 Noite'}
                        </h4>
                        <ul className="space-y-2">
                          {tarefas.map((t: any, idx: number) => (
                            <li key={idx} className="text-sm text-slate-600 flex items-start gap-3 bg-slate-50 p-3 rounded-xl">
                              <span className="text-teal-500 mt-0.5">▪</span> 
                              <div>
                                <span className="font-medium text-slate-700">{t.tarefa}</span>
                                <span className="block text-xs text-slate-400 mt-1">Duração: {t.duracao}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}