import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EquipmentItem, InteractionRecord } from '../data/autecData';

const AUTEC_NAVY: [number, number, number] = [27, 46, 94]; // #1B2E5E
const AUTEC_DARK: [number, number, number] = [15, 23, 42]; // #0F172A
const AUTEC_AMBER: [number, number, number] = [245, 158, 11]; // #F59E0B
const SLATE_TEXT: [number, number, number] = [51, 65, 85]; // #334155
const SLATE_MUTED: [number, number, number] = [100, 116, 139]; // #64748B
const SLATE_BG: [number, number, number] = [248, 250, 252]; // #F8FAFC
const BORDER_GRAY: [number, number, number] = [226, 232, 240]; // #E2E8F0

function sanitizePdfText(input: string | undefined | null): string {
  if (!input) return '-';
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2192/g, '->')
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    .replace(/\u00B5|\u03BC/g, 'u')
    .replace(/\u2122/g, 'TM')
    .replace(/\u00AE/g, '(R)')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u00B7/g, ' | ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatNowPtBr(): { display: string; fileStamp: string } {
  const now = new Date();
  const display = now.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const pad = (n: number) => String(n).padStart(2, '0');
  const fileStamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return { display, fileStamp };
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = window.setTimeout(() => resolve(null), 3500);
    img.onload = () => {
      window.clearTimeout(timer);
      try {
        const maxSide = 360;
        const ratio = Math.min(maxSide / (img.naturalWidth || maxSide), maxSide / (img.naturalHeight || maxSide), 1);
        const w = Math.max(1, Math.round((img.naturalWidth || 200) * ratio));
        const h = Math.max(1, Math.round((img.naturalHeight || 200) * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

function drawHeaderBanner(
  doc: jsPDF,
  title: string,
  subtitle: string,
  metaRightTop: string,
  metaRightBottom: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const bannerHeight = 28;

  doc.setFillColor(...AUTEC_NAVY);
  doc.rect(0, 0, pageWidth, bannerHeight, 'F');

  doc.setFillColor(...AUTEC_AMBER);
  doc.rect(0, bannerHeight, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AUTEC SMART SALES ENGINE', 14, 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(226, 232, 240);
  doc.text(sanitizePdfText(title), 14, 18);

  doc.setFontSize(8);
  doc.setTextColor(253, 230, 138);
  doc.text(sanitizePdfText(subtitle), 14, 23.5);

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(8);
  doc.text(sanitizePdfText(metaRightTop), pageWidth - 14, 12, { align: 'right' });
  doc.text(sanitizePdfText(metaRightBottom), pageWidth - 14, 18, { align: 'right' });

  return bannerHeight + 7;
}

function drawFooters(doc: jsPDF, docLabel: string) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER_GRAY);
    doc.line(14, pageHeight - 13, pageWidth - 14, pageHeight - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(
      sanitizePdfText(`Autec - ${docLabel} | Portfólio oficial: autec.com.br/produtos`),
      14,
      pageHeight - 8
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
}

export interface ComparativoPdfOptions {
  items: EquipmentItem[];
  clientName?: string;
  consultantName?: string;
  notes?: string;
}

export async function exportComparativoPdf({
  items,
  clientName,
  consultantName,
  notes,
}: ComparativoPdfOptions): Promise<string> {
  const doc = new jsPDF({
    orientation: items.length >= 3 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { display, fileStamp } = formatNowPtBr();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = drawHeaderBanner(
    doc,
    'Relatório Comparativo Técnico de Equipamentos',
    'Especificações oficiais, normas regulatórias e retorno sobre investimento (ROI)',
    `Emitido em: ${display}`,
    `${items.length} equipamento(s) comparado(s)`
  );

  // Optional Recipient / Consultant bar
  const hasContext = Boolean(clientName?.trim() || consultantName?.trim() || notes?.trim());
  if (hasContext) {
    const boxHeight = notes?.trim() ? 18 : 12;
    doc.setFillColor(...SLATE_BG);
    doc.setDrawColor(...BORDER_GRAY);
    doc.roundedRect(14, y, pageWidth - 28, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...AUTEC_NAVY);
    const leftText = clientName?.trim() ? `Cliente / Laboratório: ${clientName.trim()}` : 'Proposta Técnica Autec';
    doc.text(sanitizePdfText(leftText), 18, y + 5);

    if (consultantName?.trim()) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE_TEXT);
      doc.text(sanitizePdfText(`Consultor: ${consultantName.trim()}`), pageWidth - 18, y + 5, { align: 'right' });
    }

    if (notes?.trim()) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_TEXT);
      doc.text(sanitizePdfText(`Observação comercial: ${notes.trim()}`), 18, y + 11.5, {
        maxWidth: pageWidth - 36,
      });
    }

    y += boxHeight + 5;
  }

  // Load equipment images in parallel
  const imageUrls = await Promise.all(items.map((item) => loadImageAsDataUrl(item.image)));

  // Visual product header cards
  const marginX = 14;
  const labelColWidth = items.length >= 3 ? 40 : 42;
  const usableTableWidth = pageWidth - marginX * 2;
  const equipColWidth = (usableTableWidth - labelColWidth) / Math.max(1, items.length);
  const cardHeight = 36;

  doc.setFillColor(...SLATE_BG);
  doc.setDrawColor(...BORDER_GRAY);
  doc.rect(marginX, y, labelColWidth, cardHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...AUTEC_NAVY);
  doc.text('Equipamentos\nSelecionados', marginX + 4, y + 15);

  items.forEach((item, idx) => {
    const x = marginX + labelColWidth + idx * equipColWidth;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER_GRAY);
    doc.rect(x, y, equipColWidth, cardHeight, 'FD');

    const imgData = imageUrls[idx];
    if (imgData) {
      try {
        doc.addImage(imgData, 'JPEG', x + 4, y + 3, 22, 22, undefined, 'FAST');
      } catch {
        // Ignore drawing error if image fails
      }
    }

    const textX = imgData ? x + 29 : x + 4;
    const textMaxW = imgData ? equipColWidth - 32 : equipColWidth - 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(sanitizePdfText(item.fabricante.toUpperCase()), textX, y + 7, { maxWidth: textMaxW });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...AUTEC_NAVY);
    doc.text(sanitizePdfText(item.nome_equipamento), textX, y + 12.5, { maxWidth: textMaxW });
  });

  y += cardHeight;

  const head = [
    ['Critério Técnico', ...items.map((item) => sanitizePdfText(item.nome_equipamento))],
  ];

  const body = [
    ['Fabricante', ...items.map((item) => sanitizePdfText(item.fabricante))],
    ['Categoria', ...items.map((item) => sanitizePdfText(item.categoria))],
    ['Descrição Oficial', ...items.map((item) => sanitizePdfText(item.descricao_oficial))],
    ['Aplicação Laboratorial', ...items.map((item) => sanitizePdfText(item.aplicacao_laboratorial))],
    ['Normas Atendidas', ...items.map((item) => sanitizePdfText(item.normas_atendidas))],
    ['ROI / Benefício Direto', ...items.map((item) => sanitizePdfText(item.roi_estimado))],
    ['Concorrentes Mapeados', ...items.map((item) => sanitizePdfText(item.concorrentes.join(', ')))],
    ['Ficha Oficial Autec', ...items.map((item) => sanitizePdfText(item.url_oficial))],
  ];

  const columnStyles: Record<number, { cellWidth: number; fontStyle?: 'bold' | 'normal'; textColor?: [number, number, number] }> = {
    0: { cellWidth: labelColWidth, fontStyle: 'bold', textColor: AUTEC_DARK },
  };
  items.forEach((_, idx) => {
    columnStyles[idx + 1] = { cellWidth: equipColWidth };
  });

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX, bottom: 18 },
    head,
    body,
    theme: 'grid',
    showHead: 'never',
    styles: {
      font: 'helvetica',
      fontSize: 8.2,
      cellPadding: 3,
      lineColor: BORDER_GRAY,
      lineWidth: 0.2,
      textColor: SLATE_TEXT,
      valign: 'top',
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: SLATE_BG,
    },
    columnStyles,
    didParseCell: (data) => {
      if (data.row.index === 5 && data.column.index > 0) {
        data.cell.styles.textColor = [6, 95, 70];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.row.index === 4 && data.column.index > 0) {
        data.cell.styles.textColor = AUTEC_NAVY;
      }
    },
  });

  drawFooters(doc, 'Relatório Comparativo Técnico');
  const filename = `Autec_Comparativo_Tecnico_${fileStamp}.pdf`;
  doc.save(filename);
  return filename;
}

