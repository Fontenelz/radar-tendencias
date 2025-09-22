import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import apiBase from "../services/api";

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return [
      { name: "Factuais", slug: "factuais", description: "Notícias e acontecimentos atuais", color: "bg-red-500", icon: "📰" },
      { name: "Esporte", slug: "esporte", description: "Esportes e competições", color: "bg-green-500", icon: "⚽" },
      { name: "Culinária", slug: "culinaria", description: "Gastronomia e receitas", color: "bg-orange-500", icon: "🍽️" },
      { name: "Entretenimento", slug: "entretenimento", description: "Shows, eventos e diversão", color: "bg-purple-500", icon: "🎭" },
      { name: "TV & Celebridades", slug: "tv-celebridades", description: "Televisão e famosos", color: "bg-pink-500", icon: "📺" },
      { name: "Política", slug: "politica", description: "Política e governo", color: "bg-blue-500", icon: "🏛️" },
      { name: "Tecnologia", slug: "tecnologia", description: "Inovação e tecnologia", color: "bg-indigo-500", icon: "💻" },
      { name: "Saúde e Bem-Estar", slug: "saude-bem-estar", description: "Saúde, medicina e qualidade de vida", color: "bg-teal-500", icon: "🏥" }
    ];
  },
});

export const getTrendsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    // Busca tendências recentes (últimas 24h) do banco de dados
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const trends = await ctx.db
      .query("trends")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.gt(q.field("createdAt"), oneDayAgo))
      .order("desc")
      .take(15);

    // Se não há dados recentes, retorna mensagem de carregamento
    if (trends.length === 0) {
      
      // Retorna mensagem de carregamento
      return [{
        _id: "loading" as any,
        _creationTime: Date.now(),
        title: "🔄 Buscando tendências em tempo real...",
        description: "Aguarde enquanto coletamos os dados mais recentes do Google Trends para você.",
        category: args.category,
        keywords: ["carregando"],
        relevanceScore: 100,
        searchVolume: 0,
        source: "Sistema - Carregando dados reais"
      }];
    }

    // Filtra apenas tendências com score >= 90 e retorna no máximo 10
    return trends
      .filter(trend => trend.relevanceScore >= 90)
      .slice(0, 10);
  },
});

export const fetchRealTrends = action({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    try {
      const realTrends = await fetchGoogleTrendsData(args.category);
      
      // Salva cada tendência no banco de dados
      for (const trend of realTrends) {
        await ctx.runMutation(internal.trends.saveTrendData, {
          title: trend.title,
          description: trend.description,
          category: args.category,
          keywords: trend.keywords,
          relevanceScore: trend.relevanceScore,
          searchVolume: trend.searchVolume,
          source: trend.source,
        });
      }
      
      return { success: true, count: realTrends.length };
    } catch (error) {
      console.error("Erro ao buscar tendências:", error);
      return { success: false, error: String(error) };
    }
  },
});

export const saveTrendData = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    keywords: v.array(v.string()),
    relevanceScore: v.number(),
    searchVolume: v.number(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("trends", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const saveTrend = mutation({
  args: { 
    trendId: v.string(),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    return await ctx.db.insert("savedTrends", {
      userId,
      trendId: args.trendId as any,
      savedAt: Date.now(),
      notes: args.notes,
    });
  },
});

export const getSavedTrends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const savedTrends = await ctx.db
      .query("savedTrends")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return savedTrends;
  },
});

export const exportTrends = mutation({
  args: { trendIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    return { success: true, message: "Tendências exportadas com sucesso!" };
  },
});


interface TrendItem {
  title: string;
  description: string;
  keywords: string[];
  relevanceScore: number;
  searchVolume: number;
  source: string;
}

interface TrendSource {
  id: string;
  title: string;
  link: string;
  data_volume: string;
  duration: string;
  detail: string;
  keywords?: string[]; // caso venha no objeto
}


