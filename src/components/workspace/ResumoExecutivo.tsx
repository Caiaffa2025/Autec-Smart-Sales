import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EQUIPMENT_CATALOG } from '../../data/autecCatalog';
import type { ActivityRecord, OpportunityRecord } from '../../data/autecData';

interface ResumoExecutivoProps {
  selectedSeller: string;
  opportunities: OpportunityRecord[];
  activities: ActivityRecord[];
}

interface FunnelStagePoint {
  etapa: string;
  curto: string;
  quantidade: number;
  valor: number;
  taxaEtapa: number;
  taxaAcumulada: number;
  fill: string;
}

interface MonthlyConversionPoint {
  mes: string;
  taxa: number;
  metaTaxa: number;
  propostas: number;
  ganhas: number;
}

interface ProductLinePoint {
  linha: string;
  linhaCompleta: string;
  propostas: number;
  ganhas: number;
  valorEstimado: number;
}

const SELLER_SCALE_MAP: Record<string, number> = {
  'Rafael Mendonça': 0.34,
  'Camila Duarte': 0.27,
  'Lucas Albuquerque': 0.23,
  'Marina Vasconcelos': 0.16,
};

const MONTHLY_HISTORY_BASE: Array<{ mes: string; taxaBase: number; propostasBase: number }> = [
  { mes: 'Dez', taxaBase: 36.4, propostasBase: 33 },
  { mes: 'Jan', taxaBase: 38.2, propostasBase: 34 },
  { mes: 'Fev', taxaBase: 40.5, propostasBase: 37 },
  { mes: 'Mar', taxaBase: 41.9, propostasBase: 43 },
  { mes: 'Abr', taxaBase: 43.2, propostasBase: 44 },
  { mes: 'Mai', taxaBase: 42.1, propostasBase: 45 },
  { mes: 'Jun', taxaBase: 44.8, propostasBase: 47 },
  { mes: 'Jul', taxaBase: 46.5, propostasBase: 49 },
  { mes: 'Ago', taxaBase: 45.1, propostasBase: 51 },
  { mes: 'Set', taxaBase: 48.9, propostasBase: 53 },
  { mes: 'Out', taxaBase: 50.8, propostasBase: 59 },
];

const SELLER_CONVERSION_OFFSET: Record<string, number> = {
  'Rafael Mendonça': 6.4,
  'Camila Duarte': 4.2,
  'Lucas Albuquerque': -1.8,
  'Marina Vasconcelos': -4.5,
};

const PRODUCT_LINE_BASELINES: Array<{
  linha: string;
  linhaCompleta: string;
  propostasBase: number;
  ganhasBase: number;
  ticketBase: number;
}> = [
  {
    linha: 'Preparo de Amostras',
    linhaCompleta: 'Preparo de Amostras & Análise Rápida (CEM / Biotage)',
    propostasBase: 16,
    ganhasBase: 8,
    ticketBase: 245000,
  },
  {
    linha: 'Cromat. Analítica',
    linhaCompleta: 'Cromatografia Analítica HPTLC / TLC (CAMAG)',
    propostasBase: 12,
    ganhasBase: 6,
    ticketBase: 360000,
  },
  {
    linha: 'Cromat. Preparativa',
    linhaCompleta: 'Cromatografia Preparativa & Flash (Biotage / Advion)',
    propostasBase: 9,
    ganhasBase: 4,
    ticketBase: 280000,
  },
  {
    linha: 'Processos & Estab.',
    linhaCompleta: 'Análise de Processos e Estabilidade (LUM)',
    propostasBase: 7,
    ganhasBase: 3,
    ticketBase: 305000,
  },
  {
    linha: 'Geradores de Gases',
    linhaCompleta: 'Geradores de Gases Analíticos (VICI DBS)',
    propostasBase: 8,
    ganhasBase: 5,
    ticketBase: 175000,
  },
  {
    linha: 'Reatores & Fluxo',
    linhaCompleta: 'Reatores de Batelada e Fluxo Contínuo (Syrris)',
    propostasBase: 6,
    ganhasBase: 3,
    ticketBase: 410000,
  },
  {
    linha: 'Evaporação & Síntese',
    linhaCompleta: 'Evaporação de Solventes & Síntese de Peptídeos',
    propostasBase: 6,
    ganhasBase: 3,
    ticketBase: 295000,
  },
];