export interface HistoricoPdfOptions {
  interactions: InteractionRecord[];
  filters: {
    search?: string;
    resistance?: string;
    status?: string;
  };
  clientLabel?: string;
}

export function exportHistoricoPdf({
  interactions,
  filters,
  clientLabel,
}: HistoricoPdfOptions): string {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const { display, fileStamp } = formatNowPtBr();
  const pageWidth = doc.internal.pageSize.getWidth();
  const total = interactions.length;
  const avancaram = interactions.filter((i) => i.avancou).length;
  const estagnadas = total - avancaram;
  const taxaAvanco = total > 0 ? ((avancaram / total) * 100).toFixed(1) : '0.0';

  let y = drawHeaderBanner(
    doc,
    'Relatório de Histórico de Interações Comerciais',
    'Rastreabilidade de negociações, objeções superadas e posicionamento competitivo',
    `Emitido em: ${display}`,
    `${total} interação(ões) exportada(s)`
  );

  // KPI strip inside PDF
  const cardGap = 4;
  const usableW = pageWidth - 28;
  const cardW = (usableW - cardGap * 3) / 4;
  const kpis = [
    { label: 'Interações Registradas', value: String(total), color: AUTEC_NAVY },
    { label: 'Avançaram no Funil', value: String(avancaram), color: [4, 120, 87] as [number, number, number] },
    { label: 'Estagnadas', value: String(estagnadas), color: [180, 83, 9] as [number, number, number] },
    { label: 'Taxa de Avanço', value: `${taxaAvanco}%`, color: AUTEC_NAVY },
  ];

  kpis.forEach((k, idx) => {
    const x = 14 + idx * (cardW + cardGap);
    doc.setFillColor(...SLATE_BG);
    doc.setDrawColor(...BORDER_GRAY);
    doc.roundedRect(x, y, cardW, 15, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(sanitizePdfText(k.label), x + 3.5, y + 5.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...k.color);
    doc.text(k.value, x + 3.5, y + 11.8);
  });

  y += 19;

  // Applied filters summary line
  const activeFilterParts: string[] = [];
  if (clientLabel?.trim()) activeFilterParts.push(`Destinatário: ${clientLabel.trim()}`);
  if (filters.resistance && filters.resistance !== 'Todas') activeFilterParts.push(`Resistência: ${filters.resistance}`);
  if (filters.status && filters.status !== 'todos') {
    activeFilterParts.push(`Desfecho: ${filters.status === 'avancou' ? 'Avançou' : 'Estagnou'}`);
  }
  if (filters.search?.trim()) activeFilterParts.push(`Busca: "${filters.search.trim()}"`);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_MUTED);
  doc.text(
    sanitizePdfText(
      activeFilterParts.length > 0
        ? `Filtros aplicados: ${activeFilterParts.join(' | ')}`
        : 'Filtros aplicados: Todos os registros do histórico comercial'
    ),
    14,
    y
  );

  y += 4;

  const head = [
    ['Data', 'Cliente & Contexto', 'Equipamento Autec', 'Consultor', 'Resistência', 'Concorrente', 'Desfecho'],
  ];

  const body =
    interactions.length > 0
      ? interactions.map((row) => [
          sanitizePdfText(row.data),
          sanitizePdfText(row.contexto ? `${row.cliente}\n${row.contexto}` : row.cliente),
          sanitizePdfText(row.equipamento),
          sanitizePdfText(row.vendedor_nome),
          sanitizePdfText(row.resistencia),
          sanitizePdfText(row.concorrente_citado),
          sanitizePdfText(row.avancou ? 'Avançou no funil' : `Estagnou (${row.motivo || 'Sem motivo'})`),
        ])
      : [['-', 'Nenhuma interação encontrada para os filtros selecionados.', '-', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, bottom: 18 },
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: AUTEC_NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.2,
      cellPadding: 3,
    },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.8,
      lineColor: BORDER_GRAY,
      lineWidth: 0.2,
      textColor: SLATE_TEXT,
      valign: 'top',
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: SLATE_BG,
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 66 },
      2: { cellWidth: 42, fontStyle: 'bold', textColor: AUTEC_NAVY },
      3: { cellWidth: 34 },
      4: { cellWidth: 26 },
      5: { cellWidth: 38 },
      6: { cellWidth: 39, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const text = String(data.cell.raw || '');
        if (text.startsWith('Avançou')) {
          data.cell.styles.textColor = [4, 120, 87];
        } else if (text.startsWith('Estagnou')) {
          data.cell.styles.textColor = [180, 83, 9];
        }
      }
    },
  });

  drawFooters(doc, 'Histórico de Interações Comerciais');
  const filename = `Autec_Historico_Interacoes_${fileStamp}.pdf`;
  doc.save(filename);
  return filename;
}

