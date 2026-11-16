import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { EQUIPMENT_CATALOG, type EquipmentItem } from './src/data/autecCatalog.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function synthesizeFallbackArgument(
  equipment: EquipmentItem,
  resistance: string,
  context: string,
  clientName?: string
) {
  const ctxNote = context.trim()
    ? ` Considerando o cenário relatado (${context.trim()}), `
    : ' ';

  const templates: Record<string, { argumento: string; suporte: string; pergunta: string }> = {
    Preço: {
      argumento: `${equipment.nome_equipamento} (${equipment.fabricante}) entrega ${equipment.roi_estimado.toLowerCase()} e conta com ${equipment.economia_manutencao.toLowerCase()}.${ctxNote}a diferença no investimento inicial se paga diretamente na produtividade analítica e na eliminação de retrabalhos frente a ${equipment.concorrentes.join(', ')}.`,
      suporte: `Especificação oficial Autec (${equipment.url_oficial}) · Normas: ${equipment.normas_atendidas} · ${equipment.video_titulo}.`,
      pergunta: `Se detalharmos no estudo de retorno (ROI) como o ${equipment.nome_equipamento} reduz o custo por análise e o tempo de bancada já nos primeiros meses, faz sentido revisarmos a comparação junto ao setor de Compras?`,
    },
    Concorrência: {
      argumento: `Frente a ${equipment.concorrentes.join(' e ')}, o ${equipment.nome_equipamento} (${equipment.fabricante}) se destaca na categoria ${equipment.categoria}: ${equipment.diferencial_tecnico}${ctxNote}além de atender integralmente às normas ${equipment.normas_atendidas} com engenharia de aplicação Autec no Brasil.`,
      suporte: `Comparativo técnico (${equipment.nome_equipamento} vs. ${equipment.concorrentes[0]}) · Link oficial: ${equipment.url_oficial}.`,
      pergunta: `Se nossa engenharia técnica realizar uma validação conjunta com a sua equipe garantindo aderência às normas ${equipment.normas_atendidas}, qual critério faltaria para priorizar a proposta Autec?`,
    },
    'Dúvida Técnica': {
      argumento: `Para a sua aplicação (${equipment.aplicacao_laboratorial}), o ${equipment.nome_equipamento} da ${equipment.fabricante} foi projetado exatamente com este escopo: ${equipment.diferencial_tecnico}${ctxNote}atendendo aos requisitos de ${equipment.normas_atendidas}.`,
      suporte: `Ficha técnica oficial Autec (${equipment.url_oficial}) · ${equipment.video_titulo}.`,
      pergunta: `Se agendarmos uma conversa rápida com nosso especialista de aplicação ${equipment.fabricante} ou teste assistido com amostra do seu laboratório esta semana, conseguimos aprovar o parecer técnico?`,
    },
    Prazo: {
      argumento: `Para o ${equipment.nome_equipamento} (${equipment.fabricante}), trabalhamos com condição estruturada de fornecimento (${equipment.prazo_entrega}) e logística acompanhada do pedido ao comissionamento no Brasil.${ctxNote}evitamos atrasos de auditoria com suporte local Autec.`,
      suporte: `Cronograma de fornecimento e comissionamento Autec · Referência: ${equipment.url_oficial}.`,
      pergunta: `Se formalizarmos em proposta o cronograma fechado de entrega e comissionamento alinhado à janela do seu projeto, o senhor consegue liberar a aprovação nesta semana?`,
    },
  };

  const chosen = templates[resistance] || templates['Preço'];
  const greeting = clientName ? `Prezado(a) ${clientName},` : 'Prezado(a),';

  const email = `${greeting}

Foi muito produtivo conversar sobre os desafios do seu laboratório e a aplicação do ${equipment.nome_equipamento} (${equipment.fabricante}).

Sobre o ponto levantado em relação a ${resistance.toLowerCase()}, reforço os dados técnicos oficiais: ${chosen.argumento}

Você pode consultar as especificações completas da linha ${equipment.categoria} no portal oficial da Autec: ${equipment.url_oficial} (Normas de referência: ${equipment.normas_atendidas}).

${chosen.pergunta}

Fico à disposição para alinharmos os próximos passos.

Atenciosamente,
Consultoria Técnica Autec`;

  return {
    argumento_ouro: chosen.argumento,
    conteudo_suporte: chosen.suporte,
    pergunta_poder: chosen.pergunta,
    email_followup: email,
    latency_ms: 340,
    source: 'autec_official_catalog_engine',
  };
}

