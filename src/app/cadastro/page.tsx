'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function Cadastro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [ocupacao, setOcupacao] = useState('Estudante');
  const [desafio, setDesafio] = useState('Procrastinação');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Controle do Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('perfis').insert([
          { id: authData.user.id, nome, ocupacao, desafio }
        ]);
        if (profileError) throw profileError;
      }

      window.location.href = '/';
      
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-6 font-sans text-zinc-900 dark:text-zinc-200 transition-colors duration-300 relative">
      
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-6 right-6 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
        title="Alternar Tema"
      >
        {isDarkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        )}
      </button>

      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 p-7 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl dark:shadow-2xl transition-colors duration-300">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-zinc-900 dark:text-white tracking-tight mb-2">Junta-te ao DayFlow</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Organiza a tua mente numa interface clean.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleCadastro} className="space-y-5">
          
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Como te chamas?</label>
              <input 
                type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 outline-none transition-all text-zinc-900 dark:text-white"
                placeholder="Ex: Emanuel"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Momento Atual</label>
                <select value={ocupacao} onChange={(e) => setOcupacao(e.target.value)}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 outline-none transition-all text-zinc-900 dark:text-white cursor-pointer appearance-none">
                  <option value="Estudante">Estudante</option>
                  <option value="Empreendedor">Empreendedor</option>
                  <option value="Trabalhador">Trabalhador CLT</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Maior Desafio</label>
                <select value={desafio} onChange={(e) => setDesafio(e.target.value)}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 outline-none transition-all text-zinc-900 dark:text-white cursor-pointer appearance-none">
                  <option value="Procrastinação">Procrastinar</option>
                  <option value="Foco">Falta de Foco</option>
                  <option value="Burnout">Excesso/Burnout</option>
                  <option value="Priorizar">Priorizar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">E-mail</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 outline-none transition-all text-zinc-900 dark:text-white"
                placeholder="o-teu-email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Palavra-passe</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 outline-none transition-all text-zinc-900 dark:text-white"
                placeholder="Mínimo de 6 caracteres"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-medium hover:bg-black dark:hover:bg-zinc-200 transition-all disabled:opacity-50 mt-6"
          >
            {loading ? 'A criar conta...' : 'Criar Conta Grátis'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-8">
          Já tens uma conta? <Link href="/login" className="text-zinc-900 dark:text-white hover:underline font-medium">Entrar aqui</Link>
        </p>

      </div>
    </main>
  );
}