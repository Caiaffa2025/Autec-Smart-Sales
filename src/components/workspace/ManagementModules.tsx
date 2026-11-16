import React, { useMemo, useState } from 'react';
import {
  Search,
  Download,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Award,
  UserPlus,
  Check,
  FileText,
  FileDown,
  Pencil,
} from 'lucide-react';
import { exportHistoricoPdf } from '../../utils/pdfExport';
import { ResumoExecutivo } from './ResumoExecutivo';
import { getDaysUntil, getGoalProgressValue } from './NotificationCenter';
import {
  EQUIPMENT_CATALOG,
  SELLER_RANKING,
  COMPETITOR_RADAR,
  WEEKLY_OBJECTIONS_DIST,
  type InteractionRecord,
  type OpportunityRecord,
  type ActivityRecord,
  type GoalRecord,
  type CollaboratorRecord,
  type LeadRecord,
  type ResistanceType,
} from '../../data/autecData';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

/* -------------------------------------------------------------------------- */
/* 1. PAINEL (DASHBOARD COMERCIAL)                                            */
/* -------------------------------------------------------------------------- */
interface PainelModuleProps {
  interactions: InteractionRecord[];
}

export const PainelModule: React.FC<PainelModuleProps> = ({ interactions }) => {
  const [subTab, setSubTab] = useState<'geral' | 'semanal' | 'radar' | 'estagnacao'>('geral');

  const totalWeekly = 60 + interactions.length;
  const avancos = 44 + interactions.filter((i) => i.avancou).length;
  const eff = (avancos / totalWeekly) * 100;

  const stagnationBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      'Orçamento congelado': 6,
      'Concorrente com menor preço inicial': 5,
      'Aguardando aprovação técnica': 4,
      'Prazo de auditoria apertado': 2,
    };
    interactions
      .filter((i) => !i.avancou && i.motivo)
      .forEach((i) => {
        const key = i.motivo!;
        counts[key] = (counts[key] || 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [interactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sumário da Semana · Inteligência Comercial</p>
          <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">Painel (Dashboard Comercial)</h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg self-start">
          {(
            [
              { key: 'geral', label: 'Visão Geral' },
              { key: 'semanal', label: 'Semanal' },
              { key: 'radar', label: 'Radar de Concorrência' },
              { key: 'estagnacao', label: 'Motivos de Estagnação' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSubTab(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                subTab === t.key
                  ? 'bg-white dark:bg-slate-900 text-[#1B2E5E] dark:text-amber-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Interações na Semana</p>
          <p className="font-mono text-2xl font-bold text-[#1B2E5E] dark:text-sky-300 mt-1 tabular-nums">{totalWeekly}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Eficiência do Funil</p>
          <p className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">{eff.toFixed(1)}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Objeção Mais Comum</p>
          <p className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">Preço (36%)</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Principal Motivo de Perda</p>
          <p className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">Orçamento congelado</p>
        </div>
      </div>

      {subTab === 'geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              Ranking de Objeções e Taxa de Superação
            </h2>
            <div className="space-y-4">
              {WEEKLY_OBJECTIONS_DIST.map((obj) => {
                const pct = Math.round((obj.avancos / obj.quantidade) * 100);
                return (
                  <div key={obj.tipo}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{obj.tipo}</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                        {obj.avancos}/{obj.quantidade} avanços ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1B2E5E] dark:bg-[#F59E0B] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Últimas Interações</h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {interactions.slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{item.equipamento}</span>
                    <span className={`font-medium shrink-0 ${item.avancou ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {item.avancou ? 'Avançou' : 'Estagnou'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.vendedor_nome} · {item.resistencia} · {item.data}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'semanal' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Eficiência de Vendas por Semana
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Percentual de interações que avançaram no funil nas últimas 4 semanas
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { sem: 'Semana 43', inter: 54, effPct: 68.5 },
              { sem: 'Semana 44', inter: 61, effPct: 72.1 },
              { sem: 'Semana 45', inter: 58, effPct: 74.1 },
              { sem: 'Semana Atual', inter: totalWeekly, effPct: Number(eff.toFixed(1)) },
            ].map((w) => (
              <div key={w.sem} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-950/50">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{w.sem}</p>
                <p className="font-mono text-2xl font-bold text-[#1B2E5E] dark:text-amber-400 mt-2 tabular-nums">{w.effPct}%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">{w.inter} interações registradas</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'radar' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Radar de Concorrentes — Citações em Reuniões (Últimos 7 dias)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Marcas concorrentes citadas por equipamento Autec e argumento vencedor validado.
            </p>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {COMPETITOR_RADAR.map((c) => (
              <div
                key={c.marca}
                className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.equipamento_autec}</p>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{c.marca}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{c.principal_argumento_vencedor}</p>
                </div>
                <div className="flex items-center gap-6 shrink-0 tabular-nums">
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-[#1B2E5E] dark:text-sky-300">{c.citacoes_semana}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Citações</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">{c.taxa_vitoria_autec}%</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Vitória Autec</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'estagnacao' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">Motivos de Estagnação Registrados</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stagnationBreakdown.map(([motivo, count]) => (
              <div key={motivo} className="py-3 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800 dark:text-slate-200">{motivo}</span>
                <span className="font-mono font-semibold text-[#1B2E5E] dark:text-amber-400 tabular-nums">{count} ocorrências</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. HISTÓRICO DE INTERAÇÕES                                                 */
/* -------------------------------------------------------------------------- */
interface HistoricoModuleProps {
  interactions: InteractionRecord[];
}

export const HistoricoModule: React.FC<HistoricoModuleProps> = ({ interactions }) => {
  const [search, setSearch] = useState('');
  const [resistanceFilter, setResistanceFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'avancou' | 'estagnou'>('todos');
  const [pdfExported, setPdfExported] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return interactions.filter((item) => {
      if (resistanceFilter !== 'Todas' && item.resistencia !== resistanceFilter) return false;
      if (statusFilter === 'avancou' && !item.avancou) return false;
      if (statusFilter === 'estagnou' && item.avancou) return false;
      if (!q) return true;
      return [item.cliente, item.equipamento, item.vendedor_nome, item.concorrente_citado, item.contexto || '']
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [interactions, search, resistanceFilter, statusFilter]);

  const handleExportCsv = () => {
    const headers = ['Data', 'Vendedor', 'Cliente', 'Equipamento', 'Resistência', 'Concorrente', 'Status', 'Motivo'];
    const rows = filtered.map((r) => [
      r.data,
      r.vendedor_nome,
      r.cliente,
      r.equipamento,
      r.resistencia,
      r.concorrente_citado,
      r.avancou ? 'Avançou' : 'Estagnou',
      r.motivo || '-',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historico_interacoes_autec.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    exportHistoricoPdf({
      interactions: filtered,
      filters: {
        search,
        resistance: resistanceFilter,
        status: statusFilter,
      },
    });
    setPdfExported(true);
    setTimeout(() => setPdfExported(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Registro Contínuo de Negociações em Campo</p>
          <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">Histórico de Interações</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#1B2E5E] dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap"
          >
            {pdfExported ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-300 dark:text-slate-950" />
                PDF exportado
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                Exportar PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, equipamento, vendedor ou concorrente..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg"
          />
        </div>
        <select
          value={resistanceFilter}
          onChange={(e) => setResistanceFilter(e.target.value)}
          className="h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
        >
          <option value="Todas">Resistência: Todas</option>
          {(['Preço', 'Concorrência', 'Dúvida Técnica', 'Prazo'] as ResistanceType[]).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'avancou' | 'estagnou')}
          className="h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
        >
          <option value="todos">Desfecho: Todos</option>
          <option value="avancou">Avançou no funil</option>
          <option value="estagnou">Estagnou</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Cliente & Contexto</th>
              <th className="py-3 px-4">Equipamento</th>
              <th className="py-3 px-4">Vendedor</th>
              <th className="py-3 px-4">Resistência</th>
              <th className="py-3 px-4">Concorrente</th>
              <th className="py-3 px-4">Desfecho</th>
              <th className="py-3 px-4 text-right">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{row.cliente}</div>
                  {row.contexto && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{row.contexto}</div>}
                </td>
                <td className="py-3 px-4 font-medium text-[#1B2E5E] dark:text-amber-400">{row.equipamento}</td>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{row.vendedor_nome}</td>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{row.resistencia}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{row.concorrente_citado}</td>
                <td className="py-3 px-4">
                  <span className={`font-semibold ${row.avancou ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {row.avancou ? 'Avançou' : `Estagnou (${row.motivo || 'Sem motivo'})`}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">{row.data}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Nenhuma interação encontrada para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. COCKPIT DO GESTOR                                                       */
/* -------------------------------------------------------------------------- */
interface CockpitModuleProps {
  opportunities: OpportunityRecord[];
  activities: ActivityRecord[];
  goals: GoalRecord[];
}

export const CockpitModule: React.FC<CockpitModuleProps> = ({ opportunities, activities, goals }) => {
  const [selectedSeller, setSelectedSeller] = useState<string>('Todos');

  const sellers = useMemo(
    () => Array.from(new Set(opportunities.map((o) => o.vendedor_nome))),
    [opportunities]
  );

  const filteredOpps = useMemo(
    () =>
      selectedSeller === 'Todos'
        ? opportunities
        : opportunities.filter((o) => o.vendedor_nome === selectedSeller),
    [opportunities, selectedSeller]
  );

  const filteredActs = useMemo(
    () =>
      selectedSeller === 'Todos'
        ? activities
        : activities.filter((a) => a.vendedor_nome === selectedSeller),
    [activities, selectedSeller]
  );

  const ganhas = filteredOpps.filter((o) => o.status === 'ganha');
  const perdidas = filteredOpps.filter((o) => o.status === 'perdida');
  const faturamento = ganhas.reduce((acc, o) => acc + o.valor, 0);
  const propostasEnviadas = filteredOpps.length;
  const taxaConversao = propostasEnviadas > 0 ? (ganhas.length / propostasEnviadas) * 100 : 0;
  const ticketMedio = ganhas.length > 0 ? faturamento / ganhas.length : 0;
  const realizadas = filteredActs.filter((a) => a.status === 'realizada').length;
  const followupsPendentes = filteredActs.filter((a) => a.status === 'pendente').length;

  const metaFaturamento =
    selectedSeller === 'Todos'
      ? goals.find((g) => g.escopo === 'coletiva' && g.tipo === 'faturamento')?.valor_meta || 2000000
      : goals.find((g) => g.vendedor_nome === selectedSeller && g.tipo === 'faturamento')?.valor_meta || 500000;

  const atingimento = Math.min(100, Math.round((faturamento / metaFaturamento) * 100));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Visão Executiva de Funil, Oportunidades e Atividades</p>
          <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">Cockpit do Gestor</h1>
        </div>

        <select
          value={selectedSeller}
          onChange={(e) => setSelectedSeller(e.target.value)}
          className="h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg self-start"
        >
          <option value="Todos">Todos os vendedores</option>
          {sellers.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* 8 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Propostas no Período</p>
          <p className="font-mono text-2xl font-bold text-[#1B2E5E] dark:text-sky-300 mt-1 tabular-nums">{propostasEnviadas}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Vendas Ganhas</p>
          <p className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">{ganhas.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Taxa de Conversão</p>
          <p className="font-mono text-2xl font-bold text-[#1B2E5E] dark:text-sky-300 mt-1 tabular-nums">{taxaConversao.toFixed(1)}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Ticket Médio</p>
          <p className="font-mono text-2xl font-bold text-[#1B2E5E] dark:text-sky-300 mt-1 tabular-nums">{formatBRL(ticketMedio)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Atividades Realizadas</p>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">{realizadas}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Follow-ups Pendentes</p>
          <p className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">{followupsPendentes}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Oportunidades Perdidas</p>
          <p className="font-mono text-2xl font-bold text-red-700 dark:text-red-400 mt-1 tabular-nums">{perdidas.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Faturamento Realizado</p>
          <p className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">{formatBRL(faturamento)}</p>
        </div>
      </div>

      {/* META PROGRESS + OPPORTUNITIES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">Faturamento vs. Meta</h2>
          <span className="font-mono text-xs font-semibold text-[#1B2E5E] dark:text-amber-400 tabular-nums">
            {formatBRL(faturamento)} / {formatBRL(metaFaturamento)} ({atingimento}%)
          </span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-[#1B2E5E] dark:bg-[#F59E0B] rounded-full" style={{ width: `${atingimento}%` }} />
        </div>
      </div>

      {/* RESUMO EXECUTIVO COM RECHARTS */}
      <ResumoExecutivo
        selectedSeller={selectedSeller}
        opportunities={filteredOpps}
        activities={filteredActs}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Principais Oportunidades do Mês</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredOpps.map((o) => (
              <div key={o.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{o.cliente}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {o.produto} · {o.vendedor_nome}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-sm font-bold text-[#1B2E5E] dark:text-sky-300 tabular-nums">{formatBRL(o.valor)}</div>
                  <div
                    className={`text-xs font-medium ${
                      o.status === 'ganha'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : o.status === 'perdida'
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {o.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Agenda de Atividades</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredActs.map((a) => (
              <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{a.tipo} · {a.cliente}</span>
                  <span className={a.status === 'realizada' ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-amber-700 dark:text-amber-400 font-medium'}>
                    {a.status === 'realizada' ? 'Realizada' : 'Pendente'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {a.equipamento} · {a.vendedor_nome} · {a.data}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. CLASSIFICAÇÃO DE VENDEDORES                                             */
/* -------------------------------------------------------------------------- */
interface ClassificacaoModuleProps {
  opportunities: OpportunityRecord[];
  activities: ActivityRecord[];
}

export const ClassificacaoModule: React.FC<ClassificacaoModuleProps> = ({ opportunities, activities }) => {
  const [expandedSeller, setExpandedSeller] = useState<string | null>(SELLER_RANKING[0].nome);
  const [search, setSearch] = useState('');

  const filtered = SELLER_RANKING.filter(
    (s) =>
      !search.trim() ||
      s.nome.toLowerCase().includes(search.toLowerCase()) ||
      s.objecao_superada.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Ranking de Fechamento, Atingimento e Aprendizado com os Melhores</p>
          <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">Classificação de Vendedores</h1>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar vendedor..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg"
          />
        </div>
      </div>

      {/* SCORE COMPARISON BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#F59E0B]" />
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
            Score de Performance Comercial (0–100)
          </h2>
        </div>
        <div className="space-y-3">
          {filtered.map((s, idx) => {
            const score = Math.min(100, Math.round((s.faturamento / s.meta) * 75 + s.taxa_conversao * 0.25));
            return (
              <div key={s.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {idx + 1}. {s.nome} · <span className="text-slate-500 dark:text-slate-400 font-normal">{s.classificacao}</span>
                  </span>
                  <span className="font-mono font-bold text-[#1B2E5E] dark:text-amber-400 tabular-nums">{score} pts</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${score}%`,
                      backgroundColor: idx === 0 ? '#F59E0B' : '#3B82F6',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EXPANDABLE SELLER TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Posição</th>
              <th className="py-3 px-4">Vendedor</th>
              <th className="py-3 px-4">Classificação</th>
              <th className="py-3 px-4 text-right">Faturamento</th>
              <th className="py-3 px-4 text-right">Meta</th>
              <th className="py-3 px-4 text-right">Atingimento</th>
              <th className="py-3 px-4 text-right">Conversão</th>
              <th className="py-3 px-4">Objeção Melhor Superada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {filtered.map((s, idx) => {
              const ating = Math.round((s.faturamento / s.meta) * 100);
              const isOpen = expandedSeller === s.nome;
              const sellerOpps = opportunities.filter((o) => o.vendedor_nome === s.nome);
              const sellerActs = activities.filter((a) => a.vendedor_nome === s.nome);
              return (
                <React.Fragment key={s.id}>
                  <tr
                    onClick={() => setExpandedSeller(isOpen ? null : s.nome)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#1B2E5E] dark:text-amber-400 tabular-nums">
                      <div className="inline-flex items-center gap-1.5">
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {idx + 1}º
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{s.nome}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{s.cargo}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-[#1B2E5E] dark:text-sky-300">{s.classificacao}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">{formatBRL(s.faturamento)}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">{formatBRL(s.meta)}</td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold tabular-nums ${
                        ating >= 100
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : ating >= 80
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {ating}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">{s.taxa_conversao.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">{s.objecao_superada}</td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <td colSpan={8} className="p-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                              Oportunidades ({sellerOpps.length})
                            </p>
                            {sellerOpps.length === 0 ? (
                              <p className="text-slate-500 dark:text-slate-400">Nenhuma oportunidade vinculada neste período.</p>
                            ) : (
                              <ul className="space-y-1.5">
                                {sellerOpps.map((o) => (
                                  <li key={o.id} className="flex justify-between text-slate-700 dark:text-slate-300">
                                    <span>
                                      {o.cliente} · {o.produto}
                                    </span>
                                    <span className="font-mono font-semibold">{formatBRL(o.valor)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                              Atividades ({sellerActs.length})
                            </p>
                            {sellerActs.length === 0 ? (
                              <p className="text-slate-500 dark:text-slate-400">Nenhuma atividade recente.</p>
                            ) : (
                              <ul className="space-y-1.5">
                                {sellerActs.map((a) => (
                                  <li key={a.id} className="flex justify-between text-slate-700 dark:text-slate-300">
                                    <span>
                                      {a.tipo}: {a.cliente}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400">{a.status}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. GESTÃO DE METAS                                                         */
/* -------------------------------------------------------------------------- */
interface MetasModuleProps {
  goals: GoalRecord[];
  opportunities?: OpportunityRecord[];
  onAddGoal: (goal: GoalRecord) => void;
  onUpdateGoal?: (id: string, nextValue: number) => void;
  onDeleteGoal: (id: string) => void;
}

export const MetasModule: React.FC<MetasModuleProps> = ({
  goals,
  opportunities,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [escopo, setEscopo] = useState<'coletiva' | 'individual'>('coletiva');
  const [tipo, setTipo] = useState<GoalRecord['tipo']>('faturamento');
  const [vendedorNome, setVendedorNome] = useState('Rafael Mendonça');
  const [mes, setMes] = useState(11);
  const [ano, setAno] = useState(2026);
  const [valorMeta, setValorMeta] = useState('');

  const getProgress = (g: GoalRecord) => getGoalProgressValue(g, opportunities);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(valorMeta);
    if (!num || num <= 0) return;
    onAddGoal({
      id: `goal-${Date.now()}`,
      escopo,
      tipo,
      vendedor_nome: escopo === 'individual' ? vendedorNome : undefined,
      periodo_mes: mes,
      periodo_ano: ano,
      valor_meta: num,
    });
    setValorMeta('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Metas Coletivas e Individuais por Indicador e Período</p>
          <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">Gestão de Metas</h1>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 rounded-lg self-start"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? 'Fechar Formulário' : 'Nova Meta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Escopo</label>
            <select
              value={escopo}
              onChange={(e) => setEscopo(e.target.value as 'coletiva' | 'individual')}
              className="w-full h-10 px-3 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="coletiva">Coletiva (toda a equipe)</option>
              <option value="individual">Individual</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Tipo de Meta</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as GoalRecord['tipo'])}
              className="w-full h-10 px-3 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="faturamento">Faturamento (R$)</option>
              <option value="vendas">Vendas</option>
              <option value="propostas">Propostas</option>
              <option value="atividades">Atividades</option>
              <option value="followups">Follow-ups</option>
            </select>
          </div>

          {escopo === 'individual' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Vendedor</label>
              <select
                value={vendedorNome}
                onChange={(e) => setVendedorNome(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {SELLER_RANKING.map((s) => (
                  <option key={s.id} value={s.nome}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Mês / Ano</label>
            <div className="flex gap-2">
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="flex-1 h-10 px-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="w-20 h-10 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Valor da Meta</label>
              <input
                type="number"
                required
                value={valorMeta}
                onChange={(e) => setValorMeta(e.target.value)}
                placeholder={tipo === 'faturamento' ? '500000' : '15'}
                className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-4 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#2B4C9B] rounded-lg self-end"
            >
              Salvar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const realizado = getProgress(g);
          const pct = g.valor_meta > 0 ? Math.round((realizado / g.valor_meta) * 100) : 0;
          const falta = Math.max(0, g.valor_meta - realizado);
          const isMoney = g.tipo === 'faturamento';
          return (
            <div key={g.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {g.tipo.toUpperCase()} · {MONTHS[g.periodo_mes - 1]} {g.periodo_ano}
                  </p>
                  <h3 className="font-display text-base font-bold text-[#1B2E5E] dark:text-white mt-0.5">
                    {g.escopo === 'coletiva' ? 'Equipe (Coletiva)' : g.vendedor_nome}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  {onUpdateGoal && (
                    <button
                      type="button"
                      aria-label="Ajustar valor da meta"
                      title="Ajustar meta"
                      onClick={() => {
                        if (editingGoalId === g.id) {
                          setEditingGoalId(null);
                        } else {
                          setEditingGoalId(g.id);
                          setEditingValue(String(g.valor_meta));
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-[#1B2E5E] dark:hover:text-amber-400 rounded-lg"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Excluir meta"
                    onClick={() => onDeleteGoal(g.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingGoalId === g.id && onUpdateGoal && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = Number(editingValue);
                    if (parsed > 0) {
                      onUpdateGoal(g.id, parsed);
                    }
                    setEditingGoalId(null);
                  }}
                  className="flex items-center gap-2 pt-1"
                >
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="flex-1 h-8 px-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md"
                  />
                  <button
                    type="submit"
                    className="h-8 px-3 text-xs font-semibold text-white bg-[#1B2E5E] dark:bg-[#F59E0B] dark:text-slate-950 rounded-md"
                  >
                    Aplicar
                  </button>
                </form>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs tabular-nums pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Meta</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {isMoney ? formatBRL(g.valor_meta) : g.valor_meta}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Realizado</span>
                  <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    {isMoney ? formatBRL(realizado) : realizado}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Restante</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {isMoney ? formatBRL(falta) : falta}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 tabular-nums">
                  <span className="text-slate-500 dark:text-slate-400">Atingimento</span>
                  <span className="font-mono font-bold text-[#1B2E5E] dark:text-amber-400">{pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: pct >= 100 ? '#16A34A' : pct >= 80 ? '#F59E0B' : '#3B82F6',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 6. PAINEL DO GESTOR (RELATÓRIO EXECUTIVO E AUDITORIA)                      */
/* -------------------------------------------------------------------------- */
interface PainelGestorModuleProps {
  interactions: InteractionRecord[];
  opportunities: OpportunityRecord[];
}

export const PainelGestorModule: React.FC<PainelGestorModuleProps> = ({ interactions, opportunities }) => {
  const [copiedExec, setCopiedExec] = useState(false);

  const ganhas = opportunities.filter((o) => o.status === 'ganha');
  const emAberto = opportunities.filter((o) => o.status === 'em_negociacao' || o.status === 'proposta_enviada');
  const perdidas = opportunities.filter((o) => o.status === 'perdida');

  const handleCopyExecutiveReport = () => {
    const report = [
      'AUTEC SMART SALES ENGINE — RELATÓRIO EXECUTIVO DO GESTOR',
      `Oportunidades Ganhas: ${ganhas.length} (${formatBRL(ganhas.reduce((s, o) => s + o.valor, 0))})`,
      `Pipeline Aberto: ${emAberto.length} (${formatBRL(emAberto.reduce((s, o) => s + o.valor, 0))})`,
      `Interações Registradas: ${interactions.length} (${interactions.filter((i) => i.avancou).length} avanços)`,
      '',
      'PRINCIPAIS OPORTUNIDADES:',
      ...opportunities.map((o) => `- ${o.cliente} | ${o.produto} | ${formatBRL(o.valor)} | ${o.status}`),
    ].join('\n');
    navigator.clipboard.writeText(report);
    setCopiedExec(true);
    setTimeout(() => setCopiedExec(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Auditoria Executiva, Pipeline Aberto e Relatório Semanal</p>
          <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">Painel do Gestor</h1>
        </div>
        <button
          type="button"
          onClick={handleCopyExecutiveReport}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 rounded-lg self-start"
        >
          {copiedExec ? <Check className="w-3.5 h-3.5 text-amber-300 dark:text-slate-950" /> : <FileText className="w-3.5 h-3.5" />}
          {copiedExec ? 'Relatório Executivo Copiado' : 'Gerar Relatório Executivo'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Receita Fechada (Ganhas)</p>
          <p className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
            {formatBRL(ganhas.reduce((s, o) => s + o.valor, 0))}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ganhas.length} contratos fechados</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Pipeline em Negociação / Proposta</p>
          <p className="font-mono text-2xl font-bold text-[#1B2E5E] dark:text-sky-300 mt-1 tabular-nums">
            {formatBRL(emAberto.reduce((s, o) => s + o.valor, 0))}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{emAberto.length} propostas ativas</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Oportunidades Perdidas</p>
          <p className="font-mono text-2xl font-bold text-red-700 dark:text-red-400 mt-1 tabular-nums">
            {formatBRL(perdidas.reduce((s, o) => s + o.valor, 0))}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {perdidas[0]?.motivo_perda || 'Monitoramento contínuo'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
          Visão Consolidada de Propostas e Riscos Competitivos
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {opportunities.map((opp) => {
            const hasDeadline =
              (opp.status === 'proposta_enviada' || opp.status === 'em_negociacao') &&
              opp.validade_proposta;
            const daysLeft = hasDeadline ? getDaysUntil(opp.validade_proposta!) : null;
            return (
              <div key={opp.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{opp.cliente}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {opp.produto} · Responsável: {opp.vendedor_nome} · Previsão: {opp.previsao_fechamento}
                    {hasDeadline && daysLeft !== null && (
                      <>
                        {' · '}
                        <span
                          className={`font-semibold tabular-nums ${
                            daysLeft <= 2
                              ? 'text-red-700 dark:text-red-400'
                              : daysLeft <= 7
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {daysLeft <= 0
                            ? 'Validade expirada/hoje'
                            : `Validade em ${daysLeft} dia(s) (${new Date(`${opp.validade_proposta!}T12:00:00`).toLocaleDateString('pt-BR')})`}
                        </span>
                      </>
                    )}
                  </div>
                  {opp.motivo_perda && (
                    <div className="text-xs text-red-700 dark:text-red-400 mt-0.5">Motivo da perda: {opp.motivo_perda}</div>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono text-sm font-bold text-[#1B2E5E] dark:text-sky-300 tabular-nums">
                    {formatBRL(opp.valor)}
                  </span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{opp.status.replace('_', ' ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 7. NOVOS CADASTROS (LEADS & ACESSOS)                                       */
/* -------------------------------------------------------------------------- */
interface NovosCadastrosModuleProps {
  collaborators: CollaboratorRecord[];
  leads: LeadRecord[];
  onAddLead: (lead: LeadRecord) => void;
}

export const NovosCadastrosModule: React.FC<NovosCadastrosModuleProps> = ({
  collaborators,
  leads,
  onAddLead,
}) => {
  const [viewMode, setViewMode] = useState<'leads' | 'equipe'>('leads');
  const [period, setPeriod] = useState<'7' | '30' | '90' | 'all'>('30');
  const [search, setSearch] = useState('');
  const [showAddLead, setShowAddLead] = useState(false);

  const [empresa, setEmpresa] = useState('');
  const [contato, setContato] = useState('');
  const [cargo, setCargo] = useState('');
  const [cidade, setCidade] = useState('');
  const [equipamento, setEquipamento] = useState(EQUIPMENT_CATALOG[0].nome_equipamento);
  const [origem, setOrigem] = useState<LeadRecord['origem']>('Site Autec');
  const [responsavel, setResponsavel] = useState(SELLER_RANKING[0].nome);

  const filteredLeads = useMemo(() => {
    const now = new Date('2026-11-16T12:00:00').getTime();
    const q = search.toLowerCase().trim();
    return leads.filter((l) => {
      const days = Math.floor((now - new Date(`${l.created_date}T12:00:00`).getTime()) / (1000 * 60 * 60 * 24));
      if (period !== 'all' && days > Number(period)) return false;
      if (!q) return true;
      return [l.empresa, l.contato, l.equipamento_interesse, l.cidade, l.responsavel]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [leads, period, search]);

  const filteredCollaborators = useMemo(() => {
    const now = new Date('2026-11-16T12:00:00').getTime();
    const q = search.toLowerCase().trim();
    return collaborators.filter((c) => {
      const days = Math.floor((now - new Date(`${c.created_date}T12:00:00`).getTime()) / (1000 * 60 * 60 * 24));
      if (period !== 'all' && days > Number(period)) return false;
      if (!q) return true;
      return [c.full_name, c.email, c.cargo, c.cidade].join(' ').toLowerCase().includes(q);
    });
  }, [collaborators, period, search]);

  const roleLabels: Record<CollaboratorRecord['role'], string> = {
    admin: 'Administrador',
    gestor: 'Gestor',
    vendedor: 'Vendedor',
  };

  const leadStatusLabel: Record<LeadRecord['status'], string> = {
    novo: 'Novo Lead',
    qualificado: 'Qualificado',
    proposta: 'Em Proposta',
  };

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa.trim() || !contato.trim()) return;
    onAddLead({
      id: `lead-${Date.now()}`,
      empresa: empresa.trim(),
      contato: contato.trim(),
      cargo: cargo.trim() || 'Gerente de Laboratório',
      cidade: cidade.trim() || 'São Paulo - SP',
      equipamento_interesse: equipamento,
      origem,
      responsavel,
      status: 'novo',
      created_date: '2026-11-16',
    });
    setEmpresa('');
    setContato('');
    setCargo('');
    setCidade('');
    setShowAddLead(false);
    setViewMode('leads');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoramento de Leads Comerciais e Novos Acessos na Plataforma
          </p>
          <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">
            Novos Cadastros
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
            {(
              [
                { key: 'leads', label: `Leads (${leads.length})` },
                { key: 'equipe', label: `Equipe (${collaborators.length})` },
              ] as const
            ).map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setViewMode(v.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  viewMode === v.key
                    ? 'bg-white dark:bg-slate-900 text-[#1B2E5E] dark:text-amber-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAddLead((s) => !s)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 rounded-lg whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddLead ? 'Cancelar' : 'Novo Lead'}
          </button>
        </div>
      </div>

      {showAddLead && (
        <form
          onSubmit={handleSubmitLead}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Empresa / Laboratório
            </label>
            <input
              type="text"
              required
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Ex: Roche Diagnóstica SP"
              className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Nome do Contato
            </label>
            <input
              type="text"
              required
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              placeholder="Ex: Dra. Mariana Silva"
              className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Cargo
            </label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Supervisora de CQ"
              className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Cidade / UF
            </label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: Campinas - SP"
              className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Equipamento de Interesse
            </label>
            <select
              value={equipamento}
              onChange={(e) => setEquipamento(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
            >
              {EQUIPMENT_CATALOG.map((eq) => (
                <option key={eq.id} value={eq.nome_equipamento}>
                  {eq.nome_equipamento} ({eq.fabricante})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Origem do Lead
            </label>
            <select
              value={origem}
              onChange={(e) => setOrigem(e.target.value as LeadRecord['origem'])}
              className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
            >
              <option value="Site Autec">Site Autec</option>
              <option value="Inbound Técnico">Inbound Técnico</option>
              <option value="Feira Analitica">Feira Analitica</option>
              <option value="Indicação">Indicação</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Consultor Responsável
            </label>
            <select
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
            >
              {SELLER_RANKING.map((s) => (
                <option key={s.id} value={s.nome}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-10 px-4 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#2B4C9B] rounded-lg"
          >
            Cadastrar Lead e Alertar Gestor
          </button>
        </form>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              viewMode === 'leads'
                ? 'Buscar lead por empresa, contato, equipamento ou cidade...'
                : 'Buscar colaborador por nome, e-mail, cargo ou cidade...'
            }
            className="w-full h-10 pl-9 pr-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg self-start">
          {(
            [
              { key: '7', label: '7 dias' },
              { key: '30', label: '30 dias' },
              { key: '90', label: '90 dias' },
              { key: 'all', label: 'Todos' },
            ] as const
          ).map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p.key
                  ? 'bg-white dark:bg-slate-900 text-[#1B2E5E] dark:text-amber-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'leads' ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {filteredLeads.length} lead(s) cadastrado(s) no período
          </p>
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {lead.empresa}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      lead.status === 'novo'
                        ? 'text-[#1B2E5E] dark:text-sky-300'
                        : lead.status === 'qualificado'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    · {leadStatusLabel[lead.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {lead.contato} ({lead.cargo}) · Interesse: <strong className="text-slate-800 dark:text-slate-200">{lead.equipamento_interesse}</strong> · Origem: {lead.origem}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lead.cidade} · Consultor: {lead.responsavel}
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                Cadastro: {new Date(`${lead.created_date}T12:00:00`).toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {filteredCollaborators.length} acesso(s) recente(s)
          </p>
          {filteredCollaborators.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {c.full_name}
                  </span>
                  <span className="text-xs font-medium text-[#1B2E5E] dark:text-amber-400">
                    · {roleLabels[c.role]}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {c.email} · {c.cargo} · {c.cidade} · {c.telefone}
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                Cadastro: {new Date(`${c.created_date}T12:00:00`).toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 8. COLABORADORES                                                           */
/* -------------------------------------------------------------------------- */
interface ColaboradoresModuleProps {
  collaborators: CollaboratorRecord[];
  onAddCollaborator: (c: CollaboratorRecord) => void;
  onUpdateRole: (id: string, role: CollaboratorRecord['role']) => void;
  onToggleActive: (id: string) => void;
}

export const ColaboradoresModule: React.FC<ColaboradoresModuleProps> = ({
  collaborators,
  onAddCollaborator,
  onUpdateRole,
  onToggleActive,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [role, setRole] = useState<CollaboratorRecord['role']>('vendedor');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return collaborators.filter(
      (c) =>
        !q ||
        [c.full_name, c.email, c.cargo, c.cidade].join(' ').toLowerCase().includes(q)
    );
  }, [collaborators, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    onAddCollaborator({
      id: `col-${Date.now()}`,
      full_name: fullName.trim(),
      email: email.trim(),
      cargo: cargo.trim() || 'Consultor Técnico',
      cidade: cidade.trim() || 'São Paulo - SP',
      telefone: telefone.trim() || '(11) 4311-6562',
      role,
      ativo: true,
      created_date: '2026-11-16',
    });
    setFullName('');
    setEmail('');
    setCargo('');
    setCidade('');
    setTelefone('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Administração de Equipe, Papéis e Permissões</p>
          <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">Colaboradores</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 rounded-lg self-start"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {showAdd ? 'Cancelar' : 'Novo Colaborador'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nome completo"
            className="h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail corporativo (@autec.com.br)"
            className="h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
          />
          <input
            type="text"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Cargo (ex: Consultor Técnico)"
            className="h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
          />
          <input
            type="text"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade / UF"
            className="h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
          />
          <input
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone"
            className="h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
          />
          <div className="flex gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CollaboratorRecord['role'])}
              className="flex-1 h-10 px-3 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="vendedor">Vendedor</option>
              <option value="gestor">Gestor</option>
              <option value="admin">Administrador</option>
            </select>
            <button type="submit" className="px-4 h-10 text-xs font-semibold text-white bg-[#1B2E5E] dark:bg-[#2B4C9B] rounded-lg">
              Cadastrar
            </button>
          </div>
        </form>
      )}

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar colaborador por nome, cargo ou cidade..."
          className="w-full h-10 pl-9 pr-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Colaborador</th>
              <th className="py-3 px-4">Cargo</th>
              <th className="py-3 px-4">Cidade / Telefone</th>
              <th className="py-3 px-4">Perfil de Acesso</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{c.full_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{c.email}</div>
                </td>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">{c.cargo}</td>
                <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                  <div>{c.cidade}</div>
                  <div className="font-mono text-slate-500 dark:text-slate-400">{c.telefone}</div>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={c.role}
                    onChange={(e) => onUpdateRole(c.id, e.target.value as CollaboratorRecord['role'])}
                    className="h-8 px-2 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="gestor">Gestor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => onToggleActive(c.id)}
                    className={`text-xs font-semibold ${c.ativo ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
