import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 1. Inicializa o Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any, // Versão da API (pode deixar esta)
});

// 2. Inicializa o Supabase com a chave de ADMIN (Service Role) para poder atualizar o banco
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('Stripe-Signature');

  let event;

  try {
    // Valida se a requisição realmente veio do Stripe
    event = stripe.webhooks.constructEvent(
      payload,
      signature || '',
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Erro no Webhook: ${err.message}` }, { status: 400 });
  }

  // 3. Verifica se o evento é de um pagamento aprovado
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;

    if (customerEmail) {
      // Busca o ID do usuário no Auth do Supabase usando o email da compra
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const user = usersData?.users.find((u) => u.email === customerEmail);

      if (user) {
        // Atualiza a coluna 'plano' para 'PRO' na tabela 'perfis'
        await supabaseAdmin
          .from('perfis')
          .update({ plano: 'PRO' })
          .eq('id', user.id);
      }
    }
  }

  return NextResponse.json({ recebido: true }, { status: 200 });
}