export interface CommercialProposalItem {
  equipment: EquipmentItem;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  configurationNote?: string;
}

export interface CommercialProposalPdfOptions {
  proposalNumber: string;
  issueDate: string;
  validUntilDisplay: string;
  validityDays: number;
  client: {
    company: string;
    cnpj?: string;
    contactName: string;
    contactRole?: string;
    email?: string;
    city?: string;
  };
  consultant: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  items: CommercialProposalItem[];
  executiveSummary: string;
  terms: {
    deliveryTime: string;
    paymentTerms: string;
    freight: string;
    warranty: string;
    notes?: string;
  };
  includeTechnicalSpecs: boolean;
  includeExecutiveSummary: boolean;
}

function formatBRLPdf(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export async function exportPropostaComercialPdf(
  options: CommercialProposalPdfOptions
): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { fileStamp } = formatNowPtBr();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentW = pageWidth - marginX * 2;

  let y = drawHeaderBanner(
    doc,
    `Proposta Técnico-Comercial Nº ${options.proposalNumber}`,
    'Equipamentos Científicos e Analíticos de Alta Performance',
    `Emissão: ${options.issueDate}`,
    `Validade: ${options.validUntilDisplay} (${options.validityDays} dias)`
  );

  // 1. Identificação das Partes (Proponente & Cliente)
  const boxGap = 4;
  const halfW = (contentW - boxGap) / 2;
  const partyBoxH = 31;

  // Proponente Autec
  doc.setFillColor(...SLATE_BG);
  doc.setDrawColor(...BORDER_GRAY);
  doc.roundedRect(marginX, y, halfW, partyBoxH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...AUTEC_NAVY);
  doc.text('PROPONENTE', marginX + 3.5, y + 5.5);

  doc.setFontSize(9);
  doc.setTextColor(...AUTEC_DARK);
  doc.text('Autec Instrumentos Científicos', marginX + 3.5, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...SLATE_TEXT);
  doc.text(sanitizePdfText(`Consultor: ${options.consultant.name}`), marginX + 3.5, y + 15.5, { maxWidth: halfW - 7 });
  doc.text(sanitizePdfText(options.consultant.role), marginX + 3.5, y + 19.8, { maxWidth: halfW - 7 });
  doc.text(sanitizePdfText(`E-mail: ${options.consultant.email}`), marginX + 3.5, y + 24.1, { maxWidth: halfW - 7 });
  doc.text(sanitizePdfText(`Tel: ${options.consultant.phone} | autec.com.br`), marginX + 3.5, y + 28.2, { maxWidth: halfW - 7 });

  // Cliente Destinatário
  const rightX = marginX + halfW + boxGap;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER_GRAY);
  doc.roundedRect(rightX, y, halfW, partyBoxH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...AUTEC_NAVY);
  doc.text('CLIENTE / DESTINATÁRIO', rightX + 3.5, y + 5.5);

  doc.setFontSize(9);
  doc.setTextColor(...AUTEC_DARK);
  doc.text(sanitizePdfText(options.client.company), rightX + 3.5, y + 10.5, { maxWidth: halfW - 7 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...SLATE_TEXT);
  const contactFull = options.client.contactRole
    ? `${options.client.contactName} (${options.client.contactRole})`
    : options.client.contactName;
  doc.text(sanitizePdfText(`A/C: ${contactFull}`), rightX + 3.5, y + 15.5, { maxWidth: halfW - 7 });
  doc.text(
    sanitizePdfText(`CNPJ: ${options.client.cnpj?.trim() || 'A informar no faturamento'}`),
    rightX + 3.5,
    y + 19.8,
    { maxWidth: halfW - 7 }
  );
  doc.text(
    sanitizePdfText(`E-mail: ${options.client.email?.trim() || '-'}`),
    rightX + 3.5,
    y + 24.1,
    { maxWidth: halfW - 7 }
  );
  doc.text(
    sanitizePdfText(`Localidade: ${options.client.city?.trim() || 'Brasil'}`),
    rightX + 3.5,
    y + 28.2,
    { maxWidth: halfW - 7 }
  );

  y += partyBoxH + 6;

  // 2. Resumo Executivo (opcional)
  if (options.includeExecutiveSummary && options.executiveSummary.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...AUTEC_NAVY);
    doc.text('1. RESUMO EXECUTIVO & OBJETIVO TÉCNICO', marginX, y);
    y += 2.5;

    const cleanSummary = sanitizePdfText(options.executiveSummary);
    const wrappedLines = doc.splitTextToSize(cleanSummary, contentW - 8) as string[];
    const summaryH = Math.max(14, wrappedLines.length * 4.1 + 6);

    doc.setFillColor(...SLATE_BG);
    doc.setDrawColor(...BORDER_GRAY);
    doc.roundedRect(marginX, y, contentW, summaryH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(...SLATE_TEXT);
    doc.text(wrappedLines, marginX + 4, y + 5.5);

    y += summaryH + 6;
  }

  // 3. Planilha Orçamentária de Produtos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...AUTEC_NAVY);
  doc.text(
    options.includeExecutiveSummary
      ? '2. ESCOPO DE FORNECIMENTO E INVESTIMENTO'
      : '1. ESCOPO DE FORNECIMENTO E INVESTIMENTO',
    marginX,
    y
  );
  y += 2.5;

  let grossTotal = 0;
  let netTotal = 0;

  const tableBody = options.items.map((item, idx) => {
    const grossLine = item.quantity * item.unitPrice;
    const netLine = grossLine * (1 - item.discountPct / 100);
    grossTotal += grossLine;
    netTotal += netLine;

    const descParts = [
      `${item.equipment.nome_equipamento} (${item.equipment.fabricante})`,
      item.equipment.categoria,
    ];
    if (item.configurationNote?.trim()) {
      descParts.push(`Obs: ${item.configurationNote.trim()}`);
    }

    return [
      String(idx + 1).padStart(2, '0'),
      sanitizePdfText(descParts.join('\n')),
      sanitizePdfText(item.equipment.normas_atendidas),
      String(item.quantity),
      formatBRLPdf(item.unitPrice),
      item.discountPct > 0 ? `${item.discountPct}%` : '-',
      formatBRLPdf(netLine),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX, bottom: 20 },
    head: [['Item', 'Equipamento / Linha', 'Normas & Conformidade', 'Qtd', 'Unitário', 'Desc.', 'Subtotal']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: AUTEC_NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
      cellPadding: 2.5,
    },
    styles: {
      font: 'helvetica',
      fontSize: 7.8,
      cellPadding: 2.5,
      lineColor: BORDER_GRAY,
      lineWidth: 0.2,
      textColor: SLATE_TEXT,
      valign: 'top',
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: SLATE_BG,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 58, fontStyle: 'bold', textColor: AUTEC_DARK },
      2: { cellWidth: 38 },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: AUTEC_NAVY },
    },
  });

  const lastTableY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y + 30;
  y = lastTableY + 4;

  // Totais financeiros
  const totalDiscount = Math.max(0, grossTotal - netTotal);
  const summaryBoxW = 76;
  const summaryBoxX = pageWidth - marginX - summaryBoxW;
  const totalsBoxH = totalDiscount > 0 ? 22 : 15;

  if (y + totalsBoxH > pageHeight - 20) {
    doc.addPage();
    y = 18;
  }

  doc.setFillColor(...SLATE_BG);
  doc.setDrawColor(...BORDER_GRAY);
  doc.roundedRect(summaryBoxX, y, summaryBoxW, totalsBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_TEXT);
  if (totalDiscount > 0) {
    doc.text('Subtotal Bruto:', summaryBoxX + 3.5, y + 5.5);
    doc.text(formatBRLPdf(grossTotal), summaryBoxX + summaryBoxW - 3.5, y + 5.5, { align: 'right' });

    doc.setTextColor(4, 120, 87);
    doc.text('Desconto Comercial:', summaryBoxX + 3.5, y + 10.5);
    doc.text(`- ${formatBRLPdf(totalDiscount)}`, summaryBoxX + summaryBoxW - 3.5, y + 10.5, { align: 'right' });
  }

  const totalLineY = totalDiscount > 0 ? y + 17.5 : y + 9.8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...AUTEC_NAVY);
  doc.text('TOTAL DA PROPOSTA:', summaryBoxX + 3.5, totalLineY);
  doc.text(formatBRLPdf(netTotal), summaryBoxX + summaryBoxW - 3.5, totalLineY, { align: 'right' });

  y += totalsBoxH + 8;

  // 4. Especificações Técnicas & ROI (com imagens reais)
  if (options.includeTechnicalSpecs && options.items.length > 0) {
    const imageUrls = await Promise.all(options.items.map((it) => loadImageAsDataUrl(it.equipment.image)));

    if (y + 38 > pageHeight - 20) {
      doc.addPage();
      y = 18;
    }

    const sectionNum = options.includeExecutiveSummary ? '3' : '2';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...AUTEC_NAVY);
    doc.text(`${sectionNum}. ESPECIFICAÇÕES TÉCNICAS, APLICAÇÃO & ROI`, marginX, y);
    y += 4;

    for (let i = 0; i < options.items.length; i += 1) {
      const { equipment } = options.items[i];
      const imgData = imageUrls[i];
      const textStartX = imgData ? marginX + 27 : marginX + 4;
      const textMaxW = imgData ? contentW - 31 : contentW - 8;

      const appLines = doc.splitTextToSize(
        sanitizePdfText(`Aplicação: ${equipment.aplicacao_laboratorial}`),
        textMaxW
      ) as string[];
      const roiLines = doc.splitTextToSize(
        sanitizePdfText(`ROI & Diferencial: ${equipment.roi_estimado}`),
        textMaxW
      ) as string[];
      const cardH = Math.max(26, 11 + appLines.length * 3.7 + roiLines.length * 3.7 + 4);

      if (y + cardH > pageHeight - 20) {
        doc.addPage();
        y = 18;
      }

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...BORDER_GRAY);
      doc.roundedRect(marginX, y, contentW, cardH, 1.5, 1.5, 'FD');

      if (imgData) {
        try {
          doc.addImage(imgData, 'JPEG', marginX + 3, y + 3, 20, 20, undefined, 'FAST');
        } catch {
          // ignore drawing error
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(...AUTEC_NAVY);
      doc.text(
        sanitizePdfText(`${equipment.nome_equipamento} · ${equipment.fabricante}`),
        textStartX,
        y + 6,
        { maxWidth: textMaxW }
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      doc.setTextColor(...SLATE_TEXT);
      doc.text(appLines, textStartX, y + 10.5);

      const roiY = y + 11.5 + appLines.length * 3.7;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text(roiLines, textStartX, roiY);

      y += cardH + 3.5;
    }

    y += 4;
  }

  // 5. Condições Comerciais & Aceite Formal
  const termsSectionNum = options.includeExecutiveSummary
    ? options.includeTechnicalSpecs
      ? '4'
      : '3'
    : options.includeTechnicalSpecs
    ? '3'
    : '2';

  const condHeight = options.terms.notes?.trim() ? 42 : 34;
  if (y + condHeight + 28 > pageHeight - 18) {
    doc.addPage();
    y = 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...AUTEC_NAVY);
  doc.text(`${termsSectionNum}. CONDIÇÕES COMERCIAIS & GARANTIA`, marginX, y);
  y += 3;

  doc.setFillColor(...SLATE_BG);
  doc.setDrawColor(...BORDER_GRAY);
  doc.roundedRect(marginX, y, contentW, condHeight, 1.5, 1.5, 'FD');

  doc.setFontSize(7.9);
  const col1X = marginX + 4;
  const col2X = marginX + contentW / 2 + 2;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...AUTEC_DARK);
  doc.text('Validade da Proposta:', col1X, y + 6);
  doc.text('Condição de Pagamento:', col1X, y + 13);
  doc.text('Garantia & Suporte:', col1X, y + 20);

  doc.text('Prazo de Entrega:', col2X, y + 6);
  doc.text('Modalidade / Frete:', col2X, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_TEXT);
  doc.text(sanitizePdfText(`${options.validityDays} dias (até ${options.validUntilDisplay})`), col1X + 36, y + 6);
  doc.text(sanitizePdfText(options.terms.paymentTerms), col1X + 36, y + 13, { maxWidth: contentW / 2 - 40 });
  doc.text(sanitizePdfText(options.terms.warranty), col1X + 36, y + 20, { maxWidth: contentW - 44 });

  doc.text(sanitizePdfText(options.terms.deliveryTime), col2X + 30, y + 6, { maxWidth: contentW / 2 - 34 });
  doc.text(sanitizePdfText(options.terms.freight), col2X + 30, y + 13, { maxWidth: contentW / 2 - 34 });

  if (options.terms.notes?.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...AUTEC_DARK);
    doc.text('Observações:', col1X, y + 29);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_TEXT);
    doc.text(sanitizePdfText(options.terms.notes), col1X + 24, y + 29, { maxWidth: contentW - 30 });
  }

  y += condHeight + 14;

  // Bloco de Assinatura / Aceite
  const sigW = (contentW - 14) / 2;
  doc.setDrawColor(...SLATE_MUTED);
  doc.line(marginX, y + 8, marginX + sigW, y + 8);
  doc.line(marginX + sigW + 14, y + 8, marginX + sigW * 2 + 14, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...AUTEC_DARK);
  doc.text(sanitizePdfText(options.consultant.name), marginX, y + 12.5);
  doc.text(sanitizePdfText(`De acordo: ${options.client.company}`), marginX + sigW + 14, y + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...SLATE_MUTED);
  doc.text('Autec Instrumentos Científicos', marginX, y + 16.5);
  doc.text('Assinatura / Carimbo / Data de Aprovação', marginX + sigW + 14, y + 16.5);

  drawFooters(doc, `Proposta Comercial ${options.proposalNumber}`);

  const slugCompany = options.client.company
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 28);
  const filename = `Proposta_${options.proposalNumber}_${slugCompany || 'Cliente'}_${fileStamp}.pdf`;
  doc.save(filename);
  return filename;
}

