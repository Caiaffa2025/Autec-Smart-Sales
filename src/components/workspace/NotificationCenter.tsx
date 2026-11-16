import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  Target,
  Trophy,
  UserPlus,
  X,
} from 'lucide-react';
import {
  SELLER_RANKING,
  type CollaboratorRecord,
  type GoalRecord,
  type LeadRecord,
  type OpportunityRecord,
} from '../../data/autecData';
import type { BrowserNotificationPermission } from '../../utils/browserNotifications';

export type NotificationCategory = 'meta_atingida' | 'novo_lead' | 'prazo_proposta';

export type NotificationTargetTab =
  | 'metas'
  | 'novos_cadastros'
  | 'painel_gestor'
  | 'cockpit';

export interface ManagerNotification {
  id: string;
  category: NotificationCategory;
  severity: 'success' | 'info' | 'warning' | 'urgent';
  title: string;
  description: string;
  metaText: string;
  timestamp: string;
  targetTab: NotificationTargetTab;
  targetLabel: string;
  priorityOrder: number;
}

const REFERENCE_TODAY = new Date('2026-11-16T12:00:00');

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getGoalProgressValue(g: GoalRecord, opportunities?: OpportunityRecord[]): number {
  const extraWonValue =
    opportunities
      ?.filter(
        (o) =>
          o.status === 'ganha' &&
          !o.id.startsWith('opp-') === false &&
          Number(o.id.replace('opp-', '')) > 7
      )
      .reduce(
        (sum, o) =>
          g.escopo === 'coletiva' || o.vendedor_nome === g.vendedor_nome ? sum + o.valor : sum,
        0
      ) || 0;

  const extraWonCount =
    opportunities?.filter(
      (o) =>
        o.status === 'ganha' &&
        Number(o.id.replace('opp-', '')) > 7 &&
        (g.escopo === 'coletiva' || o.vendedor_nome === g.vendedor_nome)
    ).length || 0;

  if (g.tipo === 'faturamento') {
    if (g.escopo === 'coletiva') return 1969000 + extraWonValue;
    const seller = SELLER_RANKING.find((s) => s.nome === g.vendedor_nome);
    return (seller ? seller.faturamento : 380000) + extraWonValue;
  }
  if (g.tipo === 'vendas') return (g.escopo === 'coletiva' ? 26 : 6) + extraWonCount;
  if (g.tipo === 'propostas') {
    const extraProps =
      opportunities?.filter(
        (o) =>
          Number(o.id.replace('opp-', '')) > 7 &&
          (g.escopo === 'coletiva' || o.vendedor_nome === g.vendedor_nome)
      ).length || 0;
    return (g.escopo === 'coletiva' ? 49 : 13) + extraProps;
  }
  return 32;
}

