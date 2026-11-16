import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  FlaskConical,
  MessageSquare,
  SlidersHorizontal,
  BarChart3,
  BookOpen,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  EQUIPMENT_CATALOG,
  HERO_IMAGE,
  OFFICIAL_BRANDS,
  OFFICIAL_CATALOG_COUNT,
  PLATFORM_FEATURES,
  SALES_CYCLE_STEPS,
  TARGET_AUDIENCE,
  TECH_DIFFERENTIATORS,
  OBJECTION_LIBRARY,
  type ResistanceType,
} from '../data/autecData';

import { type WorkspaceTab } from './WorkspaceView';

interface LandingCopyViewProps {
  onOpenWorkspace: (initialTab?: WorkspaceTab, equipmentId?: string) => void;
}

const FEATURE_ICONS = {
  'feat-argumento': Sparkles,
  'feat-chat': MessageSquare,
  'feat-comparativo': SlidersHorizontal,
  'feat-radar': BarChart3,
  'feat-kb': BookOpen,
  'feat-quiz': FlaskConical,
} as const;

export const LandingCopyView: React.FC<LandingCopyViewProps> = ({ onOpenWorkspace }) => {
  const [previewResistance, setPreviewResistance] = useState<ResistanceType>('Preço');
  const [copiedFullCopy, setCopiedFullCopy] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [showAllCatalog, setShowAllCatalog] = useState<boolean>(false);

  const activeSampleObjection =
    OBJECTION_LIBRARY.find((o) => o.tipo_resistencia === previewResistance) || OBJECTION_LIBRARY[0];

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return EQUIPMENT_CATALOG.filter((item) => {
      const brandOk = selectedBrand === 'Todas' || item.fabricante === selectedBrand;
      if (!brandOk) return false;
      if (!q) return true;
      return [
        item.nome_equipamento,
        item.fabricante,
        item.categoria,
        item.descricao_oficial,
        item.normas_atendidas,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [selectedBrand, catalogSearch]);

  const visibleCatalog = showAllCatalog ? filteredCatalog : filteredCatalog.slice(0, 9);

  const handleCopyCompleteDocument = () => {
    const fullText = [
      'AUTEC SMART SALES ENGINE — DOCUMENTO COMPLETO DE POSICIONAMENTO, COPY E CATÁLOGO OFICIAL',
      '',
      '1. PROPÓSITO DA PLATAFORMA',
      'A central de inteligência comercial da Autec para equipamentos laboratoriais. Gera argumentos técnicos em tempo real, contorna objeções e otimiza o fechamento de propostas complexas, conectando vendedor, gestor e conhecimento técnico em um só lugar.',
      '',
      '2. FUNCIONALIDADES PRINCIPAIS',
      ...PLATFORM_FEATURES.map(
        (f) => `${f.numero}. ${f.titulo} — ${f.objetivo} Mecanismo: ${f.mecanismo} Resultado: ${f.resultado}`
      ),
      '',
      '3. PÚBLICO-ALVO',
      ...TARGET_AUDIENCE.map(
        (p) => `- ${p.titulo} (${p.segmento}): ${p.contexto_dor} Como utiliza: ${p.como_usa} Impacto: ${p.impacto_direto}`
      ),
      '',
      '4. DIFERENCIAL TECNOLÓGICO',
      ...TECH_DIFFERENTIATORS.map(
        (d) => `${d.numero}. ${d.titulo} [${d.arquitetura}] — ${d.explicacao} (${d.metrica})`
      ),
      '',
      `5. CATÁLOGO OFICIAL INTEGRADO (${OFFICIAL_CATALOG_COUNT} EQUIPAMENTOS — autec.com.br/produtos/)`,
      ...EQUIPMENT_CATALOG.map(
        (e) => `- ${e.nome_equipamento} (${e.fabricante} | ${e.categoria}): ${e.aplicacao_laboratorial}`
      ),
    ].join('\n');

    navigator.clipboard.writeText(fullText);
    setCopiedFullCopy(true);
    setTimeout(() => setCopiedFullCopy(false), 2500);
  };

  return (
    <main className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* HERO SECTION */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-16 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                  Autec Smart Sales Engine · Inteligência Comercial Laboratorial
                </p>

                <h1
                  className="font-display font-bold text-[#1B2E5E] dark:text-white tracking-tight leading-[1.08] mb-5"
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
                >
                  Argumentos técnicos precisos do preparo ao fechamento.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8">
                  A central de inteligência comercial da Autec integrada a todos os {OFFICIAL_CATALOG_COUNT} equipamentos
                  e consumíveis oficiais de <span className="font-medium text-slate-800 dark:text-slate-100">autec.com.br/produtos</span>.
                  Conecta vendedores de campo, gestores e engenharia de aplicação com geração de argumentos em IA,
                  comparativos técnicos e radar semanal de concorrência.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onOpenWorkspace('gerador')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                >
                  Testar Plataforma Interativa
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#equipamentos"
                  className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#1B2E5E] dark:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Ver Catálogo ({OFFICIAL_CATALOG_COUNT} itens)
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#1B2E5E]">
                {!imgErrors['hero'] ? (
                  <img
                    src={HERO_IMAGE}
                    alt="Laboratório analítico equipado com sistemas de cromatografia e preparo de amostras Autec"
                    referrerPolicy="no-referrer"
                    onError={() => setImgErrors((prev) => ({ ...prev, hero: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-white bg-gradient-to-br from-[#1B2E5E] to-[#0F172A]">
                    <FlaskConical className="w-12 h-12 text-[#F59E0B] mb-3" />
                    <p className="font-display font-semibold text-lg text-center">
                      Autec Smart Sales Engine · Ambiente Laboratorial
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-[#0F172A]/25 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                  <p className="text-xs font-mono text-amber-300 mb-1">
                    CAMAG · Biotage · CEM · Syrris · VICI DBS · LUM · Biocomma · Advion Interchim
                  </p>
                  <p className="text-sm sm:text-base font-medium leading-snug max-w-lg">
                    Da bancada à análise final: toda a força de vendas acessa o mesmo arsenal científico para vencer
                    objeções de preço, prazo e concorrência.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-COLUMN FULL-WIDTH KPI STRIP */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-10">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6">
              <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#1B2E5E] dark:text-amber-400 tabular-nums">
                {OFFICIAL_CATALOG_COUNT} Itens
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Equipamentos e consumíveis oficiais de autec.com.br/produtos integrados à engine
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6">
              <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#1B2E5E] dark:text-amber-400 tabular-nums">8 Marcas</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Representadas globais: CAMAG, Biotage, CEM, Syrris, VICI DBS, LUM, Biocomma e Advion
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6">
              <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#1B2E5E] dark:text-amber-400 tabular-nums">2,4s</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Tempo médio para gerar Argumento de Ouro, suporte e pergunta de poder
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6">
              <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#1B2E5E] dark:text-amber-400 tabular-nums">13 Módulos</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Painel, Cockpit, Ranking, Metas, Gestor, Histórico, Base, Quiz e Chat Técnico
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 01: FUNCIONALIDADES PRINCIPAIS */}
      <section id="funcionalidades" className="py-16 lg:py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              01. Funcionalidades Principais · Da Reunião ao Pós-Venda
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B2E5E] dark:text-white tracking-tight mb-4"
              style={{ textWrap: 'balance' }}
            >
              Seis módulos integrados para eliminar improvisos em negociações científicas
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Cada recurso conecta um objetivo prático do time comercial a um mecanismo claro de interface e a um
              ganho mensurável no funil de vendas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_FEATURES.map((feat) => {
              const Icon = FEATURE_ICONS[feat.id as keyof typeof FEATURE_ICONS] || Sparkles;
              return (
                <article
                  key={feat.id}
                  className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between transition-colors hover:border-slate-300 dark:hover:border-slate-700 ${
                    feat.destaque ? 'lg:col-span-2' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <span className="font-mono text-xs font-semibold text-[#1B2E5E] dark:text-amber-400">
                        {feat.numero}. {feat.subtitulo}
                      </span>
                      <Icon className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    </div>

                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{feat.titulo}</h3>

                    <dl className="space-y-3 text-sm leading-relaxed">
                      <div>
                        <dt className="font-semibold text-slate-900 dark:text-slate-100 inline">Objetivo: </dt>
                        <dd className="text-slate-600 dark:text-slate-300 inline">{feat.objetivo}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-900 dark:text-slate-100 inline">Mecanismo: </dt>
                        <dd className="text-slate-600 dark:text-slate-300 inline">{feat.mecanismo}</dd>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <dt className="font-semibold text-[#1B2E5E] dark:text-amber-400 inline">Resultado: </dt>
                        <dd className="text-slate-700 dark:text-slate-200 inline">{feat.resultado}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onOpenWorkspace(feat.workspaceTab)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B2E5E] dark:text-amber-400 hover:text-[#F59E0B] dark:hover:text-amber-300 transition-colors whitespace-nowrap"
                    >
                      Abrir módulo na plataforma
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 02: PÚBLICO-ALVO */}
      <section id="publico-alvo" className="py-16 lg:py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                02. Público-Alvo · Ecossistema Comercial B2B
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B2E5E] dark:text-white tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Desenhada para quem vende ciência e para quem lidera metas complexas
              </h2>
            </div>
            <div className="lg:col-span-7 flex items-end">
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                A plataforma atende diretamente três papéis internos da operação comercial da Autec — vendedores
                consultivos, gestores e engenharia de aplicação — gerando valor indireto imediato aos laboratórios
                compradores que precisam de decisões técnicas seguras e aderentes às normas brasileiras e
                internacionais.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {TARGET_AUDIENCE.map((persona, index) => (
              <div key={persona.id} className="bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    0{index + 1} · {persona.segmento}
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{persona.titulo}</h3>

                  <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Dor operacional: </span>
                      {persona.contexto_dor}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Uso na plataforma: </span>
                      {persona.como_usa}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm">
                  <span className="font-semibold text-[#1B2E5E] dark:text-amber-400">Impacto direto: </span>
                  <span className="text-slate-700 dark:text-slate-200">{persona.impacto_direto}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 03: DIFERENCIAL TECNOLÓGICO + SIMULADOR AO VIVO */}
      <section id="diferencial" className="py-16 lg:py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              03. Diferencial Tecnológico · Arquitetura e Vantagem Competitiva
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B2E5E] dark:text-white tracking-tight mb-4"
              style={{ textWrap: 'balance' }}
            >
              Por que o Autec Smart Sales Engine supera CRMs tradicionais e IAs genéricas
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              CRMs convencionais apenas armazenam histórico estático e chatbots abertos inventam especificações
              técnicas. A Autec combina o catálogo oficial de {OFFICIAL_CATALOG_COUNT} equipamentos, geração tripartida em
              segundos e telemetria de objeções em ciclo fechado.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-4">
              {TECH_DIFFERENTIATORS.map((diff) => (
                <div
                  key={diff.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {diff.numero} · {diff.arquitetura}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#1B2E5E] dark:text-amber-400 tabular-nums">
                      {diff.metrica}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{diff.titulo}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{diff.explicacao}</p>
                </div>
              ))}
            </div>

            {/* INTERACTIVE PLAYBOOK OUTPUT PREVIEW */}
            <div className="lg:col-span-5 bg-[#1B2E5E] dark:bg-slate-900 text-white rounded-xl p-6 sm:p-8 border border-[#111E40] dark:border-slate-700">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-mono text-amber-300">Exemplo de Saída Estruturada</p>
                  <h3 className="font-display text-lg font-bold mt-1">
                    {activeSampleObjection.equipamento_relacionado}
                  </h3>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-xs text-slate-300 mb-2">Simular tipo de resistência do cliente:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#111E40] dark:bg-slate-950 p-1 rounded-lg">
                  {(['Preço', 'Concorrência', 'Dúvida Técnica', 'Prazo'] as ResistanceType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPreviewResistance(type)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                        previewResistance === type
                          ? 'bg-[#F59E0B] text-slate-950 font-semibold'
                          : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="p-4 rounded-lg bg-white/10 dark:bg-slate-800/80 border border-white/10 dark:border-slate-700">
                  <p className="text-xs font-mono text-amber-300 mb-1.5">Objeção Detectada</p>
                  <p className="text-slate-100 leading-relaxed">{activeSampleObjection.objecao_comum}</p>
                </div>

                <div className="p-4 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-transparent dark:border-slate-700">
                  <p className="text-xs font-mono font-semibold text-[#1B2E5E] dark:text-amber-400 mb-1.5">Argumento de Ouro</p>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{activeSampleObjection.argumento_tecnico}</p>
                </div>

                <div className="p-4 rounded-lg bg-white/10 dark:bg-slate-800/80 border border-white/10 dark:border-slate-700">
                  <p className="text-xs font-mono text-amber-300 mb-1.5">Analogia de Venda</p>
                  <p className="text-slate-200 leading-relaxed">{activeSampleObjection.analogia_venda}</p>
                </div>

                <div className="p-4 rounded-lg bg-white/10 dark:bg-slate-800/80 border border-white/10 dark:border-slate-700">
                  <p className="text-xs font-mono text-amber-300 mb-1.5">Pergunta de Poder</p>
                  <p className="text-white font-medium leading-relaxed">{activeSampleObjection.pergunta_poder}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenWorkspace('gerador')}
                className="w-full mt-6 inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-slate-950 bg-[#F59E0B] hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap"
              >
                Gerar argumento para qualquer um dos {OFFICIAL_CATALOG_COUNT} equipamentos
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04: MUNDO LABORATORIAL (CATÁLOGO OFICIAL COMPLETO AUTEC) */}
      <section id="equipamentos" className="py-16 lg:py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                04. Mundo Laboratorial · Catálogo Oficial Autec ({OFFICIAL_CATALOG_COUNT} Equipamentos e Consumíveis)
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B2E5E] dark:text-white tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Todos os equipamentos de autec.com.br/produtos/ integrados à plataforma
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onOpenWorkspace('comparativo')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#1B2E5E] dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Comparar equipamentos lado a lado
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* FILTER BAR BY BRAND + SEARCH */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              {['Todas', ...OFFICIAL_BRANDS].map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => {
                    setSelectedBrand(brand);
                    setShowAllCatalog(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    selectedBrand === brand
                      ? 'bg-[#1B2E5E] dark:bg-[#2B4C9B] text-white border-[#1B2E5E] dark:border-[#2B4C9B]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => {
                  setCatalogSearch(e.target.value);
                  setShowAllCatalog(true);
                }}
                placeholder="Buscar equipamento, técnica ou norma..."
                className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2E5E] dark:focus:ring-[#F59E0B]"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 tabular-nums">
            Exibindo {visibleCatalog.length} de {filteredCatalog.length} equipamento(s) encontrado(s)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCatalog.map((item) => (
              <article
                key={item.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/60 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] bg-white border-b border-slate-200 dark:border-slate-800 overflow-hidden p-4 flex items-center justify-center">
                    {!imgErrors[item.id] ? (
                      <img
                        src={item.image}
                        alt={item.nome_equipamento}
                        referrerPolicy="no-referrer"
                        onError={() => setImgErrors((prev) => ({ ...prev, [item.id]: true }))}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-500 bg-slate-100">
                        <FlaskConical className="w-8 h-8 text-[#1B2E5E] mb-2" />
                        <span className="text-xs font-medium text-center">{item.nome_equipamento}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {item.fabricante} · {item.categoria}
                    </p>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{item.nome_equipamento}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-4">
                      {item.descricao_oficial}
                    </p>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">Normas: </span>
                        <span className="font-mono">{item.normas_atendidas}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">ROI: </span>
                        {item.roi_estimado}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <a
                    href={item.url_oficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-[#1B2E5E] dark:hover:text-white whitespace-nowrap"
                  >
                    Ficha oficial
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace('gerador', item.id)}
                    className="text-xs font-semibold text-[#1B2E5E] dark:text-amber-400 hover:text-[#F59E0B] dark:hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    Gerar argumento →
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredCatalog.length > 9 && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setShowAllCatalog((prev) => !prev)}
                className="px-6 py-3 text-xs font-semibold text-[#1B2E5E] dark:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {showAllCatalog
                  ? 'Recolher lista'
                  : `Ver todos os ${filteredCatalog.length} equipamentos desta seleção`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 05: CICLO DE VENDAS EM 6 ETAPAS */}
      <section id="ciclo-vendas" className="py-16 lg:py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              05. Onde a Plataforma Atua · Fluxo Completo de Vendas Consultivas
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B2E5E] dark:text-white tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Atuação contínua em todas as 6 etapas do ciclo comercial
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SALES_CYCLE_STEPS.map((step) => (
              <div key={step.num} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                <div className="font-mono text-xs font-semibold text-[#F59E0B] mb-2">Etapa {step.num}</div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{step.titulo}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 06: CTA DE CONVERSÃO & EXPORTAÇÃO DA COPY */}
      <section className="py-16 lg:py-20 bg-[#1B2E5E] dark:bg-slate-900 text-white border-b border-transparent dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-mono text-amber-300 mb-3">
            Pronto para operar o Autec Smart Sales Engine
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ textWrap: 'balance' }}
          >
            Nunca mais trave diante de uma objeção técnica ou de preço
          </h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Acesse agora o ambiente interativo completo da plataforma com todos os {OFFICIAL_CATALOG_COUNT} equipamentos
            de autec.com.br/produtos/ disponíveis no campo &ldquo;Qual equipamento está sendo ofertado?&rdquo;, ou copie
            a documentação completa.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onOpenWorkspace('gerador')}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-slate-950 bg-[#F59E0B] hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Acessar Plataforma Interativa
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCopyCompleteDocument}
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {copiedFullCopy ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Copy completa copiada
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Copy Completa
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* QUIET INSTITUTIONAL FOOTER */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span className="font-semibold text-[#1B2E5E] dark:text-slate-100">Autec Smart Sales Engine</span> · Inteligência comercial
            para equipamentos laboratoriais
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onOpenWorkspace('gerador')}
              className="hover:text-[#1B2E5E] dark:hover:text-white transition-colors"
            >
              Gerador de Argumentos
            </button>
            <button
              type="button"
              onClick={() => onOpenWorkspace('comparativo')}
              className="hover:text-[#1B2E5E] dark:hover:text-white transition-colors"
            >
              Comparativo Técnico
            </button>
            <button
              type="button"
              onClick={() => onOpenWorkspace('painel')}
              className="hover:text-[#1B2E5E] dark:hover:text-white transition-colors"
            >
              Painel do Gestor
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
};
