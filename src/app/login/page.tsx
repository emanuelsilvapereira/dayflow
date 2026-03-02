'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // === FUNÇÃO 1: LOGIN POR EMAIL/SENHA ===
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 1. Tenta fazer o login
    let { error } = await supabase.auth.signInWithPassword({ email, password });

    // 2. Se der erro (conta não existe), tenta criar a conta automaticamente
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      
      if (signUpError) {
        alert("Erro: " + signUpError.message);
      } else {
        alert("Conta criada com sucesso! Faça o login agora.");
      }
    } else {
      // 3. Login deu certo! Manda o usuário de volta para a tela inicial
      router.push('/');
    }
    
    setIsLoading(false);
  };

  // === FUNÇÃO 2: LOGIN COM GOOGLE ===
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acessar DayFlow</h1>
          <p className="text-slate-500 text-sm">Organize sua mente, um dia de cada vez.</p>
        </div>

        {/* BOTÃO DO GOOGLE */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all flex justify-center items-center gap-2 mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuar com Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-slate-400 text-sm font-medium">ou</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* FORMULÁRIO DE EMAIL E SENHA */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-slate-700"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-slate-700"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Carregando...' : 'Entrar / Criar Conta'}
          </button>
        </form>

      </div>
    </main>
  );
}