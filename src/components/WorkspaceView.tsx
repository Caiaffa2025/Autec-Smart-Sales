import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  SlidersHorizontal,
  BarChart3,
  BookOpen,
  Copy,
  Check,
  Mail,
  Send,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  History,
  Gauge,
  Trophy,
  Target,
  UserCheck,
  ShieldCheck,
  HelpCircle,
  Users,
  FileDown,
  FileText,
} from 'lucide-react';
import { exportComparativoPdf } from '../utils/pdfExport';
import {
  EQUIPMENT_CATALOG,
  OFFICIAL_BRANDS,
  OFFICIAL_CATEGORIES,
  OFFICIAL_CATALOG_COUNT,
  OBJECTION_LIBRARY,
  LAB_PROFILES,
  QUIZ_QUESTIONS,
  INITIAL_INTERACTIONS,
  INITIAL_OPPORTUNITIES,
  INITIAL_ACTIVITIES,
  INITIAL_GOALS,
  INITIAL_COLLABORATORS,
  INITIAL_LEADS,
  type ResistanceType,
  type EquipmentItem,
  type InteractionRecord,
  type GoalRecord,
  type CollaboratorRecord,
  type LeadRecord,
  type ObjectionEntry,
  type OpportunityRecord,
} from '../data/autecData';
import {
  PainelModule,
  HistoricoModule,
  CockpitModule,
  ClassificacaoModule,
  MetasModule,
  PainelGestorModule,
  NovosCadastrosModule,
  ColaboradoresModule,
} from './workspace/ManagementModules';
import { PropostaComercialModule } from './workspace/PropostaComercialModule';
import {
  buildManagerNotifications,
  DashboardAlertBar,
  getGoalProgressValue,
  LiveNotificationToast,
  NotificationDrawer,
  UrgentAlertStrip,
  type NotificationCategory,
  type NotificationTargetTab,
} from './workspace/NotificationCenter';
import {
  getBrowserNotificationPermission,
  getBrowserNotificationsEnabled,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
  setBrowserNotificationsEnabled,
  type BrowserNotificationPermission,
} from '../utils/browserNotifications';

export type WorkspaceTab =
  | 'gerador'
  | 'propostas'
  | 'comparativo'
  | 'painel'
  | 'historico'
  | 'cockpit'
  | 'classificacao'
  | 'metas'
  | 'novos_cadastros'
  | 'painel_gestor'
  | 'base_conhecimento'
  | 'questionario'
  | 'chat'
  | 'colaboradores';

interface WorkspaceViewProps {
  initialTab?: WorkspaceTab;
  initialEquipmentId?: string;
}

interface GeneratedResult {
  argumento_ouro: string;
  conteudo_suporte: string;
  pergunta_poder: string;
  email_followup: string;
  latency_ms?: number;
  source?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ref?: string;
}

const RESISTANCES: ResistanceType[] = ['Preço', 'Concorrência', 'Dúvida Técnica', 'Prazo'];

