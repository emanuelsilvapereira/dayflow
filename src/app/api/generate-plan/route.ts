import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// 1. Inicializa o Gemini com a tua chave (segura no servidor)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 2. Criamos uma função POST (que serve para receber dados e enviar uma resposta)
export async function POST(req: Request) {
  try {
    // 3. Recebe os dados que o Frontend enviou (as tarefas e o humor)
    const { tasks, mood } = await req.json();

    // Validação básica
    if (!tasks || tasks.trim() === '') {
      return NextResponse.json(
        { erro: "Escreva pelo menos uma tarefa para organizar seu dia." },
        { status: 400 }
      );
    }

    // 4. Escolhe o modelo do Gemini (o 'gemini-1.5-flash' é rápido e perfeito para texto/JSON)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // 5. O teu Super Prompt, agora dinâmico com o humor do utilizador!
    const prompt = `
      Você é um especialista em produtividade e organização pessoal. 
      A sua tarefa é converter a lista bagunçada do usuário num plano diário estruturado e executável.
      
      Humor atual do usuário: ${mood}
      
      Regras de Humor (MUITO IMPORTANTE):
      - Se o humor for "Tired" (Cansado): Crie blocos de trabalho curtos, adicione mais pausas, reduza a intensidade das tarefas.
      - Se o humor for "Normal": Comportamento padrão de produtividade.
      - Se o humor for "Focused" (Focado): Crie blocos longos de trabalho, poucas pausas, agrupe tarefas complexas.
      - Se o humor for "Overwhelmed" (Sobrecarragado): Carga de trabalho muito leve, pausas extras obrigatórias, priorize alívio emocional e tarefas fáceis primeiro.

      Regras obrigatórias:
      1. No máximo 8 tarefas no total do dia.
      2. Classifique a prioridade: Alta, Média ou Baixa.
      3. Estime a duração (ex: 30min, 1h, 2h).
      4. Organize as tarefas nos blocos corretos: Manhã, Tarde ou Noite.
      5. Use linguagem simples, positiva e direta.

      Lista de tarefas do usuário:
      "${tasks}"

      Formato de saída OBRIGATÓRIO:
      Você deve responder EXCLUSIVAMENTE com um objeto JSON válido, sem usar formatação markdown (\`\`\`json), sem textos antes ou depois. Use exatamente esta estrutura, gerando IDs únicos para cada tarefa:
      {
        "manha": [ { "id": "m1", "tarefa": "Exemplo", "duracao": "30min", "prioridade": "Alta" } ],
        "tarde": [ { "id": "t1", "tarefa": "Exemplo", "duracao": "1h", "prioridade": "Média" } ],
        "noite": [ { "id": "n1", "tarefa": "Exemplo", "duracao": "45min", "prioridade": "Baixa" } ],
        "mensagem": "Crie uma frase final baseada no humor do usuário."
      }
    `;

    // 6. Pede à IA para processar
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 7. Limpeza de segurança: às vezes a IA adiciona "```json" no início, isto remove isso para não quebrar o código
    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // 8. Transforma o texto em objeto JavaScript e envia para o Frontend
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