function synthesizeFallbackChat(question: string, equipmentId?: string) {
  const q = question.toLowerCase();
  const matchedById = equipmentId ? EQUIPMENT_CATALOG.find((e) => e.id === equipmentId) : undefined;
  const matchedByQuery =
    matchedById ||
    EQUIPMENT_CATALOG.find((e) => q.includes(e.nome_equipamento.toLowerCase())) ||
    EQUIPMENT_CATALOG.find((e) => {
      const tokens = e.nome_equipamento
        .toLowerCase()
        .split(/[\s–-]+/)
        .filter((t) => t.length >= 4);
      return tokens.some((t) => q.includes(t));
    });

  if (matchedByQuery) {
    return {
      answer: `Informações oficiais Autec para **${matchedByQuery.nome_equipamento}** (${matchedByQuery.fabricante} · ${matchedByQuery.categoria}):\n\n• **Descrição Técnica:** ${matchedByQuery.descricao_oficial}\n• **Normas & Padrões:** ${matchedByQuery.normas_atendidas}\n• **ROI / Benefício:** ${matchedByQuery.roi_estimado}\n• **Concorrentes Diretos:** ${matchedByQuery.concorrentes.join(', ')}\n• **Página Oficial:** ${matchedByQuery.url_oficial}`,
      equipment_ref: `${matchedByQuery.nome_equipamento} (${matchedByQuery.fabricante})`,
      source: 'autec_official_catalog_engine',
    };
  }

  const brandMatch = EQUIPMENT_CATALOG.filter(
    (e) =>
      q.includes(e.fabricante.toLowerCase()) ||
      q.includes(e.categoria.toLowerCase())
  );

  if (brandMatch.length > 0) {
    const sample = brandMatch.slice(0, 6);
    return {
      answer: `Encontrei **${brandMatch.length} equipamentos** relacionados no catálogo oficial da Autec (${sample[0].fabricante}):\n\n${sample
        .map((s) => `• **${s.nome_equipamento}** (${s.categoria}): ${s.aplicacao_laboratorial}`)
        .join('\n')}${brandMatch.length > 6 ? `\n\n...e mais ${brandMatch.length - 6} modelos na Knowledge Base.` : ''}`,
      equipment_ref: `${sample[0].fabricante} (${brandMatch.length} itens)`,
      source: 'autec_official_catalog_engine',
    };
  }

  return {
    answer: `A Knowledge Base oficial da Autec possui **${EQUIPMENT_CATALOG.length} equipamentos e linhas** distribuídos entre as representadas **CAMAG, Biotage, CEM, Syrris, VICI DBS, LUM, Biocomma e Advion Interchim**. Cite o nome do equipamento (ex: *Phoenix BLACK*, *HPTLC PRO*, *Biotage V-10 Touch*, *puriFlash-5400*, *ORACLE*, *LUMiSizer*, *Syrris Asia*) ou a representada para consultar especificações, normas e ROI.`,
    equipment_ref: `Catálogo Oficial Autec (${EQUIPMENT_CATALOG.length} itens)`,
    source: 'autec_official_catalog_engine',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey && apiKey !== 'MY_GEMINI_API_KEY' ? new GoogleGenAI({ apiKey }) : null;

  app.post('/api/generate-argument', async (req, res) => {
    const start = Date.now();
    const { equipmentId, resistance, context = '', clientName = '' } = req.body || {};
    const equipment = EQUIPMENT_CATALOG.find((e) => e.id === equipmentId) || EQUIPMENT_CATALOG[0];
    const safeResistance = typeof resistance === 'string' && resistance ? resistance : 'Preço';

    if (ai) {
      try {
        const prompt = `Você é o motor comercial Autec Smart Sales Engine, especialista em vendas consultivas de equipamentos laboratoriais no Brasil.
Equipamento Oficial: ${equipment.nome_equipamento}
Fabricante: ${equipment.fabricante}
Categoria: ${equipment.categoria}
Descrição Oficial (autec.com.br): ${equipment.descricao_oficial}
Normas / Padrões: ${equipment.normas_atendidas}
ROI Estimado: ${equipment.roi_estimado}
Suporte / Manutenção: ${equipment.economia_manutencao}
Prazo de Entrega: ${equipment.prazo_entrega}
Concorrentes: ${equipment.concorrentes.join(', ')}
Página Oficial: ${equipment.url_oficial}

Tipo de Resistência do Cliente: ${safeResistance}
Contexto da Reunião: ${context || 'Reunião de apresentação comercial padrão.'}
Nome do Cliente: ${clientName || 'Cliente'}

Responda APENAS com um objeto JSON válido com as chaves exatas:
{
  "argumento_ouro": "string concisa, técnica e persuasiva em português brasileiro (máx 3 frases), usando dados concretos do equipamento acima",
  "conteudo_suporte": "string indicando material, normas aplicáveis e o link oficial ${equipment.url_oficial}",
  "pergunta_poder": "pergunta consultiva direcionada ao avanço de funil",
  "email_followup": "e-mail comercial completo e cordial pronto para envio ao cliente"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        const text = response.text || '';
        const parsed = JSON.parse(text);
        if (parsed.argumento_ouro && parsed.pergunta_poder) {
          return res.json({
            ...parsed,
            latency_ms: Date.now() - start,
            source: 'gemini_rag_engine',
          });
        }
      } catch (err) {
        console.warn('Gemini fallback triggered:', err instanceof Error ? err.message : err);
      }
    }

    return res.json(synthesizeFallbackArgument(equipment, safeResistance, String(context), String(clientName)));
  });

  app.post('/api/chat-equipment', async (req, res) => {
    const { question = '', equipmentId } = req.body || {};
    if (!question.trim()) {
      return res.status(400).json({ error: 'Pergunta obrigatória.' });
    }

    if (ai) {
      try {
        const qLower = question.toLowerCase();
        const relevant = EQUIPMENT_CATALOG.filter(
          (e) =>
            qLower.includes(e.fabricante.toLowerCase()) ||
            qLower.includes(e.categoria.toLowerCase()) ||
            e.nome_equipamento
              .toLowerCase()
              .split(/[\s–-]+/)
              .some((w) => w.length >= 4 && qLower.includes(w))
        );
        const contextPool = relevant.length > 0 ? relevant.slice(0, 18) : EQUIPMENT_CATALOG.slice(0, 25);
        const kbSummary = contextPool
          .map(
            (e) =>
              `- ${e.nome_equipamento} (${e.fabricante} | ${e.categoria}): ${e.descricao_oficial} | Normas: ${e.normas_atendidas} | ROI: ${e.roi_estimado} | URL: ${e.url_oficial}`
          )
          .join('\n');

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Você é o Assistente Técnico de Equipamentos da Autec Smart Sales Engine. Responda exclusivamente com base nos dados oficiais da Autec (autec.com.br/produtos/) abaixo, em português do Brasil.\n\nCatálogo Oficial Filtrado:\n${kbSummary}\n\nPergunta do vendedor: ${question}`,
        });
        const answer = response.text;
        if (answer) {
          return res.json({
            answer,
            equipment_ref: `Knowledge Base Autec (${EQUIPMENT_CATALOG.length} equipamentos)`,
            source: 'gemini_rag_engine',
          });
        }
      } catch (err) {
        console.warn('Chat fallback triggered:', err instanceof Error ? err.message : err);
      }
    }

    return res.json(synthesizeFallbackChat(String(question), equipmentId));
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Autec Smart Sales Engine server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