const SIDEBAR_GROUPS: {
  group: string;
  items: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }> }[];
}[] = [
  {
    group: 'Operação Comercial',
    items: [
      { id: 'gerador', label: 'Gerar Argumento', icon: Sparkles },
      { id: 'propostas', label: 'Gerador de Propostas', icon: FileText },
      { id: 'comparativo', label: 'Comparativo Técnico', icon: SlidersHorizontal },
      { id: 'chat', label: 'Chat de Equipamentos', icon: MessageSquare },
      { id: 'historico', label: 'Histórico de Interações', icon: History },
    ],
  },
  {
    group: 'Gestão & Performance',
    items: [
      { id: 'painel', label: 'Painel', icon: BarChart3 },
      { id: 'cockpit', label: 'Cockpit do Gestor', icon: Gauge },
      { id: 'painel_gestor', label: 'Painel do Gestor', icon: ShieldCheck },
      { id: 'classificacao', label: 'Classificação de vendedores', icon: Trophy },
      { id: 'metas', label: 'Gestão de Metas', icon: Target },
    ],
  },
  {
    group: 'Conhecimento & Equipe',
    items: [
      { id: 'base_conhecimento', label: 'Base de conhecimento', icon: BookOpen },
      { id: 'questionario', label: 'Questionário Comercial', icon: HelpCircle },
      { id: 'novos_cadastros', label: 'Novos Cadastros', icon: UserCheck },
      { id: 'colaboradores', label: 'Colaboradores', icon: Users },
    ],
  },
];

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  initialTab = 'painel',
  initialEquipmentId,
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);

  // Shared live operational state across all dashboard modules
  const [interactions, setInteractions] = useState<InteractionRecord[]>(INITIAL_INTERACTIONS);
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>(INITIAL_OPPORTUNITIES);
  const [activities] = useState(INITIAL_ACTIVITIES);
  const [goals, setGoals] = useState<GoalRecord[]>(INITIAL_GOALS);
  const [collaborators, setCollaborators] = useState<CollaboratorRecord[]>(INITIAL_COLLABORATORS);
  const [leads, setLeads] = useState<LeadRecord[]>(INITIAL_LEADS);
  const [objections, setObjections] = useState<ObjectionEntry[]>(OBJECTION_LIBRARY);

  // Manager Notification Center state
  const [notifDrawerOpen, setNotifDrawerOpen] = useState<boolean>(false);
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(() => new Set());
  const [dismissedNotifIds, setDismissedNotifIds] = useState<Set<string>>(() => new Set());
  const [liveToast, setLiveToast] = useState<{
    id: string;
    title: string;
    description: string;
    category: NotificationCategory;
  } | null>(null);
  const [browserPermission, setBrowserPermission] = useState<BrowserNotificationPermission>(
    getBrowserNotificationPermission
  );
  const [browserAlertsEnabled, setBrowserAlertsEnabled] = useState<boolean>(
    getBrowserNotificationsEnabled
  );
  const [testCountdown, setTestCountdown] = useState<number | null>(null);
  const baseTitleRef = useRef<string>(typeof document !== 'undefined' ? document.title : 'Autec Smart Sales');
  const prevGoalStatesRef = useRef<Map<string, { pct: number; valorMeta: number }>>(new Map());
  const isFirstGoalPassRef = useRef<boolean>(true);

  // --- Gerador de Argumento state ---
  const defaultEquipId =
    initialEquipmentId ||
    EQUIPMENT_CATALOG.find((e) => e.id === 'biotage-v-10-touch')?.id ||
    EQUIPMENT_CATALOG[0].id;
  const [equipmentId, setEquipmentId] = useState<string>(defaultEquipId);
  const [equipFilter, setEquipFilter] = useState<string>('');
  const [resistance, setResistance] = useState<ResistanceType>('Preço');
  const [clientName, setClientName] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [loadingGen, setLoadingGen] = useState<boolean>(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState<boolean>(false);
  const [funnelStatus, setFunnelStatus] = useState<'none' | 'avancou' | 'estagnou'>('none');
  const [stagnationReason, setStagnationReason] = useState<string>('Orçamento congelado');

  // --- Chat de Equipamentos state ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: `Olá! Sou o Chat de Equipamentos da Autec Smart Sales Engine, conectado aos ${OFFICIAL_CATALOG_COUNT} equipamentos oficiais de autec.com.br/produtos/ (CAMAG, Biotage, CEM, Syrris, VICI DBS, LUM, Biocomma e Advion Interchim). Pergunte sobre qualquer modelo, norma ou aplicação.`,
      ref: `Catálogo Oficial Autec (${OFFICIAL_CATALOG_COUNT} itens)`,
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // --- Comparativo Técnico state ---
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([
    EQUIPMENT_CATALOG.find((e) => e.id === 'biotage-v-10-touch')?.id || EQUIPMENT_CATALOG[0].id,
    EQUIPMENT_CATALOG.find((e) => e.id === 'cem-phoenix-black')?.id || EQUIPMENT_CATALOG[1].id,
    EQUIPMENT_CATALOG.find((e) => e.id === 'camag-hptlc-pro')?.id || EQUIPMENT_CATALOG[2].id,
  ]);
  const [compareSearch, setCompareSearch] = useState<string>('');
  const [compareCategory, setCompareCategory] = useState<string>('Todas');
  const [showComparePdfForm, setShowComparePdfForm] = useState<boolean>(false);
  const [compareClientName, setCompareClientName] = useState<string>('');
  const [compareConsultantName, setCompareConsultantName] = useState<string>('');
  const [comparePdfNotes, setComparePdfNotes] = useState<string>('');
  const [exportingComparePdf, setExportingComparePdf] = useState<boolean>(false);
  const [comparePdfDone, setComparePdfDone] = useState<string | null>(null);

  // --- Base de Conhecimento state ---
  const [kbSubTab, setKbSubTab] = useState<'produtos' | 'objecoes' | 'perfis'>('produtos');
  const [kbSearch, setKbSearch] = useState<string>('');
  const [kbBrand, setKbBrand] = useState<string>('Todas');
  const [showAddObj, setShowAddObj] = useState<boolean>(false);
  const [newObjCommon, setNewObjCommon] = useState('');
  const [newObjRes, setNewObjRes] = useState<ResistanceType>('Preço');
  const [newObjEquip, setNewObjEquip] = useState(EQUIPMENT_CATALOG[0].nome_equipamento);
  const [newObjArg, setNewObjArg] = useState('');
  const [newObjAnalogy, setNewObjAnalogy] = useState('');

  // --- Questionário Comercial (Quiz) state ---
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [quizConfirmed, setQuizConfirmed] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const selectedEquipment =
    EQUIPMENT_CATALOG.find((e) => e.id === equipmentId) || EQUIPMENT_CATALOG[0];

  const groupedEquipmentOptions = useMemo(() => {
    const q = equipFilter.toLowerCase().trim();
    const filtered = EQUIPMENT_CATALOG.filter((e) =>
      !q
        ? true
        : [e.nome_equipamento, e.fabricante, e.categoria, e.aplicacao_laboratorial]
            .join(' ')
            .toLowerCase()
            .includes(q)
    );
    const groups: Record<string, EquipmentItem[]> = {};
    filtered.forEach((item) => {
      if (!groups[item.categoria]) groups[item.categoria] = [];
      groups[item.categoria].push(item);
    });
    return { groups, count: filtered.length };
  }, [equipFilter]);

  const handleFilterChange = (val: string) => {
    setEquipFilter(val);
    const q = val.toLowerCase().trim();
    if (q) {
      const first = EQUIPMENT_CATALOG.find((e) =>
        [e.nome_equipamento, e.fabricante, e.categoria].join(' ').toLowerCase().includes(q)
      );
      if (first) setEquipmentId(first.id);
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateArgument = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingGen(true);
    setGenError(null);
    setFunnelStatus('none');
    setShowEmail(false);

    try {
      const res = await fetch('/api/generate-argument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId,
          resistance,
          context,
          clientName,
        }),
      });
      if (!res.ok) throw new Error('Falha ao consultar o motor de geração.');
      const data: GeneratedResult = await res.json();
      setGenerated(data);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoadingGen(false);
    }
  };

  const notifications = useMemo(
    () =>
      buildManagerNotifications({
        goals,
        leads,
        opportunities,
        collaborators,
      }),
    [goals, leads, opportunities, collaborators]
  );

  const activeNotifications = useMemo(
    () => notifications.filter((n) => !dismissedNotifIds.has(n.id)),
    [notifications, dismissedNotifIds]
  );

  const unreadNotifications = useMemo(
    () => activeNotifications.filter((n) => !readNotifIds.has(n.id)),
    [activeNotifications, readNotifIds]
  );

  const activeSectionLabel = useMemo(() => {
    for (const grp of SIDEBAR_GROUPS) {
      const found = grp.items.find((i) => i.id === activeTab);
      if (found) return found.label;
    }
    return 'Painel';
  }, [activeTab]);

  const showToast = (toast: {
    id: string;
    title: string;
    description: string;
    category: NotificationCategory;
  }) => {
    setLiveToast(toast);
    setTimeout(() => {
      setLiveToast((current) => (current?.id === toast.id ? null : current));
    }, 5500);
  };

  const handleMarkNotifRead = (id: string) => {
    setReadNotifIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleMarkAllNotifsRead = () => {
    setReadNotifIds(new Set(activeNotifications.map((n) => n.id)));
  };

  const handleDismissNotif = (id: string) => {
    setDismissedNotifIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleNavigateFromNotif = (tab: NotificationTargetTab, notifId: string) => {
    handleMarkNotifRead(notifId);
    setNotifDrawerOpen(false);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddLead = (lead: LeadRecord) => {
    setLeads((prev) => [lead, ...prev]);
    showToast({
      id: `toast-${lead.id}`,
      title: `Novo lead cadastrado: ${lead.empresa}`,
      description: `${lead.contato} · Interesse em ${lead.equipamento_interesse} (${lead.responsavel})`,
      category: 'novo_lead',
    });
  };

  const handleRegisterOpportunity = (opp: OpportunityRecord) => {
    setOpportunities((prev) => [opp, ...prev]);
    if (opp.validade_proposta) {
      const target = new Date(`${opp.validade_proposta}T12:00:00`);
      const today = new Date('2026-11-16T12:00:00');
      const daysLeft = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) {
        showToast({
          id: `toast-${opp.id}`,
          title: `Proposta com prazo curto: ${opp.cliente}`,
          description: `${opp.produto} registrada no funil com validade de ${daysLeft} dia(s).`,
          category: 'prazo_proposta',
        });
      }
    }
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    baseTitleRef.current = document.title;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        document.title = baseTitleRef.current;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.title = baseTitleRef.current;
    };
  }, []);

  useEffect(() => {
    const nextSnapshot = new Map<string, { pct: number; valorMeta: number }>();

    goals.forEach((g) => {
      const realized = getGoalProgressValue(g, opportunities);
      const pct = g.valor_meta > 0 ? Math.round((realized / g.valor_meta) * 100) : 0;
      nextSnapshot.set(g.id, { pct, valorMeta: g.valor_meta });

      if (isFirstGoalPassRef.current) return;

      const prev = prevGoalStatesRef.current.get(g.id);
      const owner =
        g.escopo === 'coletiva' ? 'Equipe Comercial Autec' : g.vendedor_nome || 'Vendedor';

      const crossedGoal = (!prev && pct >= 100) || (prev && prev.pct < 100 && pct >= 100);
      const enteredCriticalDeficit = (!prev && pct < 70) || (prev && prev.pct >= 70 && pct < 70);
      const targetChangedSignificantly = prev && prev.valorMeta !== g.valor_meta;

      if (crossedGoal || enteredCriticalDeficit || targetChangedSignificantly) {
        const isCriticalDeficit = pct < 70;
        const title = isCriticalDeficit
          ? `Alerta Crítico de Meta: ${owner}`
          : pct >= 100
          ? `Meta Atingida: ${owner}`
          : `Meta Ajustada: ${owner}`;
        const body = isCriticalDeficit
          ? `Atenção gestor: meta de ${g.tipo} caiu para ${pct}% do objetivo. Necessita ação imediata.`
          : pct >= 100
          ? `Objetivo de ${g.tipo} atingiu ${pct}% do valor estipulado.`
          : `Meta de ${g.tipo} atualizada — atingimento atual em ${pct}%.`;

        sendBrowserNotification({
          title,
          body,
          tag: `autec-goal-${g.id}`,
          requireInteraction: isCriticalDeficit,
          onClick: () => setActiveTab('metas'),
        });

        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          document.title = `(${isCriticalDeficit ? 'Meta Crítica' : 'Meta'}) ${baseTitleRef.current}`;
        }
      }
    });

    prevGoalStatesRef.current = nextSnapshot;
    isFirstGoalPassRef.current = false;
  }, [goals, opportunities]);

  const handleRequestBrowserPermission = async () => {
    const result = await requestBrowserNotificationPermission();
    setBrowserPermission(result);
    if (result === 'granted') {
      setBrowserAlertsEnabled(true);
      sendBrowserNotification({
        title: 'Autec Smart Sales · Alertas Nativos Ativados',
        body: 'Você receberá notificações em tempo real sobre metas críticas mesmo com esta aba minimizada.',
        tag: 'autec-permission-granted',
        onClick: () => setActiveTab('metas'),
      });
      showToast({
        id: `toast-perm-${Date.now()}`,
        title: 'Notificações do navegador ativadas',
        description: 'Alertas críticos de metas serão enviados mesmo com a aba minimizada.',
        category: 'meta_atingida',
      });
    }
  };

  const handleToggleBrowserAlerts = () => {
    setBrowserAlertsEnabled((prev) => {
      const next = !prev;
      setBrowserNotificationsEnabled(next);
      return next;
    });
  };

  const handleScheduleBackgroundTest = () => {
    if (testCountdown !== null) return;
    setTestCountdown(5);
    let remaining = 5;
    const timer = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setTestCountdown(remaining);
      } else {
        window.clearInterval(timer);
        setTestCountdown(null);
        const sent = sendBrowserNotification({
          title: 'Alerta Crítico de Meta · Equipe Autec',
          body: 'Meta coletiva de faturamento a 98,5% (faltam R$ 31.000) com fechamento mensal próximo.',
          tag: `autec-bg-test-${Date.now()}`,
          requireInteraction: true,
          onClick: () => setActiveTab('metas'),
        });
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          document.title = `(1) Meta Crítica · ${baseTitleRef.current}`;
        }
        if (sent) {
          showToast({
            id: `toast-bg-test-${Date.now()}`,
            title: 'Notificação nativa disparada',
            description: 'Alerta de mudança crítica em meta enviado ao sistema operacional.',
            category: 'meta_atingida',
          });
        }
      }
    }, 1000);
  };

  const handleAddGoal = (goal: GoalRecord) => {
    setGoals((prev) => [goal, ...prev]);
    const realized = getGoalProgressValue(goal, opportunities);
    const pct = goal.valor_meta > 0 ? Math.round((realized / goal.valor_meta) * 100) : 0;
    const owner =
      goal.escopo === 'coletiva' ? 'Equipe Comercial Autec' : goal.vendedor_nome || 'Vendedor';

    if (pct >= 100) {
      showToast({
        id: `toast-${goal.id}`,
        title: `Meta atingida: ${owner}`,
        description: `Indicador de ${goal.tipo} já alcançou ${pct}% da meta cadastrada.`,
        category: 'meta_atingida',
      });
    } else if (pct < 70) {
      showToast({
        id: `toast-${goal.id}`,
        title: `Risco crítico em meta: ${owner}`,
        description: `Meta de ${goal.tipo} iniciou com apenas ${pct}% de atingimento.`,
        category: 'meta_atingida',
      });
    }
  };

  const handleUpdateGoal = (id: string, nextValue: number) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, valor_meta: nextValue } : g)));
    const target = goals.find((g) => g.id === id);
    if (!target) return;
    const updatedGoal = { ...target, valor_meta: nextValue };
    const realized = getGoalProgressValue(updatedGoal, opportunities);
    const pct = nextValue > 0 ? Math.round((realized / nextValue) * 100) : 0;
    const owner =
      target.escopo === 'coletiva' ? 'Equipe Comercial Autec' : target.vendedor_nome || 'Vendedor';
    if (pct >= 100 || pct < 70) {
      showToast({
        id: `toast-upd-${id}-${Date.now()}`,
        title: pct >= 100 ? `Meta atingida: ${owner}` : `Alerta crítico: ${owner}`,
        description: `Atingimento recalculado para ${pct}% após ajuste da meta.`,
        category: 'meta_atingida',
      });
    }
  };

  const handleLogOutcome = (avancou: boolean) => {
    setFunnelStatus(avancou ? 'avancou' : 'estagnou');
    const clienteFinal = clientName.trim() || 'Laboratório em Prospecção';
    setInteractions((prev) => [
      {
        id: `int-${Date.now()}`,
        vendedor_nome: 'Rafael Mendonça',
        cliente: clienteFinal,
        equipamento: selectedEquipment.nome_equipamento,
        resistencia: resistance,
        concorrente_citado: selectedEquipment.concorrentes[0] || 'Concorrente direto',
        avancou,
        motivo: avancou ? undefined : stagnationReason,
        contexto: context.trim() || undefined,
        data: 'Agora',
        semana: 'Semana Atual',
      },
      ...prev,
    ]);
    if (clientName.trim()) {
      const alreadyExists = leads.some(
        (l) => l.empresa.toLowerCase() === clientName.trim().toLowerCase()
      );
      if (!alreadyExists) {
        handleAddLead({
          id: `lead-${Date.now()}`,
          empresa: clientName.trim(),
          contato: 'Contato Técnico em Prospecção',
          cargo: 'Laboratório',
          cidade: 'Brasil',
          equipamento_interesse: selectedEquipment.nome_equipamento,
          origem: 'Inbound Técnico',
          responsavel: 'Rafael Mendonça',
          status: avancou ? 'qualificado' : 'novo',
          created_date: '2026-11-16',
        });
      }
    }
  };

  const handleSendChat = async (questionText?: string) => {
    const q = (questionText ?? chatInput).trim();
    if (!q || chatLoading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: q };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!questionText) setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.answer || 'Não foi possível consultar a base.',
          ref: data.equipment_ref,
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Erro de conexão com o assistente técnico. Tente novamente.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleCompareItem = (id: string) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((item) => item !== id) : prev;
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const filteredCompareItems = useMemo(() => {
    const q = compareSearch.toLowerCase().trim();
    return EQUIPMENT_CATALOG.filter((item) => {
      const catOk = compareCategory === 'Todas' || item.categoria === compareCategory;
      if (!catOk) return false;
      if (!q) return true;
      return [
        item.nome_equipamento,
        item.fabricante,
        item.categoria,
        item.normas_atendidas,
        item.descricao_oficial,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [compareSearch, compareCategory]);

  const comparedItems = EQUIPMENT_CATALOG.filter((e) => selectedCompareIds.includes(e.id));

  const filteredKbProducts = useMemo(() => {
    const q = kbSearch.toLowerCase().trim();
    return EQUIPMENT_CATALOG.filter((e) => {
      const brandOk = kbBrand === 'Todas' || e.fabricante === kbBrand;
      if (!brandOk) return false;
      if (!q) return true;
      return [
        e.nome_equipamento,
        e.fabricante,
        e.categoria,
        e.descricao_oficial,
        e.normas_atendidas,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [kbSearch, kbBrand]);

  const filteredKbObjections = useMemo(() => {
    const q = kbSearch.toLowerCase().trim();
    return objections.filter(
      (o) =>
        !q ||
        [o.objecao_comum, o.tipo_resistencia, o.equipamento_relacionado, o.argumento_tecnico]
          .join(' ')
          .toLowerCase()
          .includes(q)
    );
  }, [kbSearch, objections]);

  const handleAddObjection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjCommon.trim() || !newObjArg.trim()) return;
    setObjections((prev) => [
      {
        id: `obj-${Date.now()}`,
        objecao_comum: newObjCommon.trim(),
        tipo_resistencia: newObjRes,
        equipamento_relacionado: newObjEquip,
        argumento_tecnico: newObjArg.trim(),
        analogia_venda: newObjAnalogy.trim() || 'Comparação direta de TCO e ganho operacional em bancada.',
        pergunta_poder: 'Se comprovarmos este ganho em demonstração técnica, avançamos com a aprovação?',
        conteudo_suporte: 'Ficha oficial Autec e estudo comparativo de aplicação.',
      },
      ...prev,
    ]);
    setNewObjCommon('');
    setNewObjArg('');
    setNewObjAnalogy('');
    setShowAddObj(false);
  };

  const currentQuestion = QUIZ_QUESTIONS[quizIndex];

  const handleConfirmQuiz = () => {
    if (quizChoice === null) return;
    setQuizConfirmed(true);
    if (quizChoice === currentQuestion.correta) {
      setQuizScore((s) => s + 1);
    }
  };

  const handleNextQuiz = () => {
    if (quizIndex + 1 < QUIZ_QUESTIONS.length) {
      setQuizIndex((i) => i + 1);
      setQuizChoice(null);
      setQuizConfirmed(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setQuizIndex(0);
    setQuizChoice(null);
    setQuizConfirmed(false);
    setQuizScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row transition-colors">
      {/* WORKSPACE SIDEBAR */}
      <aside className="lg:w-64 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 shrink-0">
        <div className="p-4 space-y-5">
          {SIDEBAR_GROUPS.map((grp) => (
            <div key={grp.group}>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 px-2.5 mb-1.5">{grp.group}</p>
              <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 text-left ${
                        active
                          ? 'bg-[#1B2E5E] dark:bg-[#2B4C9B] text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#F59E0B]' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl">
        <DashboardAlertBar
          activeSectionLabel={activeSectionLabel}
          notifications={notifications}
          readIds={readNotifIds}
          dismissedIds={dismissedNotifIds}
          drawerOpen={notifDrawerOpen}
          onToggleDrawer={() => setNotifDrawerOpen((o) => !o)}
          browserPermission={browserPermission}
          browserAlertsEnabled={browserAlertsEnabled}
          onRequestBrowserPermission={handleRequestBrowserPermission}
        />

        <UrgentAlertStrip
          topNotification={unreadNotifications[0]}
          totalUnread={unreadNotifications.length}
          onOpenDrawer={() => setNotifDrawerOpen(true)}
          onNavigate={handleNavigateFromNotif}
          onDismiss={handleDismissNotif}
        />

        {/* GERAR ARGUMENTO */}
        {activeTab === 'gerador' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Smart Sales Engine · Todos os {OFFICIAL_CATALOG_COUNT} equipamentos de autec.com.br/produtos/
              </p>
              <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">
                Gerador de Argumento de Ouro
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleGenerateArgument}
                className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label htmlFor="equip-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Qual equipamento está sendo ofertado?
                    </label>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {groupedEquipmentOptions.count} de {OFFICIAL_CATALOG_COUNT}
                    </span>
                  </div>

                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={equipFilter}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      placeholder="Filtrar lista (ex: CEM, CAMAG, Biotage, Syrris, VICI...)"
                      className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B2E5E] dark:focus:ring-[#F59E0B]"
                    />
                  </div>

                  <select
                    id="equip-select"
                    value={equipmentId}
                    onChange={(e) => setEquipmentId(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1B2E5E] dark:focus:ring-[#F59E0B]"
                  >
                    {Object.entries(groupedEquipmentOptions.groups).map(([cat, list]) => (
                      <optgroup key={cat} label={`${cat} (${list.length})`}>
                        {list.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.nome_equipamento} — {eq.fabricante}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Qual é a maior resistência do cliente hoje?
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {RESISTANCES.map((resItem) => (
                      <button
                        key={resItem}
                        type="button"
                        onClick={() => setResistance(resItem)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                          resistance === resItem
                            ? 'bg-[#1B2E5E] dark:bg-[#2B4C9B] text-white border-[#1B2E5E] dark:border-[#2B4C9B]'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {resItem}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="client-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Nome do cliente ou laboratório (opcional)
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Dra. Helena — Controle de Qualidade"
                    className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B2E5E] dark:focus:ring-[#F59E0B]"
                  />
                </div>

                <div>
                  <label htmlFor="meeting-context" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Contexto da reunião (opcional)
                  </label>
                  <textarea
                    id="meeting-context"
                    rows={3}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Quem é o cliente, quais dores mencionou, qual concorrente foi citado..."
                    className="w-full p-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B2E5E] dark:focus:ring-[#F59E0B]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingGen}
                  className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 disabled:opacity-60 rounded-lg transition-colors"
                >
                  {loadingGen ? 'Consultando Knowledge Base...' : 'Gerar Argumento'}
                </button>

                {genError && (
                  <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg p-3">{genError}</p>
                )}
              </form>

              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-full sm:w-32 h-28 bg-white border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center justify-center shrink-0">
                      <img
                        src={selectedEquipment.image}
                        alt={selectedEquipment.nome_equipamento}
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedEquipment.fabricante} · {selectedEquipment.categoria}
                        </p>
                        <h2 className="font-display text-lg font-bold text-[#1B2E5E] dark:text-white mt-0.5">
                          {selectedEquipment.nome_equipamento}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                          {selectedEquipment.descricao_oficial}
                        </p>
                      </div>
                      <a
                        href={selectedEquipment.url_oficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#1B2E5E] dark:text-amber-400 hover:text-[#F59E0B] shrink-0"
                      >
                        Página autec.com.br
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">Normas e Padrões</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">{selectedEquipment.normas_atendidas}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">Concorrentes Mapeados</span>
                      <span className="text-slate-600 dark:text-slate-400">{selectedEquipment.concorrentes.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {loadingGen && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                    <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                )}

                {!loadingGen && !generated && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
                    <Sparkles className="w-7 h-7 text-[#F59E0B] mx-auto mb-2" />
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Pronto para estruturar o argumento deste equipamento
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      Escolha o tipo de resistência e clique em &ldquo;Gerar Argumento&rdquo; para obter o Argumento de
                      Ouro, Conteúdo de Suporte, Pergunta de Poder e E-mail comercial personalizado.
                    </p>
                  </div>
                )}

                {!loadingGen && generated && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedEquipment.nome_equipamento} · {resistance}
                        {generated.latency_ms ? ` · ${generated.latency_ms}ms` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('arg', generated.argumento_ouro)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {copiedField === 'arg' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Argumento
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-xs font-mono font-semibold text-[#1B2E5E] dark:text-amber-400 mb-1.5">Argumento de Ouro</h3>
                      <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed">{generated.argumento_ouro}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Conteúdo de Suporte</h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{generated.conteudo_suporte}</p>
                    </div>

                    <div className="pt-4 bg-slate-50 dark:bg-slate-800/70 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h3 className="text-xs font-mono font-semibold text-[#1B2E5E] dark:text-amber-400 mb-1.5">Pergunta de Poder</h3>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">{generated.pergunta_poder}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setShowEmail((prev) => !prev)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1B2E5E] dark:text-amber-400 border border-[#1B2E5E] dark:border-amber-400 rounded-lg hover:bg-[#1B2E5E] hover:text-white dark:hover:bg-[#F59E0B] dark:hover:text-slate-950 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {showEmail ? 'Ocultar E-mail de Follow-up' : 'Criar E-mail para Cliente'}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">A proposta avançou no funil?</span>
                        <button
                          type="button"
                          onClick={() => handleLogOutcome(true)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                            funnelStatus === 'avancou'
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          Avançou
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLogOutcome(false)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                            funnelStatus === 'estagnou'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          Estagnou
                        </button>
                      </div>
                    </div>

                    {funnelStatus === 'estagnou' && (
                      <div className="flex items-center gap-3 pt-2 text-xs">
                        <label htmlFor="stagnation-reason" className="text-slate-600 dark:text-slate-300 font-medium shrink-0">
                          Motivo de Estagnação:
                        </label>
                        <select
                          id="stagnation-reason"
                          value={stagnationReason}
                          onChange={(e) => setStagnationReason(e.target.value)}
                          className="h-9 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Orçamento congelado">Orçamento congelado</option>
                          <option value="Aguardando aprovação técnica">Aguardando aprovação técnica</option>
                          <option value="Concorrente com menor preço inicial">Concorrente com menor preço inicial</option>
                          <option value="Prazo de auditoria apertado">Prazo de auditoria apertado</option>
                        </select>
                      </div>
                    )}

                    {showEmail && (
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Rascunho de Follow-up Comercial</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('email', generated.email_followup)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#1B2E5E] dark:text-amber-400"
                          >
                            {copiedField === 'email' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                                E-mail copiado
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copiar E-mail
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-4 leading-relaxed">
                          {generated.email_followup}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* COMPARATIVO TÉCNICO */}
        {activeTab === 'comparativo' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecione até 3 dos {OFFICIAL_CATALOG_COUNT} equipamentos oficiais para comparar lado a lado
                </p>
                <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">Comparativo Técnico</h1>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <select
                  value={compareCategory}
                  onChange={(e) => setCompareCategory(e.target.value)}
                  className="h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                >
                  <option value="Todas">Todas as categorias ({OFFICIAL_CATALOG_COUNT})</option>
                  {OFFICIAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="relative w-full sm:w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={compareSearch}
                    onChange={(e) => setCompareSearch(e.target.value)}
                    placeholder="Filtrar equipamento ou marca..."
                    className="w-full h-10 pl-9 pr-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2E5E] dark:focus:ring-[#F59E0B]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowComparePdfForm((prev) => !prev)}
                  className="h-10 px-3 text-xs font-medium text-[#1B2E5E] dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg whitespace-nowrap"
                >
                  {showComparePdfForm ? 'Ocultar cabeçalho' : 'Personalizar PDF'}
                </button>
                <button
                  type="button"
                  disabled={exportingComparePdf || comparedItems.length === 0}
                  onClick={async () => {
                    setExportingComparePdf(true);
                    setComparePdfDone(null);
                    try {
                      const file = await exportComparativoPdf({
                        items: comparedItems,
                        clientName: compareClientName,
                        consultantName: compareConsultantName,
                        notes: comparePdfNotes,
                      });
                      setComparePdfDone(file);
                      setTimeout(() => setComparePdfDone(null), 4000);
                    } finally {
                      setExportingComparePdf(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
                >
                  {comparePdfDone ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-300 dark:text-slate-950" />
                      PDF exportado
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      {exportingComparePdf ? 'Gerando PDF...' : 'Exportar PDF'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {showComparePdfForm && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="pdf-client" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Cliente / Laboratório destinatário
                  </label>
                  <input
                    id="pdf-client"
                    type="text"
                    value={compareClientName}
                    onChange={(e) => setCompareClientName(e.target.value)}
                    placeholder="Ex.: Eurofarma Controle de Qualidade"
                    className="w-full h-9 px-3 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B2E5E] dark:focus:ring-[#F59E0B]"
                  />
                </div>
                <div>
                  <label htmlFor="pdf-consultant" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Consultor Autec responsável
                  </label>
                  <input
                    id="pdf-consultant"
                    type="text"
                    value={compareConsultantName}
                    onChange={(e) => setCompareConsultantName(e.target.value)}
                    placeholder="Ex.: Rafael Mendonça"
                    className="w-full h-9 px-3 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B2E5E] dark:focus:ring-[#F59E0B]"
                  />
                </div>
                <div>
                  <label htmlFor="pdf-notes" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Observação para o cliente (opcional)
                  </label>
                  <input
                    id="pdf-notes"
                    type="text"
                    value={comparePdfNotes}
                    onChange={(e) => setComparePdfNotes(e.target.value)}
                    placeholder="Ex.: Comparativo para validação USP 281 e 21 CFR Part 11"
                    className="w-full h-9 px-3 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B2E5E] dark:focus:ring-[#F59E0B]"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              {filteredCompareItems.map((eq) => {
                const selected = selectedCompareIds.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => toggleCompareItem(eq.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      selected
                        ? 'bg-[#1B2E5E] dark:bg-[#2B4C9B] text-white border-[#1B2E5E] dark:border-[#2B4C9B]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {eq.nome_equipamento}
                  </button>
                );
              })}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70">
                    <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 w-44">Critério Técnico</th>
                    {comparedItems.map((item) => (
                      <th key={item.id} className="py-3.5 px-4 text-sm font-bold text-[#1B2E5E] dark:text-white align-top">
                        <div className="w-24 h-20 bg-white border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 mb-2 flex items-center justify-center">
                          <img
                            src={item.image}
                            alt={item.nome_equipamento}
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div>{item.nome_equipamento}</div>
                        <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">{item.fabricante}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">Categoria</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {item.categoria}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">Descrição Oficial</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-3.5 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.descricao_oficial}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">Normas Atendidas</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-3.5 px-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                        {item.normas_atendidas}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">ROI / Benefício</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-3.5 px-4 font-medium text-emerald-800 dark:text-emerald-400">
                        {item.roi_estimado}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">Concorrentes Diretos</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {item.concorrentes.join(', ')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">Link Oficial</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-3.5 px-4">
                        <a
                          href={item.url_oficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B2E5E] dark:text-amber-400 hover:text-[#F59E0B]"
                        >
                          autec.com.br
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHAT DE EQUIPAMENTOS */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                RAG sobre os {OFFICIAL_CATALOG_COUNT} Equipamentos Oficiais Autec
              </p>
              <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">
                Chat de Equipamentos
              </h1>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col h-[540px]">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Consultas rápidas:</span>
                {[
                  'Qual o diferencial do CEM Phoenix BLACK?',
                  'Fale sobre o HPTLC PRO da CAMAG',
                  'Quais reatores Syrris existem no catálogo?',
                  'Como funciona o puriFlash-5400?',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSendChat(prompt)}
                    className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#1B2E5E] dark:hover:border-[#F59E0B] text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-[#1B2E5E] dark:bg-[#2B4C9B] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.ref && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 px-1">Fonte: {m.ref}</span>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">Consultando catálogo oficial Autec...</div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pergunte sobre qualquer modelo (CEM, CAMAG, Biotage, Syrris, VICI DBS, LUM, Biocomma)..."
                  className="flex-1 h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2E5E] dark:focus:ring-[#F59E0B]"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="inline-flex items-center gap-2 px-4 h-10 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 disabled:opacity-50 rounded-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* GERADOR DE PROPOSTA COMERCIAL PDF */}
        {activeTab === 'propostas' && (
          <PropostaComercialModule
            leads={leads}
            opportunities={opportunities}
            collaborators={collaborators}
            onRegisterOpportunity={handleRegisterOpportunity}
          />
        )}

        {/* MÓDULOS DE GESTÃO & EQUIPE */}
        {activeTab === 'painel' && <PainelModule interactions={interactions} />}
        {activeTab === 'historico' && <HistoricoModule interactions={interactions} />}
        {activeTab === 'cockpit' && (
          <CockpitModule opportunities={opportunities} activities={activities} goals={goals} />
        )}
        {activeTab === 'classificacao' && (
          <ClassificacaoModule opportunities={opportunities} activities={activities} />
        )}
        {activeTab === 'metas' && (
          <MetasModule
            goals={goals}
            opportunities={opportunities}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={(id) => setGoals((prev) => prev.filter((g) => g.id !== id))}
          />
        )}
        {activeTab === 'painel_gestor' && (
          <PainelGestorModule interactions={interactions} opportunities={opportunities} />
        )}
        {activeTab === 'novos_cadastros' && (
          <NovosCadastrosModule
            collaborators={collaborators}
            leads={leads}
            onAddLead={handleAddLead}
          />
        )}
        {activeTab === 'colaboradores' && (
          <ColaboradoresModule
            collaborators={collaborators}
            onAddCollaborator={(c) => setCollaborators((prev) => [c, ...prev])}
            onUpdateRole={(id, role) =>
              setCollaborators((prev) => prev.map((c) => (c.id === id ? { ...c, role } : c)))
            }
            onToggleActive={(id) =>
              setCollaborators((prev) => prev.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c)))
            }
          />
        )}

        {/* BASE DE CONHECIMENTO */}
        {activeTab === 'base_conhecimento' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {OFFICIAL_CATALOG_COUNT} produtos oficiais de autec.com.br/produtos/, objeções e perfis de laboratório
                </p>
                <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">
                  Base de Conhecimento
                </h1>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg self-start">
                {(
                  [
                    { key: 'produtos', label: `Produtos (${OFFICIAL_CATALOG_COUNT})` },
                    { key: 'objecoes', label: `Objeções (${objections.length})` },
                    { key: 'perfis', label: 'Perfis' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setKbSubTab(t.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      kbSubTab === t.key
                        ? 'bg-white dark:bg-slate-900 text-[#1B2E5E] dark:text-amber-400 shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={kbSearch}
                  onChange={(e) => setKbSearch(e.target.value)}
                  placeholder="Buscar por nome, fabricante, norma ou objeção..."
                  className="w-full h-10 pl-9 pr-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2E5E] dark:focus:ring-[#F59E0B]"
                />
              </div>

              {kbSubTab === 'produtos' && (
                <select
                  value={kbBrand}
                  onChange={(e) => setKbBrand(e.target.value)}
                  className="h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                >
                  <option value="Todas">Todas as representadas ({OFFICIAL_CATALOG_COUNT})</option>
                  {OFFICIAL_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}

              {kbSubTab === 'objecoes' && (
                <button
                  type="button"
                  onClick={() => setShowAddObj((s) => !s)}
                  className="px-4 h-10 text-xs font-semibold text-white bg-[#1B2E5E] dark:bg-[#2B4C9B] rounded-lg"
                >
                  {showAddObj ? 'Cancelar' : 'Nova Objeção'}
                </button>
              )}
            </div>

            {kbSubTab === 'produtos' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {filteredKbProducts.length} equipamento(s) listado(s)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredKbProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-3">
                          <div className="w-20 h-20 bg-white border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                            <img
                              src={p.image}
                              alt={p.nome_equipamento}
                              referrerPolicy="no-referrer"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {p.fabricante} · {p.categoria}
                            </p>
                            <h3 className="font-display text-base font-bold text-[#1B2E5E] dark:text-white mt-0.5">
                              {p.nome_equipamento}
                            </h3>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{p.descricao_oficial}</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-semibold">Normas: </span>
                          <span className="font-mono">{p.normas_atendidas}</span>
                        </p>
                        <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium">{p.roi_estimado}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <a
                          href={p.url_oficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-[#1B2E5E] dark:hover:text-white"
                        >
                          Ficha autec.com.br
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setEquipmentId(p.id);
                            setActiveTab('gerador');
                          }}
                          className="text-xs font-semibold text-[#1B2E5E] dark:text-amber-400 hover:text-[#F59E0B]"
                        >
                          Ofertar no Gerador →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {kbSubTab === 'objecoes' && (
              <div className="space-y-4">
                {showAddObj && (
                  <form
                    onSubmit={handleAddObjection}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={newObjRes}
                        onChange={(e) => setNewObjRes(e.target.value as ResistanceType)}
                        className="h-10 px-3 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        {RESISTANCES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newObjEquip}
                        onChange={(e) => setNewObjEquip(e.target.value)}
                        className="h-10 px-3 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        {EQUIPMENT_CATALOG.map((eq) => (
                          <option key={eq.id} value={eq.nome_equipamento}>
                            {eq.nome_equipamento}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      required
                      value={newObjCommon}
                      onChange={(e) => setNewObjCommon(e.target.value)}
                      placeholder="Objeção comum relatada pelo cliente..."
                      className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                    />
                    <textarea
                      required
                      rows={2}
                      value={newObjArg}
                      onChange={(e) => setNewObjArg(e.target.value)}
                      placeholder="Argumento técnico de resposta..."
                      className="w-full p-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                    />
                    <input
                      type="text"
                      value={newObjAnalogy}
                      onChange={(e) => setNewObjAnalogy(e.target.value)}
                      placeholder="Analogia de venda (opcional)"
                      className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-semibold text-white bg-[#1B2E5E] dark:bg-[#2B4C9B] rounded-lg"
                    >
                      Salvar Objeção
                    </button>
                  </form>
                )}

                {filteredKbObjections.map((o) => (
                  <div key={o.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {o.tipo_resistencia} · {o.equipamento_relacionado}
                    </p>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">&ldquo;{o.objecao_comum}&rdquo;</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{o.argumento_tecnico}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-[#1B2E5E] dark:text-amber-400">Analogia de Venda: </span>
                      {o.analogia_venda}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {kbSubTab === 'perfis' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LAB_PROFILES.map((prof) => (
                  <div key={prof.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{prof.setor}</p>
                    <h3 className="font-display text-base font-bold text-[#1B2E5E] dark:text-white">{prof.perfil}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{prof.dores_especificas}</p>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {prof.normas_criticas}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QUESTIONÁRIO COMERCIAL */}
        {activeTab === 'questionario' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Treinamento de Prospecção e Posicionamento com Cenários Reais</p>
              <h1 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white mt-1">
                Questionário Comercial Autec
              </h1>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-2xl">
              {quizFinished ? (
                <div className="text-center py-6 space-y-4">
                  <h2 className="font-display text-2xl font-bold text-[#1B2E5E] dark:text-white">Quiz Concluído!</h2>
                  <p className="text-base text-slate-700 dark:text-slate-300 tabular-nums">
                    Você acertou <span className="font-mono font-bold">{quizScore}</span> de{' '}
                    <span className="font-mono font-bold">{QUIZ_QUESTIONS.length}</span> cenários comerciais.
                  </p>
                  <button
                    type="button"
                    onClick={handleRestartQuiz}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#1B2E5E] dark:bg-[#2B4C9B] rounded-lg hover:bg-[#111E40]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Refazer Treinamento
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Cenário {quizIndex + 1} de {QUIZ_QUESTIONS.length} · {currentQuestion.equipamento}
                    </span>
                    <span className="font-mono tabular-nums">Acertos: {quizScore}</span>
                  </div>

                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {currentQuestion.cenario}
                  </h2>

                  <div className="space-y-2.5">
                    {currentQuestion.opcoes.map((opt, idx) => {
                      const isSelected = quizChoice === idx;
                      const isCorrect = idx === currentQuestion.correta;
                      let style = 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100';
                      if (quizConfirmed) {
                        if (isCorrect) style = 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200';
                        else if (isSelected) style = 'border-red-500 bg-red-50 dark:bg-red-950/60 text-red-950 dark:text-red-200';
                      } else if (isSelected) {
                        style = 'border-[#1B2E5E] dark:border-[#F59E0B] bg-slate-100 dark:bg-slate-800 text-[#1B2E5E] dark:text-amber-300 font-medium';
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={quizConfirmed}
                          onClick={() => setQuizChoice(idx)}
                          className={`w-full text-left p-3.5 rounded-lg border text-sm transition-colors ${style}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {quizConfirmed && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm space-y-1.5">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {quizChoice === currentQuestion.correta ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                            <span className="text-emerald-800 dark:text-emerald-400">Resposta correta!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-700 dark:text-red-400" />
                            <span className="text-red-800 dark:text-red-400">Resposta incorreta</span>
                          </>
                        )}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{currentQuestion.explicacao}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    {!quizConfirmed ? (
                      <button
                        type="button"
                        disabled={quizChoice === null}
                        onClick={handleConfirmQuiz}
                        className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1B2E5E] dark:bg-[#F59E0B] dark:text-slate-950 disabled:opacity-50 rounded-lg"
                      >
                        Confirmar Resposta
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextQuiz}
                        className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-[#F59E0B] rounded-lg"
                      >
                        {quizIndex + 1 < QUIZ_QUESTIONS.length ? 'Próximo Cenário' : 'Ver Resultado'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <NotificationDrawer
        open={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        notifications={notifications}
        readIds={readNotifIds}
        dismissedIds={dismissedNotifIds}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
        onDismiss={handleDismissNotif}
        onNavigate={handleNavigateFromNotif}
        browserPermission={browserPermission}
        browserAlertsEnabled={browserAlertsEnabled}
        onRequestBrowserPermission={handleRequestBrowserPermission}
        onToggleBrowserAlerts={handleToggleBrowserAlerts}
        onScheduleBackgroundTest={handleScheduleBackgroundTest}
        testCountdown={testCountdown}
      />

      <LiveNotificationToast
        toast={liveToast}
        onOpenDrawer={() => setNotifDrawerOpen(true)}
        onClose={() => setLiveToast(null)}
      />
    </div>
  );
};
