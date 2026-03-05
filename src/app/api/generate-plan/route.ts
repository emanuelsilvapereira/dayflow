import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { tasks, mood, perfil } = await req.json();

    if (!tasks || tasks.trim() === '') {
      return NextResponse.json(
        { erro: "Escreva pelo menos uma tarefa para organizar seu dia." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // IA HIPER-PERSONALIZADA
    let contextoPerfil = "";
    if (perfil) {
      contextoPerfil = `
      Informações Cruciais sobre o Usuário:
      - Nome: ${perfil.nome}
      - Ocupação atual: ${perfil.ocupacao}
      - Maior Desafio Diário: ${perfil.desafio}
      
      IMPORTANTE: Você deve adaptar o plano de ação EXATAMENTE para este perfil. 
      Se ele é estudante, use termos acadêmicos. Se é empreendedor, foque em impacto/negócios. 
      Lembre-se do maior desafio dele (${perfil.desafio}) e estrutura as tarefas e as pausas para combater ativamente esse problema. Use o nome dele na mensagem motivacional final.
      `;
    }

    const prompt = `
      Você é um especialista em produtividade e organização pessoal de elite.
      A sua tarefa é converter a lista bagunçada do usuário num plano diário estruturado, acolhedor e altamente executável.
      
      ${contextoPerfil}
      
      Humor atual do usuário: ${mood}
      
      Regras de Humor:
      - "Tired" (Cansado): Crie blocos de trabalho curtos, adicione mais pausas de recuperação.
      - "Normal": Comportamento padrão de produtividade.
      - "Focused" (Focado): Blocos longos de trabalho profundo (Deep Work).
      - "Overwhelmed" (Sobrecarragado): Quebre as tarefas em pedaços microscópicos, priorize alívio mental e tarefas fáceis.

      Regras obrigatórias:
      1. No máximo 8 tarefas no total do dia.
      2. Classifique a prioridade: Alta, Média ou Baixa.
      3. Estime a duração de forma realista (ex: 30min, 1h).
      4. Aloque as tarefas nos blocos corretos (Manhã, Tarde ou Noite).

      Lista de tarefas:
      "${tasks}"

      Formato de saída OBRIGATÓRIO (APENAS JSON, SEM MARDKOWN):
      {
        "manha": [ { "id": "m1", "tarefa": "Exemplo adaptado", "duracao": "30min", "prioridade": "Alta" } ],
        "tarde": [ { "id": "t1", "tarefa": "Exemplo", "duracao": "1h", "prioridade": "Média" } ],
        "noite": [ { "id": "n1", "tarefa": "Exemplo", "duracao": "45min", "prioridade": "Baixa" } ],
        "mensagem": "Crie uma frase final encorajadora, usando o nome do usuário e referenciando o combate ao seu maior desafio."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const planData = JSON.parse(cleanJson);
    
    return NextResponse.json(planData);

  } catch (error) {
    console.error("Erro na API do Gemini:", error);
    return NextResponse.json(
      { erro: "Não foi possível gerar o plano. Tente novamente." },
      { status: 500 }
    );
  }
}