const BRAND_BASELINES: Array<{
  linha: string;
  linhaCompleta: string;
  propostasBase: number;
  ganhasBase: number;
  ticketBase: number;
}> = [
  { linha: 'CEM', linhaCompleta: 'CEM Corporation', propostasBase: 15, ganhasBase: 8, ticketBase: 255000 },
  { linha: 'CAMAG', linhaCompleta: 'CAMAG HPTLC', propostasBase: 12, ganhasBase: 6, ticketBase: 365000 },
  { linha: 'Biotage', linhaCompleta: 'Biotage® Systems', propostasBase: 13, ganhasBase: 6, ticketBase: 285000 },
  { linha: 'VICI DBS', linhaCompleta: 'VICI DBS Gas Generators', propostasBase: 8, ganhasBase: 5, ticketBase: 175000 },
  { linha: 'LUM', linhaCompleta: 'LUM GmbH Dispersion', propostasBase: 7, ganhasBase: 3, ticketBase: 305000 },
  { linha: 'Syrris', linhaCompleta: 'Syrris Batch & Flow', propostasBase: 6, ganhasBase: 3, ticketBase: 410000 },
  { linha: 'Advion', linhaCompleta: 'Advion Interchim', propostasBase: 3, ganhasBase: 1, ticketBase: 320000 },
];

