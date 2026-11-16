import React, { useMemo, useState } from 'react';
import {
  Check,
  FileDown,
  FileText,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  EQUIPMENT_CATALOG,
  OFFICIAL_CATEGORIES,
  SELLER_RANKING,
  type CollaboratorRecord,
  type EquipmentItem,
  type LeadRecord,
  type OpportunityRecord,
} from '../../data/autecData';
import {
  exportPropostaComercialPdf,
  type CommercialProposalItem,
} from '../../utils/pdfExport';

interface PropostaComercialModuleProps {
  leads: LeadRecord[];
  opportunities: OpportunityRecord[];
  collaborators: CollaboratorRecord[];
  onRegisterOpportunity: (opp: OpportunityRecord) => void;
}

const REFERENCE_DATE = new Date('2026-11-16T12:00:00');

function estimateEquipmentUnitPrice(item: EquipmentItem): number {
  const name = item.nome_equipamento.toLowerCase();
  const cat = item.categoria.toLowerCase();
  const brand = item.fabricante.toLowerCase();

  if (name.includes('hptlc pro') || name.includes('orb pilot')) return 385000;
  if (name.includes('liberty') || name.includes('puri')) return 340000;
  if (name.includes('lumisizer') || name.includes('lumifuge')) return 310000;
  if (name.includes('v-10') || name.includes('selekt')) return 295000;
  if (name.includes('oracle') || name.includes('mars 6') || name.includes('phoenix')) return 248000;
  if (cat.includes('reatores') || brand === 'syrris') return 390000;
  if (cat.includes('cromatografia analítica')) return 195000;
  if (cat.includes('cromatografia preparativa')) return 260000;
  if (cat.includes('geradores')) return 168000;
  if (cat.includes('processos')) return 275000;
  if (cat.includes('evaporação') || cat.includes('síntese')) return 280000;
  if (cat.includes('consumíveis')) return 14500;
  return 185000;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function addDaysIso(days: number): { iso: string; display: string } {
  const dt = new Date(REFERENCE_DATE.getTime() + days * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const display = dt.toLocaleDateString('pt-BR');
  return { iso, display };
}

function buildAutoSummary(
  company: string,
  items: CommercialProposalItem[],
  city: string
): string {
  const targetName = company.trim() || 'V.Sa.';
  if (items.length === 0) {
    return `Proposta técnico-comercial elaborada pela Autec Instrumentos Científicos para atender às demandas analíticas de ${targetName}, com suporte local especializado e garantia integral.`;
  }
  const names = items.map((i) => `${i.equipment.nome_equipamento} (${i.equipment.fabricante})`).join(', ');
  const norms = Array.from(
    new Set(
      items
        .flatMap((i) => i.equipment.normas_atendidas.split('·'))
        .map((s) => s.trim())
        .filter(Boolean)
    )
  )
    .slice(0, 4)
    .join(', ');
  const primaryRoi = items[0].equipment.roi_estimado;

  return `A Autec Instrumentos Científicos apresenta a ${targetName}${city.trim() ? ` (${city.trim()})` : ''} esta proposta estruturada contemplando ${names}. A solução foi dimensionada para garantir conformidade normativa (${norms || 'ISO / USP / ANVISA'}) e retorno operacional mensurável — ${primaryRoi.toLowerCase()}, contando com comissionamento, treinamento e engenharia de aplicação local Autec no Brasil.`;
}

export const PropostaComercialModule: React.FC<PropostaComercialModuleProps> = ({
  leads,
  opportunities,
  collaborators,
  onRegisterOpportunity,
}) => {
  const defaultEquip =
    EQUIPMENT_CATALOG.find((e) => e.id === 'cem-phoenix-black') || EQUIPMENT_CATALOG[0];
  const secondaryEquip =
    EQUIPMENT_CATALOG.find((e) => e.id === 'camag-hptlc-pro') || EQUIPMENT_CATALOG[1];

  // Cliente & Destinatário
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [company, setCompany] = useState<string>('Eurofarma Laboratórios S.A.');
  const [cnpj, setCnpj] = useState<string>('61.190.096/0001-92');
  const [contactName, setContactName] = useState<string>('Dra. Camila Rezende');
  const [contactRole, setContactRole] = useState<string>('Gerente de Controle de Qualidade');
  const [clientEmail, setClientEmail] = useState<string>('camila.rezende@eurofarma.com.br');
  const [city, setCity] = useState<string>('Itapevi - SP');

  // Consultor responsável
  const [consultantName, setConsultantName] = useState<string>(SELLER_RANKING[0].nome);

  // Metadados da proposta
  const [proposalNumber, setProposalNumber] = useState<string>('AUT-2026-1148');
  const [validityDays, setValidityDays] = useState<number>(15);

  // Produtos selecionados
  const [items, setItems] = useState<CommercialProposalItem[]>([
    {
      equipment: defaultEquip,
      quantity: 1,
      unitPrice: estimateEquipmentUnitPrice(defaultEquip),
      discountPct: 0,
      configurationNote: 'Inclui conjunto de cadinhos de fibra de quartzo e calibração rastreável',
    },
  ]);

  // Seletor de catálogo
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('Todas');

  // Condições comerciais & escopo
  const [deliveryTime, setDeliveryTime] = useState<string>('30 a 45 dias úteis (Importação Assistida Autec)');
  const [paymentTerms, setPaymentTerms] = useState<string>('30 / 60 dias DDL após faturamento');
  const [freight, setFreight] = useState<string>('CIF — Entrega inclusa com seguro total');
  const [warranty, setWarranty] = useState<string>(
    '12 meses de garantia integral + instalação e treinamento pela engenharia Autec'
  );
  const [commercialNotes, setCommercialNotes] = useState<string>(
    'Valores em Reais (BRL) contemplando suporte técnico nacional e peças de reposição no Brasil.'
  );
  const [executiveSummary, setExecutiveSummary] = useState<string>(() =>
    buildAutoSummary(
      'Eurofarma Laboratórios S.A.',
      [
        {
          equipment: defaultEquip,
          quantity: 1,
          unitPrice: estimateEquipmentUnitPrice(defaultEquip),
          discountPct: 0,
        },
      ],
      'Itapevi - SP'
    )
  );
  const [includeTechnicalSpecs, setIncludeTechnicalSpecs] = useState<boolean>(true);
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState<boolean>(true);

  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [lastPdfFile, setLastPdfFile] = useState<string | null>(null);
  const [registeredFunnel, setRegisteredFunnel] = useState<boolean>(false);

  const consultantDetails = useMemo(() => {
    const col = collaborators.find((c) => c.full_name === consultantName);
    const seller = SELLER_RANKING.find((s) => s.nome === consultantName);
    return {
      name: consultantName,
      role: col?.cargo || seller?.cargo || 'Consultor Técnico Sênior',
      email:
        col?.email ||
        `${consultantName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.')}@autec.com.br`,
      phone: col?.telefone || '(11) 4311-6562',
    };
  }, [collaborators, consultantName]);

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return EQUIPMENT_CATALOG.filter((eq) => {
      if (catalogCategory !== 'Todas' && eq.categoria !== catalogCategory) return false;
      if (!q) return true;
      return [eq.nome_equipamento, eq.fabricante, eq.categoria, eq.normas_atendidas]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [catalogSearch, catalogCategory]);

  const totals = useMemo(() => {
    let gross = 0;
    let net = 0;
    items.forEach((it) => {
      const lineGross = it.quantity * it.unitPrice;
      const lineNet = lineGross * (1 - it.discountPct / 100);
      gross += lineGross;
      net += lineNet;
    });
    return {
      gross,
      discount: Math.max(0, gross - net),
      net,
    };
  }, [items]);

  const validUntil = useMemo(() => addDaysIso(validityDays), [validityDays]);

  const handleLoadPreset = (presetValue: string) => {
    setSelectedPreset(presetValue);
    if (!presetValue) return;

    const [kind, id] = presetValue.split('::');
    if (kind === 'lead') {
      const lead = leads.find((l) => l.id === id);
      if (!lead) return;
      setCompany(lead.empresa);
      setContactName(lead.contato);
      setContactRole(lead.cargo);
      setCity(lead.cidade);
      setConsultantName(lead.responsavel);
      setCnpj('');
      setClientEmail('');

      const eq =
        EQUIPMENT_CATALOG.find(
          (e) =>
            e.nome_equipamento.toLowerCase() === lead.equipamento_interesse.toLowerCase() ||
            lead.equipamento_interesse.toLowerCase().includes(e.nome_equipamento.toLowerCase())
        ) || secondaryEquip;
      const nextItems: CommercialProposalItem[] = [
        {
          equipment: eq,
          quantity: 1,
          unitPrice: estimateEquipmentUnitPrice(eq),
          discountPct: 0,
          configurationNote: `Atendimento ao lead ${lead.origem} (${lead.equipamento_interesse})`,
        },
      ];
      setItems(nextItems);
      setExecutiveSummary(buildAutoSummary(lead.empresa, nextItems, lead.cidade));
    } else if (kind === 'opp') {
      const opp = opportunities.find((o) => o.id === id);
      if (!opp) return;
      setCompany(opp.cliente);
      setContactName('Comitê Técnico / Compras');
      setContactRole('Laboratório');
      setCity('Brasil');
      setConsultantName(opp.vendedor_nome);

      const eq =
        EQUIPMENT_CATALOG.find(
          (e) =>
            e.nome_equipamento.toLowerCase() === opp.produto.toLowerCase() ||
            opp.produto.toLowerCase().includes(e.nome_equipamento.toLowerCase())
        ) || defaultEquip;
      const nextItems: CommercialProposalItem[] = [
        {
          equipment: eq,
          quantity: 1,
          unitPrice: opp.valor,
          discountPct: 0,
          configurationNote: 'Configuração padrão de fábrica com comissionamento Autec',
        },
      ];
      setItems(nextItems);
      setExecutiveSummary(buildAutoSummary(opp.cliente, nextItems, 'Brasil'));
    }
    setRegisteredFunnel(false);
    setLastPdfFile(null);
  };

  const handleAddProduct = (equipment: EquipmentItem) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.equipment.id === equipment.id);
      if (existingIdx >= 0) {
        return prev.map((it, idx) =>
          idx === existingIdx ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          equipment,
          quantity: 1,
          unitPrice: estimateEquipmentUnitPrice(equipment),
          discountPct: 0,
          configurationNote: '',
        },
      ];
    });
    setLastPdfFile(null);
  };

  const handleUpdateItem = (
    equipmentId: string,
    patch: Partial<Pick<CommercialProposalItem, 'quantity' | 'unitPrice' | 'discountPct' | 'configurationNote'>>
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.equipment.id === equipmentId ? { ...it, ...patch } : it))
    );
    setLastPdfFile(null);
  };

  const handleRemoveItem = (equipmentId: string) => {
    setItems((prev) => prev.filter((it) => it.equipment.id !== equipmentId));
    setLastPdfFile(null);
  };

  const handleGeneratePdf = async () => {
    if (!company.trim() || items.length === 0) return;
    setGeneratingPdf(true);
    try {
      const filename = await exportPropostaComercialPdf({
        proposalNumber: proposalNumber.trim() || 'AUT-2026-001',
        issueDate: REFERENCE_DATE.toLocaleDateString('pt-BR'),
        validUntilDisplay: validUntil.display,
        validityDays,
        client: {
          company: company.trim(),
          cnpj,
          contactName: contactName.trim() || 'Responsável Técnico',
          contactRole,
          email: clientEmail,
          city,
        },
        consultant: consultantDetails,
        items,
        executiveSummary,
        terms: {
          deliveryTime,
          paymentTerms,
          freight,
          warranty,
          notes: commercialNotes,
        },
        includeTechnicalSpecs,
        includeExecutiveSummary,
      });
      setLastPdfFile(filename);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleRegisterInFunnel = () => {
    if (!company.trim() || items.length === 0 || registeredFunnel) return;
    const productSummary =
      items.length === 1
        ? items[0].equipment.nome_equipamento
        : `${items[0].equipment.nome_equipamento} + ${items.length - 1} item(ns)`;

    onRegisterOpportunity({
      id: `opp-${Date.now()}`,
      cliente: company.trim(),
      produto: productSummary,
      vendedor_nome: consultantName,
      valor: Math.round(totals.net),
      status: 'proposta_enviada',
      previsao_fechamento: 'Nov/2026',
      validade_proposta: validUntil.iso,
    });
    setRegisteredFunnel(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Documentos Automáticos · Proposta Estruturada com Catálogo Oficial e Dados do Cliente
          </p>
          <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">
            Gerador de Proposta Comercial (PDF)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            disabled={generatingPdf || !company.trim() || items.length === 0}
            onClick={handleGeneratePdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            {lastPdfFile ? (
              <>
                <Check className="w-4 h-4 text-amber-300 dark:text-slate-950" />
                <span>PDF Gerado ({lastPdfFile.slice(0, 22)}…)</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>{generatingPdf ? 'Gerando PDF...' : 'Gerar Proposta Comercial (PDF)'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: DADOS DO CLIENTE, PRODUTOS E CONDIÇÕES */}
        <div className="xl:col-span-7 space-y-6">
          {/* 1. Dados do Cliente e Responsável */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  1. Dados do Cliente & Identificação
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preencha manualmente ou importe de um lead / oportunidade ativa
                </p>
              </div>

              <select
                value={selectedPreset}
                onChange={(e) => handleLoadPreset(e.target.value)}
                aria-label="Importar dados de lead ou oportunidade"
                className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg max-w-xs"
              >
                <option value="">Importar de Lead ou Oportunidade...</option>
                <optgroup label="Leads Recentes">
                  {leads.map((l) => (
                    <option key={l.id} value={`lead::${l.id}`}>
                      Lead: {l.empresa} ({l.equipamento_interesse})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Oportunidades no Funil">
                  {opportunities.map((o) => (
                    <option key={o.id} value={`opp::${o.id}`}>
                      Oport.: {o.cliente} ({o.produto})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Razão Social / Laboratório *
                </label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ex: Eurofarma Laboratórios S.A."
                  className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Contato / Comprador *
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nome do responsável"
                  className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Cargo / Departamento
                </label>
                <input
                  type="text"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  placeholder="Ex: Gerente de CQ"
                  className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full h-10 px-3 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Cidade / UF
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: São Paulo - SP"
                  className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  E-mail do Cliente
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Consultor Autec Responsável
                </label>
                <select
                  value={consultantName}
                  onChange={(e) => setConsultantName(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                >
                  {SELLER_RANKING.map((s) => (
                    <option key={s.id} value={s.nome}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 2. Seleção de Equipamentos & Valores */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                2. Seleção de Equipamentos do Catálogo ({items.length} item(ns))
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Busque entre os {EQUIPMENT_CATALOG.length} equipamentos oficiais Autec para compor o escopo
              </p>
            </div>

            {/* Buscador do Catálogo */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Adicionar equipamento (ex: Phoenix, HPTLC, V-10, LUMiSizer, Syrris)..."
                  className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>
              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                className="h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg sm:max-w-[210px]"
              >
                <option value="Todas">Todas as linhas</option>
                {OFFICIAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
              {filteredCatalog.slice(0, 12).map((eq) => {
                const alreadyAdded = items.some((i) => i.equipment.id === eq.id);
                return (
                  <div
                    key={eq.id}
                    className="px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0">
                        <img
                          src={eq.image}
                          alt={eq.nome_equipamento}
                          referrerPolicy="no-referrer"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {eq.nome_equipamento}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {eq.fabricante} · {eq.categoria}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddProduct(eq)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#1B2E5E] dark:text-amber-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md shrink-0 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {alreadyAdded ? '+1 Unid.' : 'Adicionar'}
                    </button>
                  </div>
                );
              })}
              {filteredCatalog.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Nenhum equipamento encontrado para este filtro.
                </div>
              )}
            </div>

            {/* Itens Selecionados na Proposta */}
            <div className="space-y-3 pt-2">
              {items.length === 0 ? (
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Selecione ao menos um equipamento acima para compor a proposta comercial.
                </div>
              ) : (
                items.map((item) => {
                  const netLine =
                    item.quantity * item.unitPrice * (1 - item.discountPct / 100);
                  return (
                    <div
                      key={item.equipment.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 bg-slate-50/70 dark:bg-slate-950/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.equipment.fabricante} · {item.equipment.categoria}
                          </p>
                          <h3 className="text-sm font-bold text-[#1B2E5E] dark:text-white truncate">
                            {item.equipment.nome_equipamento}
                          </h3>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remover ${item.equipment.nome_equipamento}`}
                          onClick={() => handleRemoveItem(item.equipment.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Qtd.
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.equipment.id, {
                                quantity: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className="w-full h-9 px-2.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Valor Unit. (R$)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={500}
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleUpdateItem(item.equipment.id, {
                                unitPrice: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full h-9 px-2.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Desconto (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={40}
                            value={item.discountPct}
                            onChange={(e) =>
                              handleUpdateItem(item.equipment.id, {
                                discountPct: Math.min(40, Math.max(0, Number(e.target.value) || 0)),
                              })
                            }
                            className="w-full h-9 px-2.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md tabular-nums"
                          />
                        </div>
                        <div className="text-right pb-1">
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                            Subtotal
                          </span>
                          <span className="font-mono text-xs font-bold text-[#1B2E5E] dark:text-sky-300 tabular-nums">
                            {formatBRL(netLine)}
                          </span>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={item.configurationNote || ''}
                        onChange={(e) =>
                          handleUpdateItem(item.equipment.id, {
                            configurationNote: e.target.value,
                          })
                        }
                        placeholder="Acessórios, voltagem, software 21 CFR Part 11 ou observação técnica do item..."
                        className="w-full h-8 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* 3. Condições Comerciais & Resumo Executivo */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                3. Condições Comerciais & Justificativa Técnica
              </h2>
              <button
                type="button"
                onClick={() => setExecutiveSummary(buildAutoSummary(company, items, city))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B2E5E] dark:text-amber-400 hover:underline self-start"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Regerar Resumo Automático
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Resumo Executivo da Proposta
              </label>
              <textarea
                rows={3}
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Número da Proposta
                </label>
                <input
                  type="text"
                  value={proposalNumber}
                  onChange={(e) => setProposalNumber(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Validade da Proposta
                </label>
                <select
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                >
                  <option value={7}>7 dias (Urgente · até {addDaysIso(7).display})</option>
                  <option value={15}>15 dias (Padrão · até {addDaysIso(15).display})</option>
                  <option value={30}>30 dias (até {addDaysIso(30).display})</option>
                  <option value={45}>45 dias (até {addDaysIso(45).display})</option>
                  <option value={60}>60 dias (até {addDaysIso(60).display})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Prazo de Entrega
                </label>
                <input
                  type="text"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Condição de Pagamento
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Frete & Modalidade
                </label>
                <input
                  type="text"
                  value={freight}
                  onChange={(e) => setFreight(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Garantia & Engenharia
                </label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Observações Comerciais Adicionais
                </label>
                <input
                  type="text"
                  value={commercialNotes}
                  onChange={(e) => setCommercialNotes(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-5 pt-2 text-xs text-slate-700 dark:text-slate-300">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExecutiveSummary}
                  onChange={(e) => setIncludeExecutiveSummary(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700"
                />
                <span>Incluir Resumo Executivo no PDF</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTechnicalSpecs}
                  onChange={(e) => setIncludeTechnicalSpecs(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700"
                />
                <span>Incluir Fichas Técnicas, Fotos e ROI dos Produtos</span>
              </label>
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: PRÉ-VISUALIZAÇÃO ESTRUTURADA DO DOCUMENTO */}
        <aside className="xl:col-span-5 xl:sticky xl:top-20 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {/* Faixa simulada do cabeçalho do PDF */}
            <div className="bg-[#1B2E5E] text-white px-5 py-4 border-b-2 border-[#F59E0B]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold text-amber-300">
                    PRÉ-VISUALIZAÇÃO DO DOCUMENTO
                  </p>
                  <h2 className="font-display text-base font-bold mt-0.5">
                    Proposta Nº {proposalNumber || 'AUT-2026'}
                  </h2>
                </div>
                <div className="text-right text-[11px] text-slate-200 font-mono tabular-nums">
                  <div>Emissão: {REFERENCE_DATE.toLocaleDateString('pt-BR')}</div>
                  <div>Válida até: {validUntil.display}</div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Destinatário */}
              <div className="grid grid-cols-2 gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Cliente</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block mt-0.5">
                    {company.trim() || 'Não informado'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {contactName || '-'} · {city || 'Brasil'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Consultor Autec
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block mt-0.5">
                    {consultantDetails.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {consultantDetails.phone}
                  </span>
                </div>
              </div>

              {/* Lista resumida dos equipamentos */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Itens da Proposta ({items.length})
                </p>
                {items.map((it) => {
                  const net = it.quantity * it.unitPrice * (1 - it.discountPct / 100);
                  return (
                    <div
                      key={it.equipment.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0">
                          <img
                            src={it.equipment.image}
                            alt={it.equipment.nome_equipamento}
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {it.quantity}× {it.equipment.nome_equipamento}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {it.equipment.fabricante} · {it.equipment.normas_atendidas.split('·')[0]}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs font-bold text-[#1B2E5E] dark:text-sky-300 tabular-nums shrink-0">
                        {formatBRL(net)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumo Financeiro */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-1.5 text-xs tabular-nums">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal bruto</span>
                  <span className="font-mono">{formatBRL(totals.gross)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>Descontos aplicados</span>
                    <span className="font-mono">- {formatBRL(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-sm text-[#1B2E5E] dark:text-white">
                  <span>Investimento Total</span>
                  <span className="font-mono dark:text-amber-400">{formatBRL(totals.net)}</span>
                </div>
              </div>

              {/* Condições resumidas */}
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Pagamento:</strong>{' '}
                  {paymentTerms}
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Entrega:</strong>{' '}
                  {deliveryTime}
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Frete:</strong> {freight}
                </p>
              </div>

              {/* Ações do Documento */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  disabled={generatingPdf || !company.trim() || items.length === 0}
                  onClick={handleGeneratePdf}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 disabled:opacity-50 rounded-lg transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{generatingPdf ? 'Gerando Proposta PDF...' : 'Gerar e Baixar Proposta PDF'}</span>
                </button>

                <button
                  type="button"
                  disabled={registeredFunnel || !company.trim() || items.length === 0}
                  onClick={handleRegisterInFunnel}
                  className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 text-xs font-semibold text-[#1B2E5E] dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-60 rounded-lg transition-colors"
                >
                  {registeredFunnel ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Proposta registrada no Cockpit & Funil</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Registrar Proposta no Cockpit do Gestor</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
