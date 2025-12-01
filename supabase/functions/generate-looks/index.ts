import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { occasion } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing environment variables');
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    console.log('Creating Supabase client with user token...');

    // Create Supabase client with user's JWT token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Fetching clothing items for user:', user.id);

    // Fetch user's clothing items
    const { data: items, error: itemsError } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id);

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      throw itemsError;
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Você precisa cadastrar algumas peças antes de gerar looks'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${items.length} items. Generating looks for occasion: ${occasion}`);

    // Prepare items description for AI
    const itemsDescription = items.map(item => 
      `ID: ${item.id}
Nome: ${item.name}
Tipo: ${item.type || 'N/A'}
Categoria: ${item.category}
Cor: ${item.color || 'N/A'}
Padrão: ${item.pattern || 'N/A'}
Estilo: ${item.style || 'N/A'}`
    ).join('\n\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em moda e styling. Dadas as peças de roupa disponíveis, crie combinações (looks) adequadas para a ocasião especificada.

IMPORTANTE: Cada look deve conter:
- 1 peça superior (categoria: superior)
- 1 peça inferior (categoria: inferior)  
- 1 par de sapatos (categoria: sapato)
- Opcionalmente acessórios (categoria: acessorio)

Retorne um JSON com este formato EXATO:
{
  "looks": [
    {
      "items": ["id1", "id2", "id3"],
      "description": "Descrição do look e por que funciona para a ocasião"
    }
  ]
}

Gere de 3 a 5 looks diferentes. Retorne APENAS o JSON, sem texto adicional.`
          },
          {
            role: 'user',
            content: `Ocasião: ${occasion}

Peças disponíveis:
${itemsDescription}

Crie looks adequados para esta ocasião usando as peças disponíveis.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos ao seu workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI Response:', content);

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-looks:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar looks'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