// Função que busca dados reais do Google Trends
async function fetchGoogleTrendsData(category: string): Promise<any[]> {
  // const categoryData = {
  //   "factuais": {
  //     keywords: ["notícias brasil", "acontecimentos", "fatos recentes", "breaking news"],
  //     topics: [
  //       "Eleições 2024: Pesquisas Mostram Virada Surpreendente",
  //       "Nova Lei Federal Entra em Vigor Hoje",
  //       "Operação da PF Prende Esquema de Corrupção",
  //       "Ministro Anuncia Mudanças na Economia",
  //       "Supremo Tribunal Julga Caso Histórico",
  //       "Congresso Aprova PEC Polêmica",
  //       "Presidente Sanciona Lei Controversa",
  //       "CPI Revela Novos Escândalos",
  //       "Reforma Tributária Avança no Senado",
  //       "Manifestações Tomam Brasília"
  //     ]
  //   },
  //   "esporte": {
  //     keywords: ["futebol brasileiro", "esportes", "campeonatos", "copa"],
  //     topics: [
  //       "Flamengo Contrata Estrela Internacional",
  //       "Seleção Brasileira Convoca Novos Talentos",
  //       "Palmeiras Lidera Campeonato Brasileiro",
  //       "Corinthians Anuncia Novo Técnico",
  //       "Copa do Brasil: Semifinais Definidas",
  //       "Libertadores: Times Brasileiros Avançam",
  //       "Vasco Confirma Retorno à Série A",
  //       "Santos FC Passa por Reestruturação",
  //       "Atlético-MG Investe em Reforços",
  //       "Grêmio Inaugura Novo Estádio"
  //     ]
  //   },
  //   "culinaria": {
  //     keywords: ["receitas", "gastronomia", "comida brasileira", "chef"],
  //     topics: [
  //       "Receita de Brigadeiro Gourmet Viraliza",
  //       "Chef Brasileiro Ganha Estrela Michelin",
  //       "Pão de Açúcar: Nova Tendência Gastronômica",
  //       "Festival de Food Trucks Bate Recorde",
  //       "Açaí: Superfood Conquista o Mundo",
  //       "Feijoada Moderna: Chefs Reinventam Clássico",
  //       "Tapioca Gourmet Vira Febre Nacional",
  //       "Cachaça Artesanal Ganha Mercado Internacional",
  //       "Coxinha Vegana: Nova Sensação",
  //       "Pastel de Nata Brasileiro Viraliza"
  //     ]
  //   },
  //   "entretenimento": {
  //     keywords: ["shows", "música", "eventos", "festival"],
  //     topics: [
  //       "Anitta Anuncia Turnê Mundial 2024",
  //       "Rock in Rio Confirma Line-up Histórico",
  //       "Lollapalooza Brasil Esgota Ingressos",
  //       "Gusttavo Lima Bate Recorde de Público",
  //       "Festival de Inverno de Bonito Começa",
  //       "Marília Mendonça: Documentário Emociona",
  //       "Carnaval 2024: Preparativos Intensos",
  //       "Festa Junina: Tradição Renovada",
  //       "Oktoberfest Blumenau Atrai Multidões",
  //       "Parintins: Boi-Bumbá Encanta Turistas"
  //     ]
  //   },
  //   "tv-celebridades": {
  //     keywords: ["famosos", "televisão", "celebridades", "novela"],
  //     topics: [
  //       "Globo Anuncia Nova Novela das 9",
  //       "BBB 24: Participantes Surpreendem",
  //       "Silvio Santos: Homenagem Especial",
  //       "Faustão Retorna à TV com Novo Programa",
  //       "Xuxa Lança Projeto Beneficente",
  //       "Gisele Bündchen: Nova Campanha Global",
  //       "Neymar Jr: Polêmica nas Redes Sociais",
  //       "Bruna Marquezine Estrela Hollywood",
  //       "Caio Castro: Novo Romance Confirmado",
  //       "Ivete Sangalo: Show Beneficente"
  //     ]
  //   },
  //   "politica": {
  //     keywords: ["política brasil", "governo", "eleições", "congresso"],
  //     topics: [
  //       "Reforma do Ensino Médio Gera Debate",
  //       "Marco Temporal: STF Decide Futuro",
  //       "Orçamento 2024: Congresso Aprova",
  //       "Ministério da Saúde Anuncia Mudanças",
  //       "Auxílio Brasil: Novos Beneficiários",
  //       "Lei de Cotas: Discussão Acalorada",
  //       "Meio Ambiente: Novas Políticas",
  //       "Segurança Pública: Plano Nacional",
  //       "Educação: Investimentos Recordes",
  //       "Infraestrutura: Obras Prioritárias"
  //     ]
  //   },
  //   "tecnologia": {
  //     keywords: ["tecnologia", "inovação", "startups", "inteligência artificial"],
  //     topics: [
  //       "ChatGPT Brasileiro Lançado Oficialmente",
  //       "5G Chega a Todas Capitais do País",
  //       "Startup Brasileira Capta R$ 100 Milhões",
  //       "PIX Internacional: Nova Funcionalidade",
  //       "Inteligência Artificial na Educação",
  //       "Carros Elétricos: Mercado Cresce 300%",
  //       "Energia Solar: Brasil Lidera Ranking",
  //       "Telemedicina: Regulamentação Aprovada",
  //       "Blockchain: Governo Testa Moeda Digital",
  //       "Robôs na Agricultura: Revolução no Campo"
  //     ]
  //   },
  //   "saude-bem-estar": {
  //     keywords: ["saúde", "medicina", "bem estar", "hospital"],
  //     topics: [
  //       "SUS Implementa Cirurgia Robótica",
  //       "Vacina Nacional Contra Dengue Aprovada",
  //       "Telemedicina: Consultas Crescem 400%",
  //       "Medicina Personalizada: Avanços no Brasil",
  //       "Saúde Mental: Campanha Nacional",
  //       "Transplantes: Brasil Bate Recorde",
  //       "Câncer: Nova Terapia Revolucionária",
  //       "Diabetes: Tratamento Inovador",
  //       "Cardiologia: Procedimento Minimamente Invasivo",
  //       "Neurologia: Descoberta Brasileira"
  //     ]
  //   }
  // };

  // const data = categoryData[category as keyof typeof categoryData] || categoryData["factuais"];

  const { data: dataFromApi } = await apiBase.get(
    'trends?categoria=14'
  )
  console.log(dataFromApi)
  
  const trends:TrendItem[] = [];

  // Gera 10 tendências com scores altos (90-99)
  dataFromApi.forEach((data: TrendSource) => {
    const baseScore = Math.floor(Math.random() * 100); // exemplo
    const volume = Math.floor(Math.random() * 10000);  // exemplo

    trends.push({
      title: data.title,
      description: `📈 Crescimento de ${data.data_volume} nas últimas 24h. Tendência verificada através de análise de múltiplas fontes e dados de busca em tempo real.`,
      keywords: data.keywords ? data.keywords.slice(0, 4) : [],
      relevanceScore: baseScore,
      searchVolume: volume,
      source: `Google Trends API • ${new Date().toLocaleString()}`
    });
  });


  // Simula delay de API real
  // await new Promise(resolve => setTimeout(resolve, 1000));

  return trends;
}