export function getDaysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T12:00:00`);
  return Math.round((target.getTime() - REFERENCE_TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildManagerNotifications(params: {
  goals: GoalRecord[];
  leads: LeadRecord[];
  opportunities: OpportunityRecord[];
  collaborators: CollaboratorRecord[];
}): ManagerNotification[] {
  const { goals, leads, opportunities } = params;
  const list: ManagerNotification[] = [];

  // 1. Metas Atingidas (>= 100%) e Desvios Críticos (< 70%)
  goals.forEach((g) => {
    const realized = getGoalProgressValue(g, opportunities);
    const pct = g.valor_meta > 0 ? Math.round((realized / g.valor_meta) * 100) : 0;
    const ownerLabel = g.escopo === 'coletiva' ? 'Equipe Comercial Autec' : g.vendedor_nome || 'Vendedor';
    const valText =
      g.tipo === 'faturamento'
        ? `${formatBRL(realized)} sobre meta de ${formatBRL(g.valor_meta)}`
        : `${realized} de ${g.valor_meta} em ${g.tipo}`;

    if (pct >= 100) {
      list.push({
        id: `notif-goal-${g.id}`,
        category: 'meta_atingida',
        severity: 'success',
        title: `Meta atingida: ${ownerLabel}`,
        description: `${ownerLabel} superou a meta de ${g.tipo} (${valText}).`,
        metaText: `${pct}% atingida`,
        timestamp: 'Hoje · Atualizado',
        targetTab: 'metas',
        targetLabel: 'Ver em Gestão de Metas',
        priorityOrder: 2,
      });
    } else if (pct < 70) {
      list.push({
        id: `notif-goal-risk-${g.id}`,
        category: 'meta_atingida',
        severity: 'urgent',
        title: `Risco crítico em meta: ${ownerLabel}`,
        description: `Meta de ${g.tipo} está em apenas ${pct}% (${valText}). Requer plano de ação imediato.`,
        metaText: `${pct}% · Alerta crítico`,
        timestamp: 'Ação necessária',
        targetTab: 'metas',
        targetLabel: 'Ajustar em Gestão de Metas',
        priorityOrder: 0,
      });
    }
  });

  // 2. Prazos de Propostas Prestes a Vencer (<= 7 dias)
  opportunities.forEach((opp) => {
    if (opp.status !== 'proposta_enviada' && opp.status !== 'em_negociacao') return;
    if (!opp.validade_proposta) return;
    const daysLeft = getDaysUntil(opp.validade_proposta);
    if (daysLeft <= 7) {
      const urgent = daysLeft <= 2;
      const dayLabel =
        daysLeft < 0
          ? `Vencida há ${Math.abs(daysLeft)} dia(s)`
          : daysLeft === 0
          ? 'Vence hoje'
          : daysLeft === 1
          ? 'Vence amanhã'
          : `Vence em ${daysLeft} dias`;
      list.push({
        id: `notif-opp-${opp.id}`,
        category: 'prazo_proposta',
        severity: urgent ? 'urgent' : 'warning',
        title: `Prazo de proposta: ${opp.cliente}`,
        description: `${opp.produto} (${formatBRL(opp.valor)}) sob responsabilidade de ${opp.vendedor_nome} — validade até ${new Date(`${opp.validade_proposta}T12:00:00`).toLocaleDateString('pt-BR')}.`,
        metaText: dayLabel,
        timestamp: urgent ? 'Ação imediata' : 'Prazo próximo',
        targetTab: 'painel_gestor',
        targetLabel: 'Abrir Painel do Gestor',
        priorityOrder: urgent ? 0 : 1,
      });
    }
  });

  // 3. Novos Cadastros de Leads (últimos 7 dias)
  leads.forEach((lead) => {
    const ageDays = Math.abs(getDaysUntil(lead.created_date));
    if (ageDays <= 7) {
      const whenLabel =
        ageDays === 0 ? 'Hoje' : ageDays === 1 ? 'Ontem' : `Há ${ageDays} dias`;
      list.push({
        id: `notif-lead-${lead.id}`,
        category: 'novo_lead',
        severity: 'info',
        title: `Novo lead cadastrado: ${lead.empresa}`,
        description: `${lead.contato} (${lead.cargo}) demonstrou interesse em ${lead.equipamento_interesse} via ${lead.origem}. Atribuído a ${lead.responsavel}.`,
        metaText: `${lead.cidade} · ${whenLabel}`,
        timestamp: whenLabel,
        targetTab: 'novos_cadastros',
        targetLabel: 'Ver em Novos Cadastros',
        priorityOrder: ageDays === 0 ? 1 : 3,
      });
    }
  });

  return list.sort((a, b) => a.priorityOrder - b.priorityOrder);
}

/* -------------------------------------------------------------------------- */
/* WORKSPACE TOP BAR (BREADCRUMB + NOTIFICATION TRIGGER)                      */
/* -------------------------------------------------------------------------- */
interface DashboardAlertBarProps {
  activeSectionLabel: string;
  notifications: ManagerNotification[];
  readIds: Set<string>;
  dismissedIds: Set<string>;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  browserPermission: BrowserNotificationPermission;
  browserAlertsEnabled: boolean;
  onRequestBrowserPermission: () => void;
}

export const DashboardAlertBar: React.FC<DashboardAlertBarProps> = ({
  activeSectionLabel,
  notifications,
  readIds,
  dismissedIds,
  drawerOpen,
  onToggleDrawer,
  browserPermission,
  browserAlertsEnabled,
  onRequestBrowserPermission,
}) => {
  const active = notifications.filter((n) => !dismissedIds.has(n.id));
  const unread = active.filter((n) => !readIds.has(n.id));
  const urgentCount = unread.filter((n) => n.category === 'prazo_proposta').length;
  const goalsCount = unread.filter((n) => n.category === 'meta_atingida').length;
  const leadsCount = unread.filter((n) => n.category === 'novo_lead').length;

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs min-w-0">
        <span className="font-semibold text-slate-500 dark:text-slate-400">Workspace Comercial</span>
        <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">/</span>
        <span className="font-semibold text-[#1B2E5E] dark:text-white truncate">{activeSectionLabel}</span>
        {unread.length > 0 && (
          <>
            <span className="hidden md:inline text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="hidden md:inline text-slate-500 dark:text-slate-400 tabular-nums">
              {goalsCount} meta(s) · {leadsCount} lead(s) · {urgentCount} prazo(s)
            </span>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
        {browserPermission === 'default' && (
          <button
            type="button"
            onClick={onRequestBrowserPermission}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-[#1B2E5E] dark:text-amber-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <BellRing className="w-3.5 h-3.5 shrink-0" />
            <span>Ativar Alertas Nativos</span>
          </button>
        )}
        {browserPermission === 'granted' && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 px-2">
            {browserAlertsEnabled ? (
              <>
                <BellRing className="w-3.5 h-3.5 shrink-0" />
                <span>2º plano ativo</span>
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">2º plano pausado</span>
              </>
            )}
          </span>
        )}

        <button
          type="button"
          onClick={onToggleDrawer}
          aria-expanded={drawerOpen}
          aria-controls="manager-notifications-drawer"
          className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            unread.length > 0
              ? 'bg-[#1B2E5E] hover:bg-[#111E40] text-white dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Bell className="w-3.5 h-3.5 shrink-0" />
          <span>Alertas do Gestor</span>
          <span
            className={`font-mono tabular-nums px-1.5 py-0.5 rounded text-[11px] font-bold ${
              unread.length > 0
                ? 'bg-white/15 text-white dark:bg-slate-950/15 dark:text-slate-950'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {unread.length}
          </span>
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* INLINE PRIORITY ALERT STRIP                                                */
/* -------------------------------------------------------------------------- */
interface UrgentAlertStripProps {
  topNotification: ManagerNotification | undefined;
  totalUnread: number;
  onOpenDrawer: () => void;
  onNavigate: (tab: NotificationTargetTab, notifId: string) => void;
  onDismiss: (id: string) => void;
}

export const UrgentAlertStrip: React.FC<UrgentAlertStripProps> = ({
  topNotification,
  totalUnread,
  onOpenDrawer,
  onNavigate,
  onDismiss,
}) => {
  if (!topNotification) return null;

  const isUrgent = topNotification.severity === 'urgent' || topNotification.severity === 'warning';
  const Icon =
    topNotification.category === 'meta_atingida'
      ? Trophy
      : topNotification.category === 'novo_lead'
      ? UserPlus
      : Clock;

  return (
    <div
      role="region"
      aria-label="Alerta prioritário para o gestor"
      className={`mb-6 rounded-xl border px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isUrgent
          ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/70'
          : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isUrgent
              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
              : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`font-semibold ${
                isUrgent
                  ? 'text-amber-900 dark:text-amber-300'
                  : 'text-emerald-900 dark:text-emerald-300'
              }`}
            >
              {topNotification.metaText}
            </span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {topNotification.title}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            {topNotification.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        <button
          type="button"
          onClick={() => onNavigate(topNotification.targetTab, topNotification.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B2E5E] dark:text-amber-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg whitespace-nowrap"
        >
          <span>{topNotification.targetLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        {totalUnread > 1 && (
          <button
            type="button"
            onClick={onOpenDrawer}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
          >
            Ver todas ({totalUnread})
          </button>
        )}
        <button
          type="button"
          aria-label="Dispensar alerta"
          onClick={() => onDismiss(topNotification.id)}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SLIDE-OVER NOTIFICATION DRAWER                                             */
/* -------------------------------------------------------------------------- */
interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: ManagerNotification[];
  readIds: Set<string>;
  dismissedIds: Set<string>;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  onNavigate: (tab: NotificationTargetTab, notifId: string) => void;
  browserPermission: BrowserNotificationPermission;
  browserAlertsEnabled: boolean;
  onRequestBrowserPermission: () => void;
  onToggleBrowserAlerts: () => void;
  onScheduleBackgroundTest: () => void;
  testCountdown: number | null;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  open,
  onClose,
  notifications,
  readIds,
  dismissedIds,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onNavigate,
  browserPermission,
  browserAlertsEnabled,
  onRequestBrowserPermission,
  onToggleBrowserAlerts,
  onScheduleBackgroundTest,
  testCountdown,
}) => {
  const [filterCategory, setFilterCategory] = useState<'todas' | NotificationCategory>('todas');
  const [onlyUnread, setOnlyUnread] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const activeList = notifications.filter((n) => !dismissedIds.has(n.id));
  const unreadTotal = activeList.filter((n) => !readIds.has(n.id)).length;

  const countByCat = {
    meta_atingida: activeList.filter((n) => n.category === 'meta_atingida').length,
    novo_lead: activeList.filter((n) => n.category === 'novo_lead').length,
    prazo_proposta: activeList.filter((n) => n.category === 'prazo_proposta').length,
  };

  const visibleList = activeList.filter((n) => {
    if (filterCategory !== 'todas' && n.category !== filterCategory) return false;
    if (onlyUnread && readIds.has(n.id)) return false;
    return true;
  });

  const renderIcon = (n: ManagerNotification) => {
    if (n.category === 'meta_atingida') {
      return (
        <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Target className="w-4 h-4" />
        </div>
      );
    }
    if (n.category === 'novo_lead') {
      return (
        <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-[#1B2E5E] dark:text-sky-300 flex items-center justify-center shrink-0">
          <UserPlus className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          n.severity === 'urgent'
            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
        }`}
      >
        <Clock className="w-4 h-4" />
      </div>
    );
  };

  const categoryLabel: Record<NotificationCategory, string> = {
    meta_atingida: 'Meta atingida',
    novo_lead: 'Novo cadastro de lead',
    prazo_proposta: 'Prazo de proposta',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="manager-notifications-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Central de Notificações do Gestor"
        className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitoramento Gerencial em Tempo Real
            </p>
            <h2 className="font-display text-lg font-bold text-[#1B2E5E] dark:text-white mt-0.5">
              Central de Notificações ({unreadTotal} não lidas)
            </h2>
          </div>
          <button
            type="button"
            aria-label="Fechar central de notificações"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Native Browser Notification Permission & Background Delivery Control */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  browserPermission === 'granted' && browserAlertsEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : browserPermission === 'denied'
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-[#1B2E5E] dark:text-amber-400'
                }`}
              >
                {browserPermission === 'denied' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : browserPermission === 'granted' && !browserAlertsEnabled ? (
                  <BellOff className="w-4 h-4" />
                ) : (
                  <BellRing className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Notificações Nativas do Navegador (Aba Minimizada)
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                  {browserPermission === 'granted'
                    ? browserAlertsEnabled
                      ? 'Permissão concedida. Mudanças críticas de metas disparam alertas na área de trabalho mesmo com a aba minimizada.'
                      : 'Permissão concedida, mas alertas nativos em segundo plano estão pausados.'
                    : browserPermission === 'default'
                    ? 'Autorize o navegador para receber alertas críticos de metas em tempo real mesmo fora desta aba.'
                    : browserPermission === 'denied'
                    ? 'Permissão bloqueada no navegador. Libere em Configurações do Site (ícone de cadeado na barra de endereço -> Notificações -> Permitir).'
                    : 'Seu navegador atual não suporta notificações nativas; alertas internos continuam ativos.'}
                </p>
              </div>
            </div>

            {browserPermission === 'granted' && (
              <button
                type="button"
                role="switch"
                aria-checked={browserAlertsEnabled}
                onClick={onToggleBrowserAlerts}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  browserAlertsEnabled
                    ? 'bg-emerald-700 text-white dark:bg-emerald-600'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {browserAlertsEnabled ? 'Ativo' : 'Pausado'}
              </button>
            )}
          </div>

          {browserPermission === 'default' && (
            <button
              type="button"
              onClick={onRequestBrowserPermission}
              className="w-full inline-flex items-center justify-center gap-2 h-9 px-3 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#F59E0B] dark:text-slate-950 dark:hover:bg-amber-400 rounded-lg transition-colors"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Permitir Notificações do Navegador</span>
            </button>
          )}

          {browserPermission === 'granted' && browserAlertsEnabled && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {testCountdown !== null
                  ? `Minimize a aba agora — disparando em ${testCountdown}s...`
                  : 'Valide o recebimento com a janela minimizada:'}
              </span>
              <button
                type="button"
                disabled={testCountdown !== null}
                onClick={onScheduleBackgroundTest}
                className="px-2.5 py-1 text-[11px] font-semibold text-[#1B2E5E] dark:text-amber-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 rounded-md whitespace-nowrap shrink-0 tabular-nums"
              >
                {testCountdown !== null ? `Agendado (${testCountdown}s)` : 'Testar em 2º plano (5s)'}
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
            {(
              [
                { key: 'todas', label: `Todas (${activeList.length})` },
                { key: 'meta_atingida', label: `Metas (${countByCat.meta_atingida})` },
                { key: 'novo_lead', label: `Leads (${countByCat.novo_lead})` },
                { key: 'prazo_proposta', label: `Prazos (${countByCat.prazo_proposta})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterCategory(tab.key)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filterCategory === tab.key
                    ? 'bg-white dark:bg-slate-900 text-[#1B2E5E] dark:text-amber-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => setOnlyUnread(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-[#1B2E5E] focus:ring-[#1B2E5E]"
              />
              <span>Exibir apenas não lidas</span>
            </label>

            <button
              type="button"
              disabled={unreadTotal === 0}
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1.5 font-semibold text-[#1B2E5E] dark:text-amber-400 hover:underline disabled:opacity-40 disabled:no-underline whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas como lidas
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {visibleList.length === 0 ? (
            <div className="px-6 py-16 text-center space-y-2">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Nenhuma notificação neste filtro
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Novos alertas aparecerão automaticamente quando metas forem atingidas, novos leads forem cadastrados ou propostas se aproximarem do vencimento.
              </p>
            </div>
          ) : (
            visibleList.map((n) => {
              const isRead = readIds.has(n.id);
              return (
                <div
                  key={n.id}
                  className={`p-5 transition-colors ${
                    isRead
                      ? 'bg-white dark:bg-slate-900 opacity-80'
                      : 'bg-slate-50/80 dark:bg-slate-800/35'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {renderIcon(n)}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {categoryLabel[n.category]}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-mono font-semibold tabular-nums ${
                              n.severity === 'urgent'
                                ? 'text-red-700 dark:text-red-400'
                                : n.severity === 'warning'
                                ? 'text-amber-700 dark:text-amber-400'
                                : n.severity === 'success'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-[#1B2E5E] dark:text-sky-300'
                            }`}
                          >
                            {n.metaText}
                          </span>
                        </div>
                        <span className="tabular-nums">
                          {!isRead && (
                            <span className="font-semibold text-[#1B2E5E] dark:text-amber-400 mr-1.5">
                              Nova ·
                            </span>
                          )}
                          {n.timestamp}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {n.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                        {n.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => onNavigate(n.targetTab, n.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B2E5E] dark:text-amber-400 hover:underline whitespace-nowrap"
                        >
                          <span>{n.targetLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-3 text-xs">
                          {!isRead && (
                            <button
                              type="button"
                              onClick={() => onMarkRead(n.id)}
                              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium whitespace-nowrap"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Marcar lida
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDismiss(n.id)}
                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-medium whitespace-nowrap"
                          >
                            Dispensar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* LIVE TOAST NOTIFICATION                                                    */
/* -------------------------------------------------------------------------- */
interface LiveNotificationToastProps {
  toast: {
    id: string;
    title: string;
    description: string;
    category: NotificationCategory;
  } | null;
  onOpenDrawer: () => void;
  onClose: () => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({
  toast,
  onOpenDrawer,
  onClose,
}) => {
  if (!toast) return null;

  const Icon =
    toast.category === 'meta_atingida'
      ? Trophy
      : toast.category === 'novo_lead'
      ? UserPlus
      : Clock;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl flex items-start gap-3"
    >
      <div className="w-8 h-8 rounded-lg bg-[#1B2E5E] dark:bg-[#F59E0B] text-white dark:text-slate-950 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{toast.title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
          {toast.description}
        </p>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenDrawer();
          }}
          className="mt-2 text-xs font-semibold text-[#1B2E5E] dark:text-amber-400 hover:underline"
        >
          Abrir Central de Alertas →
        </button>
      </div>
      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