function formatCompactBRL(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(2).replace('.', ',')}M`;
  }
  if (value >= 1_000) {
    return `R$ ${Math.round(value / 1_000)}k`;
  }
  return `R$ ${value}`;
}

function formatFullBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeProductLine(categoria: string): string {
  const lower = categoria.toLowerCase();
  if (lower.includes('analítica') || lower.includes('hptlc')) return 'Cromat. Analítica';
  if (lower.includes('preparativa') || lower.includes('flash')) return 'Cromat. Preparativa';
  if (lower.includes('processos') || lower.includes('estabilidade')) return 'Processos & Estab.';
  if (lower.includes('gases')) return 'Geradores de Gases';
  if (lower.includes('reatores') || lower.includes('fluxo')) return 'Reatores & Fluxo';
  if (lower.includes('evaporação') || lower.includes('síntese')) return 'Evaporação & Síntese';
  return 'Preparo de Amostras';
}

function useDarkModeObserver(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export const ResumoExecutivo: React.FC<ResumoExecutivoProps> = ({
  selectedSeller,
  opportunities,
  activities,
}) => {
  const isDark = useDarkModeObserver();
  const [conversionWindow, setConversionWindow] = useState<'6m' | '12m'>('6m');
  const [productGrouping, setProductGrouping] = useState<'categoria' | 'fabricante'>('categoria');

  const sellerScale = selectedSeller === 'Todos' ? 1 : SELLER_SCALE_MAP[selectedSeller] ?? 0.25;

  const funnelData = useMemo<FunnelStagePoint[]>(() => {
    const ganhas = opportunities.filter((o) => o.status === 'ganha');
    const negociacao = opportunities.filter((o) => o.status === 'em_negociacao');
    const propostasCount = opportunities.length;
    const realizadasCount = activities.filter((a) => a.status === 'realizada').length;

    const totalPropostas = Math.max(propostasCount, Math.round(49 * sellerScale));
    const emQualificacao = Math.max(
      totalPropostas + Math.max(4, realizadasCount * 3),
      Math.round(78 * sellerScale)
    );
    const leadsQualificados = Math.max(
      emQualificacao + Math.round(38 * sellerScale),
      Math.round(118 * sellerScale)
    );
    const emNegociacao = Math.max(
      ganhas.length + negociacao.length + Math.round(12 * sellerScale),
      Math.round(29 * sellerScale)
    );
    const fechamentos = Math.max(ganhas.length, Math.round(18 * sellerScale));

    const ganhasValor =
      ganhas.reduce((acc, o) => acc + o.valor, 0) +
      Math.max(0, fechamentos - ganhas.length) * 265000;
    const ticketMedio = ganhas.length > 0 ? ganhas.reduce((a, b) => a + b.valor, 0) / ganhas.length : 275000;

    const rawStages = [
      {
        etapa: 'Leads & Contatos Técnicos',
        curto: 'Leads',
        quantidade: leadsQualificados,
        valor: Math.round(leadsQualificados * ticketMedio * 0.42),
        fill: isDark ? '#1E3A8A' : '#1B2E5E',
      },
      {
        etapa: 'Demos & Testes Assistidos',
        curto: 'Demos',
        quantidade: emQualificacao,
        valor: Math.round(emQualificacao * ticketMedio * 0.58),
        fill: isDark ? '#2563EB' : '#2B4C9B',
      },
      {
        etapa: 'Propostas Enviadas',
        curto: 'Propostas',
        quantidade: totalPropostas,
        valor: Math.round(totalPropostas * ticketMedio * 0.85),
        fill: isDark ? '#0284C7' : '#0369A1',
      },
      {
        etapa: 'Negociação Avançada',
        curto: 'Negociação',
        quantidade: emNegociacao,
        valor: Math.round(emNegociacao * ticketMedio * 0.94),
        fill: isDark ? '#F59E0B' : '#D97706',
      },
      {
        etapa: 'Vendas Ganhas',
        curto: 'Ganhas',
        quantidade: fechamentos,
        valor: Math.round(ganhasValor),
        fill: isDark ? '#10B981' : '#16A34A',
      },
    ];

    const topCount = rawStages[0].quantidade || 1;
    return rawStages.map((stage, idx) => {
      const prevCount = idx === 0 ? stage.quantidade : rawStages[idx - 1].quantidade || 1;
      return {
        ...stage,
        taxaEtapa: idx === 0 ? 100 : Math.round((stage.quantidade / prevCount) * 1000) / 10,
        taxaAcumulada: Math.round((stage.quantidade / topCount) * 1000) / 10,
      };
    });
  }, [opportunities, activities, sellerScale, isDark]);

  const monthlyConversionData = useMemo<MonthlyConversionPoint[]>(() => {
    const ganhasNov = opportunities.filter((o) => o.status === 'ganha').length;
    const totalNov = opportunities.length;
    const novRateRaw = totalNov > 0 ? (ganhasNov / totalNov) * 100 : 48.0;
    const offset = selectedSeller === 'Todos' ? 0 : SELLER_CONVERSION_OFFSET[selectedSeller] ?? 0;

    const series: MonthlyConversionPoint[] = MONTHLY_HISTORY_BASE.map((m) => {
      const propostas = Math.max(3, Math.round(m.propostasBase * sellerScale));
      const taxa = Math.min(85, Math.max(18, Number((m.taxaBase + offset).toFixed(1))));
      const ganhas = Math.max(1, Math.round((propostas * taxa) / 100));
      return {
        mes: m.mes,
        taxa,
        metaTaxa: 45,
        propostas,
        ganhas,
      };
    });

    series.push({
      mes: 'Nov',
      taxa: Number(novRateRaw.toFixed(1)),
      metaTaxa: 45,
      propostas: totalNov,
      ganhas: ganhasNov,
    });

    return conversionWindow === '6m' ? series.slice(-6) : series;
  }, [opportunities, selectedSeller, sellerScale, conversionWindow]);

  const productLineData = useMemo<ProductLinePoint[]>(() => {
    const catalogMap = new Map(
      EQUIPMENT_CATALOG.map((item) => [item.nome_equipamento.toLowerCase(), item])
    );

    if (productGrouping === 'categoria') {
      const counts = new Map<
        string,
        { linhaCompleta: string; propostas: number; ganhas: number; valor: number }
      >();

      PRODUCT_LINE_BASELINES.forEach((b) => {
        const baseProp = Math.max(1, Math.round(b.propostasBase * sellerScale));
        const baseWin = Math.max(0, Math.round(b.ganhasBase * sellerScale));
        counts.set(b.linha, {
          linhaCompleta: b.linhaCompleta,
          propostas: baseProp,
          ganhas: baseWin,
          valor: baseProp * b.ticketBase,
        });
      });

      opportunities.forEach((opp) => {
        const lowerName = opp.produto.toLowerCase();
        const match =
          catalogMap.get(lowerName) ||
          EQUIPMENT_CATALOG.find(
            (e) =>
              lowerName.includes(e.nome_equipamento.toLowerCase()) ||
              e.nome_equipamento.toLowerCase().includes(lowerName)
          );
        const key = match ? normalizeProductLine(match.categoria) : 'Preparo de Amostras';
        const existing = counts.get(key) || {
          linhaCompleta: key,
          propostas: 0,
          ganhas: 0,
          valor: 0,
        };
        counts.set(key, {
          ...existing,
          propostas: existing.propostas + 1,
          ganhas: existing.ganhas + (opp.status === 'ganha' ? 1 : 0),
          valor: existing.valor + opp.valor,
        });
      });

      return Array.from(counts.entries())
        .map(([linha, info]) => ({
          linha,
          linhaCompleta: info.linhaCompleta,
          propostas: info.propostas,
          ganhas: info.ganhas,
          valorEstimado: info.valor,
        }))
        .sort((a, b) => b.propostas - a.propostas);
    }

    const brandCounts = new Map<
      string,
      { linhaCompleta: string; propostas: number; ganhas: number; valor: number }
    >();

    BRAND_BASELINES.forEach((b) => {
      const baseProp = Math.max(1, Math.round(b.propostasBase * sellerScale));
      const baseWin = Math.max(0, Math.round(b.ganhasBase * sellerScale));
      brandCounts.set(b.linha, {
        linhaCompleta: b.linhaCompleta,
        propostas: baseProp,
        ganhas: baseWin,
        valor: baseProp * b.ticketBase,
      });
    });

    opportunities.forEach((opp) => {
      const lowerName = opp.produto.toLowerCase();
      const match =
        catalogMap.get(lowerName) ||
        EQUIPMENT_CATALOG.find(
          (e) =>
            lowerName.includes(e.nome_equipamento.toLowerCase()) ||
            e.nome_equipamento.toLowerCase().includes(lowerName)
        );
      let brandKey = match?.fabricante || 'CEM';
      if (brandKey === 'Advion Interchim') brandKey = 'Advion';
      if (brandKey === 'Biocomma') brandKey = 'Biotage';
      const existing = brandCounts.get(brandKey) || {
        linhaCompleta: brandKey,
        propostas: 0,
        ganhas: 0,
        valor: 0,
      };
      brandCounts.set(brandKey, {
        ...existing,
        propostas: existing.propostas + 1,
        ganhas: existing.ganhas + (opp.status === 'ganha' ? 1 : 0),
        valor: existing.valor + opp.valor,
      });
    });

    return Array.from(brandCounts.entries())
      .map(([linha, info]) => ({
        linha,
        linhaCompleta: info.linhaCompleta,
        propostas: info.propostas,
        ganhas: info.ganhas,
        valorEstimado: info.valor,
      }))
      .sort((a, b) => b.propostas - a.propostas);
  }, [opportunities, productGrouping, sellerScale]);

  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const axisTickColor = isDark ? '#94A3B8' : '#64748B';
  const funnelStroke = isDark ? '#0F172A' : '#FFFFFF';
  const lineStroke = isDark ? '#38BDF8' : '#1B2E5E';
  const areaFill = isDark ? '#0284C7' : '#1B2E5E';
  const targetStroke = isDark ? '#F59E0B' : '#D97706';
  const barColors = isDark
    ? ['#38BDF8', '#2563EB', '#F59E0B', '#10B981', '#60A5FA', '#818CF8', '#94A3B8']
    : ['#1B2E5E', '#2B4C9B', '#0369A1', '#D97706', '#16A34A', '#475569', '#64748B'];

  const totalProposalsInChart = productLineData.reduce((acc, item) => acc + item.propostas, 0);
  const overallFunnelConversion =
    funnelData[0]?.quantidade > 0
      ? ((funnelData[funnelData.length - 1].quantidade / funnelData[0].quantidade) * 100).toFixed(1)
      : '0.0';
  const latestMonthConv = monthlyConversionData[monthlyConversionData.length - 1]?.taxa ?? 0;

  return (
    <section
      aria-labelledby="resumo-executivo-heading"
      className="space-y-6 pt-2"
    >
      {/* Header do Bloco Resumo Executivo */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Resumo Executivo · {selectedSeller === 'Todos' ? 'Equipe Comercial Autec' : selectedSeller}
          </p>
          <h2
            id="resumo-executivo-heading"
            className="font-display text-lg font-bold text-[#1B2E5E] dark:text-white mt-0.5"
          >
            Resumo Executivo
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
          <span>
            Eficiência ponta a ponta:{' '}
            <strong className="font-mono text-emerald-700 dark:text-emerald-400">
              {overallFunnelConversion}%
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Conversão mês atual:{' '}
            <strong className="font-mono text-[#1B2E5E] dark:text-sky-300">
              {latestMonthConv.toFixed(1)}%
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Propostas no mix:{' '}
            <strong className="font-mono text-slate-900 dark:text-slate-100">
              {totalProposalsInChart}
            </strong>
          </span>
        </div>
      </div>

      {/* Grid Principal: Funil de Vendas + Taxa de Conversão Mensal */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Gráfico 1: Funil de Vendas (Recharts FunnelChart) */}
        <div className="xl:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Funil de Vendas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Progressão de oportunidades da prospecção técnica ao fechamento
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-[#1B2E5E] dark:text-amber-400 tabular-nums shrink-0">
              {funnelData[funnelData.length - 1]?.quantidade ?? 0} ganhas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center flex-1">
            <div className="md:col-span-7 h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const point = payload[0].payload as FunnelStagePoint;
                      return (
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 shadow-sm text-xs">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {point.etapa}
                          </p>
                          <div className="mt-1.5 space-y-0.5 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                            <p>Volume: {point.quantidade} oportunidades</p>
                            <p>Receita est.: {formatFullBRL(point.valor)}</p>
                            <p>Passagem etapa: {point.taxaEtapa}%</p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Funnel
                    dataKey="quantidade"
                    data={funnelData}
                    nameKey="curto"
                    lastShapeType="rectangle"
                    isAnimationActive
                  >
                    {funnelData.map((entry) => (
                      <Cell key={entry.etapa} fill={entry.fill} stroke={funnelStroke} strokeWidth={2} />
                    ))}
                    <LabelList
                      position="center"
                      dataKey="quantidade"
                      fill="#FFFFFF"
                      stroke="none"
                      style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>

            <div className="md:col-span-5 divide-y divide-slate-100 dark:divide-slate-800">
              {funnelData.map((stage) => (
                <div key={stage.etapa} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {stage.curto}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {formatCompactBRL(stage.valor)}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {stage.quantidade}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {stage.taxaAcumulada}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico 2: Taxa de Conversão Mensal (Recharts ComposedChart) */}
        <div className="xl:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Taxa de Conversão Mensal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evolução percentual de propostas convertidas vs. meta de 45%
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start shrink-0">
              {(
                [
                  { id: '6m', label: '6 Meses' },
                  { id: '12m', label: '12 Meses' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConversionWindow(opt.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    conversionWindow === opt.id
                      ? 'bg-white dark:bg-slate-900 text-[#1B2E5E] dark:text-amber-400 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[260px] w-full min-w-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyConversionData}
                margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="autecConvFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={areaFill} stopOpacity={isDark ? 0.32 : 0.18} />
                    <stop offset="95%" stopColor={areaFill} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 80]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine
                  y={45}
                  stroke={targetStroke}
                  strokeDasharray="4 4"
                  label={{
                    value: 'Meta 45%',
                    position: 'insideTopRight',
                    fill: targetStroke,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const point = payload[0].payload as MonthlyConversionPoint;
                    return (
                      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 shadow-sm text-xs">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {point.mes} / 2026
                        </p>
                        <div className="mt-1.5 space-y-0.5 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          <p className="text-[#1B2E5E] dark:text-sky-300 font-semibold">
                            Conversão: {point.taxa.toFixed(1)}%
                          </p>
                          <p>Vendas ganhas: {point.ganhas}</p>
                          <p>Propostas emitidas: {point.propostas}</p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="taxa"
                  stroke="none"
                  fill="url(#autecConvFill)"
                />
                <Line
                  type="monotone"
                  dataKey="taxa"
                  stroke={lineStroke}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: lineStroke, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: targetStroke, stroke: funnelStroke, strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico 3: Volume de Propostas por Linha de Produto (Full Width) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Volume de Propostas por Linha de Produto
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribuição de propostas emitidas e fechamentos ganhos no portfólio Autec
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start shrink-0">
            {(
              [
                { id: 'categoria', label: 'Por Linha de Produto' },
                { id: 'fabricante', label: 'Por Representada' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setProductGrouping(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  productGrouping === opt.id
                    ? 'bg-white dark:bg-slate-900 text-[#1B2E5E] dark:text-amber-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[290px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={productLineData}
              margin={{ top: 8, right: 16, left: -12, bottom: 12 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="linha"
                tick={{ fill: axisTickColor, fontSize: 11 }}
                axisLine={{ stroke: gridStroke }}
                tickLine={false}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: axisTickColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(27, 46, 94, 0.05)' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const point = payload[0].payload as ProductLinePoint;
                  const winPct =
                    point.propostas > 0 ? ((point.ganhas / point.propostas) * 100).toFixed(0) : '0';
                  return (
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 shadow-sm text-xs max-w-[260px]">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {point.linhaCompleta}
                      </p>
                      <div className="mt-1.5 space-y-0.5 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        <p>Propostas emitidas: {point.propostas}</p>
                        <p className="text-emerald-700 dark:text-emerald-400">
                          Vendas ganhas: {point.ganhas} ({winPct}%)
                        </p>
                        <p>Pipeline estimado: {formatFullBRL(point.valorEstimado)}</p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="propostas" name="Propostas" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {productLineData.map((entry, idx) => (
                  <Cell key={entry.linha} fill={barColors[idx % barColors.length]} />
                ))}
              </Bar>
              <Bar
                dataKey="ganhas"
                name="Vendas Ganhas"
                fill={isDark ? '#10B981' : '#16A34A'}
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ backgroundColor: barColors[0] }}
                aria-hidden="true"
              />
              Propostas emitidas
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ backgroundColor: isDark ? '#10B981' : '#16A34A' }}
                aria-hidden="true"
              />
              Vendas ganhas
            </span>
          </div>
          <span className="font-mono tabular-nums">
            Líder de demanda: <strong className="text-slate-800 dark:text-slate-200">{productLineData[0]?.linha}</strong> ({productLineData[0]?.propostas} propostas)
          </span>
        </div>
      </div>
    </section>
  );
};
