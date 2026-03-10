import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 selection:bg-orange-500/30 font-sans overflow-x-hidden transition-colors duration-500">
      
      {/* NAVBAR */}
      <nav className="p-6 md:px-12 flex justify-between items-center max-w-6xl mx-auto animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-white animate-pulse"></div>
          <span className="font-bold tracking-tighter text-xl text-zinc-900 dark:text-white">DayFlow</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Entrar
          </Link>
          <Link href="/cadastro" className="text-xs font-bold uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl hover:scale-105 transition-transform shadow-lg">
            Testar Grátis
          </Link>
        </div>
      </nav>

      {/* HERO SECTION (A Promessa) */}
      <section className="max-w-4xl mx-auto text-center pt-24 pb-16 px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Inteligência Artificial Ativa</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 text-zinc-900 dark:text-white">
          Não precisas fazer tudo.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-zinc-800 dark:from-zinc-100 dark:to-zinc-500">
            Apenas a próxima coisa certa.
          </span>
        </h1>
        
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          O DayFlow entende a sua energia atual e o seu maior desafio para transformar a sua bagunça mental em um plano de ação executável, dividido por turnos.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/cadastro" className="w-full sm:w-auto bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-base px-8 py-4 rounded-2xl hover:scale-105 transition-transform shadow-2xl shadow-zinc-900/20 dark:shadow-white/10">
            Organizar meu dia agora
          </Link>
          <p className="text-xs text-zinc-400 font-medium sm:hidden mt-2">Sem necessidade de cartão de crédito.</p>
        </div>
      </section>

      {/* MOCKUP VISUAL (O Efeito Uau) */}
      <div className="max-w-5xl mx-auto px-6 pb-24 animate-in fade-in zoom-in-95 duration-1000 delay-300">
        <div className="aspect-video bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] border border-zinc-200/50 dark:border-zinc-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-transparent dark:from-orange-500/10"></div>
          
          {/* Falso App no Fundo para dar o visual de SaaS */}
          <div className="w-3/4 max-w-lg space-y-4 opacity-70 group-hover:opacity-100 transition-opacity duration-700">
             <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-6"></div>
             <div className="h-16 w-full bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center px-6 gap-4">
                <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700"></div>
                <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
             </div>
             <div className="h-16 w-full bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center px-6 gap-4">
                <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700"></div>
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
             </div>
          </div>
          
          <div className="absolute bottom-8 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full text-xs font-bold tracking-widest uppercase shadow-xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            Domine o seu tempo
          </div>
        </div>
      </div>
      
    </main>
  );
}