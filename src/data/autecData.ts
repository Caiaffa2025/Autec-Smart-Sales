import { EQUIPMENT_CATALOG, type EquipmentItem } from './autecCatalog';

export { EQUIPMENT_CATALOG, type EquipmentItem };

export type ResistanceType = 'Preço' | 'Concorrência' | 'Dúvida Técnica' | 'Prazo';

export interface ObjectionEntry {
  id: string;
  objecao_comum: string;
  tipo_resistencia: ResistanceType;
  equipamento_relacionado: string;
  argumento_tecnico: string;
  analogia_venda: string;
  pergunta_poder: string;
  conteudo_suporte: string;
}

export interface LabProfile {
  id: string;
  perfil: string;
  setor: string;
  dores_especificas: string;
  normas_criticas: string;
  equipamentos_chave: string[];
}

export interface SellerMetric {
  id: string;
  nome: string;
  cargo: string;
  faturamento: number;
  meta: number;
  vendas: number;
  propostas: number;
  interacoes: number;
  taxa_conversao: number;
  classificacao: 'Elite' | 'Alta Performance' | 'Em Evolução';
  objecao_superada: ResistanceType;
}

export interface CompetitorRadarItem {
  marca: string;
  equipamento_autec: string;
  citacoes_semana: number;
  taxa_vitoria_autec: number;
  principal_argumento_vencedor: string;
}

export interface QuizQuestion {
  id: string;
  cenario: string;
  equipamento: string;
  resistencia: ResistanceType;
  opcoes: string[];
  correta: number;
  explicacao: string;
}

export const HERO_IMAGE = '/src/assets/images/hero_lab_engine_1794850990640.jpg';

export const OBJECTION_LIBRARY: ObjectionEntry[] = [
  {
    id: 'obj-preco-phoenix',
    objecao_comum:
      'O forno mufla por micro-ondas CEM Phoenix BLACK tem investimento inicial superior ao de uma mufla resistiva convencional.',
    tipo_resistencia: 'Preço',
    equipamento_relacionado: 'Phoenix BLACK',
    argumento_tecnico:
      'O CEM Phoenix BLACK reduz o tempo de calcinação em até 97%, incinerando até 15 amostras simultaneamente dentro dos métodos AOAC, FDA, ISO, DIN, USP 281 (ROI) e USP 733 (LOI). A liberação acelerada de lotes e a redução drástica do consumo elétrico pagam a diferença de investimento em poucos meses.',
    analogia_venda:
      'Comparar uma mufla convencional de 4 horas por ciclo com o Phoenix BLACK é como comparar transporte rodoviário lento com frete expresso — o custo parado de laboratório esperando resultado vale muito mais que a diferença do equipamento.',
    pergunta_poder:
      'Se comprovarmos quantos dias por mês a sua equipe de CQ economiza reduzindo a calcinação em até 97% mantendo aderência total à USP 281/733, faz sentido revisarmos o ROI com Compras hoje?',
    conteudo_suporte: 'Comparativo de ciclo térmico Phoenix BLACK vs. mufla convencional + nota USP 281 / USP 733.',
  },
  {
    id: 'obj-concorrencia-camag',
    objecao_comum:
      'Nosso laboratório de controle de qualidade só utiliza HPLC convencional e teme mudar a rotina para HPTLC PRO da CAMAG.',
    tipo_resistencia: 'Concorrência',
    equipamento_relacionado: 'HPTLC PRO',
    argumento_tecnico:
      'O sistema CAMAG HPTLC PRO automatiza aplicação, desenvolvimento e detecção com software visionCATS compatível com 21 CFR Part 11, USP <203> e Ph. Eur. 2.8.25, analisando múltiplas amostras em paralelo com até 70% menos consumo de solventes do que o HPLC em triagens e botânicos.',
    analogia_venda:
      'Enquanto o HPLC analisa uma amostra por vez em fila sequencial, o HPTLC PRO funciona como uma via expressa multipista: todas as amostras correm juntas na mesma placa com rastreabilidade auditável.',
    pergunta_poder:
      'Se rodarmos um estudo paralelo com sua equipe mostrando a economia de solvente e o cumprimento integral da 21 CFR Part 11, qual matriz entraria primeiro na validação?',
    conteudo_suporte: 'Dossiê técnico CAMAG HPTLC PRO + protocolo visionCATS 21 CFR Part 11.',
  },
  {
    id: 'obj-tecnica-v10',
    objecao_comum:
      'Temos receio de perda de amostra ou bumping ao evaporar solventes de alto ponto de ebulição como DMSO e DMF.',
    tipo_resistencia: 'Dúvida Técnica',
    equipamento_relacionado: 'Biotage® V-10 Touch',
    argumento_tecnico:
      'O Biotage® V-10 Touch evapora solventes diretamente de frascos de síntese com tecnologia de vórtice em três vias e controle térmico preciso, evitando projeções (bumping) e degradação, entregando até 4,5x mais velocidade do que evaporadores rotativos tradicionais.',
    analogia_venda:
      'Enquanto um evaporador comum aquece o banho inteiro às cegas, o V-10 Touch entrega energia controlada diretamente ao frasco em alta rotação de filme fino, protegendo moléculas sensíveis.',
    pergunta_poder:
      'Se agendarmos uma demonstração com duas amostras reais de DMSO da sua bancada esta semana para comprovar a recuperação, isso destrava a aprovação técnica?',
    conteudo_suporte: 'Nota de aplicação Biotage® V-10 Touch para DMSO/DMF + ficha técnica oficial Autec.',
  },
  {
    id: 'obj-prazo-vici',
    objecao_comum:
      'Dependemos de cilindros de gás para LC-MS/MS e GC-FID e tememos parar o laboratório durante a transição para geradores.',
    tipo_resistencia: 'Prazo',
    equipamento_relacionado: 'Geradores de Nitrogênio',
    argumento_tecnico:
      'Os geradores VICI DBS (Nitrogênio, Hidrogênio e Ar Zero) são dimensionados e comissionados pela engenharia Autec no Brasil sem interromper sua rotina analítica, eliminando aluguel de cilindros, risco de NR-13 e oscilações de pureza com payback típico entre 9 e 12 meses.',
    analogia_venda:
      'Manter cilindros alugados é como pagar frete diário de água mineral quando se pode instalar uma estação própria de purificação contínua sob a bancada.',
    pergunta_poder:
      'Se fecharmos o cronograma de instalação em paralelo ao seu abastecimento atual para zero parada do LC-MS/MS, podemos avançar com a proposta esta semana?',
    conteudo_suporte: 'Estudo de payback VICI DBS vs. cilindros + plano de comissionamento local Autec.',
  },
];

export const LAB_PROFILES: LabProfile[] = [
  {
    id: 'prof-farma-cq',
    perfil: 'Controle de Qualidade Farmacêutico & Cosméticos',
    setor: 'Indústria Farmacêutica · Fitoterápicos · Cosméticos',
    dores_especificas:
      'Pressão por conformidade em auditorias ANVISA/FDA (21 CFR Part 11), atrasos na liberação de lotes, alto custo de solventes e tempo elevado em calcinação/digestão.',
    normas_criticas: '21 CFR Part 11 · USP <203>/<281>/<733> · ANVISA · Ph. Eur.',
    equipamentos_chave: ['HPTLC PRO', 'Phoenix BLACK', 'MARS 6', 'LUMiSizer'],
  },
  {
    id: 'prof-pd-sintese',
    perfil: 'Laboratório de P&D, Síntese Orgânica e Peptídeos',
    setor: 'Química Medicinal · Fármacos · Biotecnologia',
    dores_especificas:
      'Ciclos lentos de síntese peptídica, gargalo na evaporação de DMSO/DMF, purificação preparativa ineficiente e dificuldade de escalonamento de batelada para fluxo contínuo.',
    normas_criticas: 'GMP Piloto · BPL · Escalonamento Seguro',
    equipamentos_chave: ['Liberty Blue 2.0', 'Biotage® V-10 Touch', 'puriFlash-5400', 'Syrris Asia – Plataforma de Química em Fluxo Contínuo'],
  },
  {
    id: 'prof-alimentos-agro',
    perfil: 'Alimentos, Bebidas, Agroquímica e Micotoxinas',
    setor: 'Controle Alimentar · Agronegócio · Análises Rápidas',
    dores_especificas:
      'Métodos lentos como Kjeldahl e Soxhlet, determinação de gordura e umidade em linha, detecção rigorosa de micotoxinas e estabilidade de emulsões/dispersões.',
    normas_criticas: 'AOAC · ANVISA RDC 722 · MAPA · ISO 17025',
    equipamentos_chave: ['Oracle', 'Sprint', 'SMART 6', 'EDGE', 'Colunas de Imunoafinidade para análise de Micotoxinas', 'LUMiFlector'],
  },
  {
    id: 'prof-central-analitica',
    perfil: 'Central Analítica & Engenharia de Processos',
    setor: 'Química Fina · Petroquímica · Papel e Celulose',
    dores_especificas:
      'Custo recorrente de cilindros de gás ultra-puro para GC/LC-MS, preparo manual de amostras (SPE/PPT) sujeito a erros e falta de controle automatizado em reatores.',
    normas_criticas: 'ISO 8573-1 · ISO/TR 13097 · ASME / PED',
    equipamentos_chave: ['Geradores de Nitrogênio', 'Estação de Gás FID', 'Biotage® Extrahera™', 'Syrris Atlas HD – Sistema Automatizado de Reatores'],
  },
];

export const SELLER_RANKING: SellerMetric[] = [
  {
    id: 'v1',
    nome: 'Rafael Mendonça',
    cargo: 'Consultor Técnico Sênior — Farma & Síntese SP',
    faturamento: 684000,
    meta: 600000,
    vendas: 9,
    propostas: 14,
    interacoes: 42,
    taxa_conversao: 64.3,
    classificacao: 'Elite',
    objecao_superada: 'Preço',
  },
  {
    id: 'v2',
    nome: 'Camila Duarte',
    cargo: 'Especialista de Aplicações — CAMAG & LUM',
    faturamento: 542000,
    meta: 500000,
    vendas: 7,
    propostas: 12,
    interacoes: 36,
    taxa_conversao: 58.3,
    classificacao: 'Elite',
    objecao_superada: 'Concorrência',
  },
  {
    id: 'v3',
    nome: 'Lucas Albuquerque',
    cargo: 'Executivo de Contas — CEM & Syrris',
    faturamento: 418000,
    meta: 450000,
    vendas: 6,
    propostas: 13,
    interacoes: 31,
    taxa_conversao: 46.2,
    classificacao: 'Alta Performance',
    objecao_superada: 'Dúvida Técnica',
  },
  {
    id: 'v4',
    nome: 'Marina Vasconcelos',
    cargo: 'Consultora Comercial — Biotage & VICI DBS',
    faturamento: 325000,
    meta: 400000,
    vendas: 4,
    propostas: 10,
    interacoes: 27,
    taxa_conversao: 40.0,
    classificacao: 'Em Evolução',
    objecao_superada: 'Prazo',
  },
];

export const COMPETITOR_RADAR: CompetitorRadarItem[] = [
  {
    marca: 'Anton Paar / Milestone',
    equipamento_autec: 'CEM MARS 6 / BLADE / Phoenix BLACK',
    citacoes_semana: 14,
    taxa_vitoria_autec: 68,
    principal_argumento_vencedor: 'Redução de até 97% no tempo de calcinação (Phoenix BLACK) e digestão sequencial automatizada (BLADE)',
  },
  {
    marca: 'Teledyne ISCO / Büchi Pure',
    equipamento_autec: 'Biotage® Selekt Systems / puriFlash-5400',
    citacoes_semana: 11,
    taxa_vitoria_autec: 72,
    principal_argumento_vencedor: 'Transferência direta de método analítico para preparativo e menor gasto de solventes',
  },
  {
    marca: 'Cilindros de Gás / Peak Scientific',
    equipamento_autec: 'VICI DBS Geradores de Nitrogênio & Hidrogênio',
    citacoes_semana: 9,
    taxa_vitoria_autec: 74,
    principal_argumento_vencedor: 'Payback em 9–12 meses eliminando cilindros e assistência técnica Autec no Brasil',
  },
  {
    marca: 'IKA / Radleys / Vapourtec',
    equipamento_autec: 'Syrris ORB / Atlas HD / Asia Flow Chemistry',
    citacoes_semana: 7,
    taxa_vitoria_autec: 76,
    principal_argumento_vencedor: 'Modularidade completa da bancada ao escalonamento ORB Pilot com automação integrada',
  },
];

export const WEEKLY_OBJECTIONS_DIST: { tipo: ResistanceType; quantidade: number; avancos: number }[] = [
  { tipo: 'Preço', quantidade: 24, avancos: 17 },
  { tipo: 'Concorrência', quantidade: 18, avancos: 13 },
  { tipo: 'Dúvida Técnica', quantidade: 15, avancos: 13 },
  { tipo: 'Prazo', quantidade: 9, avancos: 7 },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    cenario:
      'Um laboratório farmacêutico questiona por que investir no forno mufla por micro-ondas CEM Phoenix BLACK em vez de uma mufla elétrica convencional mais barata.',
    equipamento: 'Phoenix BLACK',
    resistencia: 'Preço',
    opcoes: [
      'Conceder desconto imediato sem abordar o tempo de ciclo.',
      'Mostrar que o Phoenix BLACK reduz o tempo de calcinação em até 97%, processa até 15 amostras simultâneas e atende USP 281 (ROI) e USP 733 (LOI), pagando a diferença na liberação de lotes.',
      'Sugerir que o cliente terceirize todas as calcinações.',
      'Enviar apenas a ficha do produto sem contextualizar ROI.',
    ],
    correta: 1,
    explicacao:
      'O Phoenix BLACK entrega ganho de até 97% no tempo de calcinação e atende integralmente USP 281, USP 733, AOAC, FDA e ISO.',
  },
  {
    id: 'q2',
    cenario:
      'Um gerente de alimentos precisa medir teor de gordura sem desenvolvimento demorado de método ou uso intensivo de solventes orgânicos.',
    equipamento: 'Oracle',
    resistencia: 'Dúvida Técnica',
    opcoes: [
      'Indicar o método tradicional Soxhlet manual.',
      'Posicionar o CEM ORACLE™ por tecnologia TD-NMR, que determina teor de gordura com precisão em matrizes complexas sem desenvolvimento de método nem calibração específica.',
      'Sugerir um gerador de ar zero.',
      'Oferecer apenas filtros de seringa.',
    ],
    correta: 1,
    explicacao:
      'O CEM ORACLE™ utiliza tecnologia TD-NMR para determinação rápida de gordura em alimentos e matrizes complexas sem exigir desenvolvimento de método.',
  },
  {
    id: 'q3',
    cenario:
      'Uma equipe de formulação cosmética sofre aguardando meses em estufa para descobrir se uma nova emulsão sofre separação de fases.',
    equipamento: 'LUMiSizer',
    resistencia: 'Concorrência',
    opcoes: [
      'Explicar que o LUMiSizer realiza análise acelerada de estabilidade de dispersões (STEP-Technology), prevendo vida útil e separação de fases 10x a 50x mais rápido.',
      'Recomendar apenas agitação manual diária.',
      'Sugerir um evaporador de solventes no lugar do analisador.',
      'Aguardar 12 meses de teste de prateleira antes de lançar o produto.',
    ],
    correta: 0,
    explicacao:
      'Os analisadores LUM (LUMiSizer / LUMiFuge) aceleram a detecção de sedimentação, cremagem e floculação em horas ao invés de meses.',
  },
];

export interface PlatformFeatureSpec {
  id: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  objetivo: string;
  mecanismo: string;
  resultado: string;
  destaque?: boolean;
  workspaceTab: 'gerador' | 'chat' | 'comparativo' | 'painel' | 'base_conhecimento' | 'questionario';
}

export const PLATFORM_FEATURES: PlatformFeatureSpec[] = [
  {
    id: 'feat-argumento',
    numero: '01',
    titulo: 'Gerador de Argumento de Ouro & Follow-up',
    subtitulo: 'Inteligência de Negociação em Tempo Real',
    objetivo: 'Preparar o vendedor antes da reunião ou destravar uma objeção complexa durante a negociação.',
    mecanismo:
      'O vendedor escolhe qualquer um dos 93 equipamentos oficiais da Autec, seleciona o tipo de resistência (Preço, Concorrência, Dúvida Técnica ou Prazo) e o contexto da call. A IA gera Argumento de Ouro, Conteúdo de Suporte, Pergunta de Poder e E-mail de Follow-up.',
    resultado: 'Resposta pronta para falar ou copiar em ~2,4 segundos, mantendo rigor científico e padronização de discurso.',
    destaque: true,
    workspaceTab: 'gerador',
  },
  {
    id: 'feat-chat',
    numero: '02',
    titulo: 'Chat Técnico de Equipamentos (RAG)',
    subtitulo: 'Engenheiro de Aplicação Digital 24/7',
    objetivo: 'Responder dúvidas técnicas sobre normas, aplicações e linhas CAMAG, Biotage, CEM, Syrris, VICI DBS, LUM, Biocomma e Advion Interchim.',
    mecanismo:
      'Assistente conversacional ancorado exclusivamente nos 93 itens do catálogo oficial da Autec e suas normas (21 CFR Part 11, USP, AOAC, ANVISA, ISO).',
    resultado: 'Elimina respostas genéricas e acelera o preparo técnico de vendedores recém-integrados ou em campo.',
    workspaceTab: 'chat',
  },
  {
    id: 'feat-comparativo',
    numero: '03',
    titulo: 'Comparativo Técnico Lado a Lado',
    subtitulo: 'Posicionamento Competitivo Baseado em TCO e Normas',
    objetivo: 'Sustentar tecnicamente propostas diante de comitês de compras e gerentes de laboratório.',
    mecanismo:
      'Matriz interativa pesquisável em todo o portfólio de 93 produtos, exibindo fabricante, aplicação, normas atendidas, ROI estimado e concorrentes diretos.',
    resultado: 'Desloca a conversa de preço unitário para retorno sobre investimento (ROI) e confiabilidade operacional.',
    workspaceTab: 'comparativo',
  },
  {
    id: 'feat-radar',
    numero: '04',
    titulo: 'Painel Comercial, Cockpit & Radar do Gestor',
    subtitulo: 'Gestão Estratégica Baseada em Evidências de Campo',
    objetivo: 'Dar visibilidade semanal ao gestor sobre faturamento, metas, classificação de vendedores e o que trava ou acelera o funil.',
    mecanismo:
      'Cada interação registrada persiste objeção, concorrente citado e avanço de funil, alimentando Painel, Histórico, Cockpit, Ranking, Gestão de Metas e Painel do Gestor.',
    resultado: 'Decisões comerciais orientadas por dados reais de mercado e replicação do playbook dos vendedores de elite.',
    destaque: true,
    workspaceTab: 'painel',
  },
  {
    id: 'feat-kb',
    numero: '05',
    titulo: 'Base de Conhecimento Viva & Perfis de Laboratório',
    subtitulo: 'Repositório Unificado dos 93 Equipamentos e Objeções',
    objetivo: 'Centralizar especificações oficiais de autec.com.br/produtos/, analogias de venda e dores por perfil de laboratório.',
    mecanismo:
      'Base estruturada e pesquisável conectando Produtos (8 representadas globais), Biblioteca de Objeções e Perfis de Laboratório.',
    resultado: 'Toda a força de vendas fala a mesma língua técnica, do júnior ao consultor sênior.',
    workspaceTab: 'base_conhecimento',
  },
  {
    id: 'feat-quiz',
    numero: '06',
    titulo: 'Questionário Comercial & Capacitação Contínua',
    subtitulo: 'Treinamento Prático em Cenários Reais de Campo',
    objetivo: 'Nivelar o domínio técnico e consultivo da equipe antes de reuniões decisivas.',
    mecanismo:
      'Simulações de objeções reais de clientes (Phoenix BLACK, ORACLE™, LUMiSizer) com feedback técnico imediato.',
    resultado: 'Reduz o tempo de ramp-up de novos vendedores e aumenta a taxa de conversão em contas complexas.',
    workspaceTab: 'questionario',
  },
];

export interface TargetAudiencePersona {
  id: string;
  titulo: string;
  segmento: string;
  contexto_dor: string;
  como_usa: string;
  impacto_direto: string;
}

export const TARGET_AUDIENCE: TargetAudiencePersona[] = [
  {
    id: 'aud-vendedor',
    titulo: 'Consultores e Vendedores Técnicos de Campo',
    segmento: 'Força de Vendas B2B · Equipamentos Analíticos',
    contexto_dor:
      'Precisam dominar 93 equipamentos e consumíveis de 8 representadas internacionais (CAMAG, Biotage, CEM, Syrris, VICI DBS, LUM, Biocomma e Advion Interchim) frente a compradores técnicos exigentes.',
    como_usa:
      'Seleciona o equipamento ofertado, gera Argumentos de Ouro antes das reuniões, consulta o Chat Técnico em segundos e dispara e-mails de follow-up alinhados.',
    impacto_direto: 'Mais segurança em negociações técnicas e redução drástica do ciclo entre proposta e fechamento.',
  },
  {
    id: 'aud-gestor',
    titulo: 'Gestores e Diretores Comerciais',
    segmento: 'Liderança Comercial · Planejamento e Metas',
    contexto_dor:
      'Sofrem com falta de visibilidade sobre o real motivo de perda das propostas, baixa padronização de discurso entre vendedores e dados dispersos.',
    como_usa:
      'Monitora o Radar de Concorrência semanal, acompanha o ranking de objeções e ajusta metas com base na eficiência real do funil.',
    impacto_direto: 'Gestão orientada por evidências reais de campo, replicando os argumentos dos top performers.',
  },
  {
    id: 'aud-aplicacao',
    titulo: 'Especialistas de Produto e Engenharia de Aplicação',
    segmento: 'Suporte Científico · Pré e Pós-Venda',
    contexto_dor:
      'Perdem horas respondendo dúvidas repetitivas da equipe comercial sobre normas (USP, AOAC, 21 CFR Part 11, ISO) e diferenciais frente a concorrentes.',
    como_usa:
      'Mantém a Knowledge Base sincronizada com especificações, ROI, analogias de venda e perfis de laboratório.',
    impacto_direto: 'Libera a engenharia para projetos de alta complexidade e garante rigor científico em cada proposta.',
  },
  {
    id: 'aud-cliente',
    titulo: 'Laboratórios e Indústrias Atendidas (Benefício Indireto)',
    segmento: 'Farma · Química · Alimentos · P&D · Agroquímica',
    contexto_dor:
      'Precisam de equipamentos que garantam conformidade em auditorias, payback comprovado e garantia real de suporte técnico local no Brasil.',
    como_usa:
      'Recebem atendimento consultivo objetivo, comparativos claros de TCO e provas técnicas específicas para a dor do seu laboratório.',
    impacto_direto: 'Decisão de compra mais segura, menor risco regulatório e menor custo operacional ao longo da vida útil.',
  },
];

export interface TechDifferentiator {
  id: string;
  numero: string;
  titulo: string;
  arquitetura: string;
  explicacao: string;
  metrica: string;
}

export const TECH_DIFFERENTIATORS: TechDifferentiator[] = [
  {
    id: 'diff-rag',
    numero: '01',
    titulo: 'IA Generativa Ancorada no Catálogo Oficial Autec (RAG)',
    arquitetura: 'Retrieval-Augmented Generation · Zero Alucinação Normativa',
    explicacao:
      'Diferente de chats genéricos que inventam especificações, o motor consulta diretamente os 93 equipamentos oficiais de autec.com.br/produtos/ (CAMAG, Biotage, CEM, Syrris, VICI DBS, LUM, Biocomma e Advion Interchim) antes de sintetizar o argumento.',
    metrica: '93 linhas oficiais integradas em tempo real',
  },
  {
    id: 'diff-closed-loop',
    numero: '02',
    titulo: 'Motor de Inteligência Comercial em Ciclo Fechado (Closed-Loop)',
    arquitetura: 'Telemetria de Funil · Retroalimentação Contínua',
    explicacao:
      'Cada argumento gerado permite registrar o desfecho real da reunião (avanço no funil, motivo de estagnação e concorrente citado), alimentando automaticamente o Radar de Concorrência e o Painel do Gestor.',
    metrica: 'Radar semanal atualizado a cada interação registrada',
  },
  {
    id: 'diff-latency',
    numero: '03',
    titulo: 'Orquestração de Playbook em Sub-3 Segundos',
    arquitetura: 'Saída Estruturada Tripartida · Ação Imediata em Campo',
    explicacao:
      'Em vez de blocos longos difíceis de ler durante uma call, a engine estrutura a entrega em três peças acionáveis: Argumento de Ouro, Conteúdo de Suporte e Pergunta de Poder de fechamento.',
    metrica: '~2,4 segundos por geração completa',
  },
  {
    id: 'diff-tco',
    numero: '04',
    titulo: 'Tradução Automática de Especificação Técnica em ROI Financeiro',
    arquitetura: 'Conversor Técnico-Financeiro · Defesa contra Guerra de Preços',
    explicacao:
      'Conecta diferenciais de engenharia (calcinação 97% mais rápida no Phoenix BLACK, HPTLC com 70% menos solvente, eliminação de cilindros VICI DBS) ao retorno financeiro para vencer disputas de preço em Compras.',
    metrica: 'Até 97% de ganho de velocidade comprovado',
  },
];

export const SALES_CYCLE_STEPS = [
  {
    num: '01',
    titulo: 'Preparo da reunião',
    desc: 'O vendedor seleciona qualquer equipamento do portfólio oficial Autec, o perfil do laboratório e a resistência esperada para gerar o Argumento de Ouro antes mesmo da call.',
  },
  {
    num: '02',
    titulo: 'Durante a negociação',
    desc: 'Com o contexto real da reunião, a IA personaliza o argumento com ROI, normas atendidas e diferencial técnico — e entrega a Pergunta de Poder para conduzir o cliente ao fechamento.',
  },
  {
    num: '03',
    titulo: 'Follow-up comercial',
    desc: 'Com um clique, um e-mail comercial completo é gerado com tom adequado ao cliente, reforçando o argumento principal e a referência técnica do equipamento.',
  },
  {
    num: '04',
    titulo: 'Comparativo de equipamentos',
    desc: 'Ferramenta de comparativo técnico lado a lado entre os 93 itens do catálogo, permitindo posicionar a Autec contra concorrentes em ROI, normas e aplicações.',
  },
  {
    num: '05',
    titulo: 'Registro e inteligência',
    desc: 'Cada interação é persistida com tipo de resistência, concorrente citado e se avançou no funil — alimentando a base de aprendizado contínuo da empresa.',
  },
  {
    num: '06',
    titulo: 'Gestão estratégica',
    desc: 'Relatório semanal automático entregue ao gestor com ranking de objeções, concorrentes mais citados e KPI de eficiência do funil comercial.',
  },
];

export const OFFICIAL_CATALOG_COUNT = EQUIPMENT_CATALOG.length;
export const OFFICIAL_BRANDS = Array.from(new Set(EQUIPMENT_CATALOG.map((e) => e.fabricante))).sort();
export const OFFICIAL_CATEGORIES = Array.from(new Set(EQUIPMENT_CATALOG.map((e) => e.categoria))).sort();
export type { EquipmentItem as AutecEquipment };

export interface InteractionRecord {
  id: string;
  vendedor_nome: string;
  cliente: string;
  equipamento: string;
  resistencia: ResistanceType;
  concorrente_citado: string;
  avancou: boolean;
  motivo?: string;
  contexto?: string;
  data: string;
  semana: string;
}

export interface OpportunityRecord {
  id: string;
  cliente: string;
  produto: string;
  vendedor_nome: string;
  valor: number;
  status: 'ganha' | 'proposta_enviada' | 'em_negociacao' | 'perdida';
  motivo_perda?: string;
  previsao_fechamento: string;
  validade_proposta?: string;
}

export interface LeadRecord {
  id: string;
  empresa: string;
  contato: string;
  cargo: string;
  cidade: string;
  equipamento_interesse: string;
  origem: 'Site Autec' | 'Feira Analitica' | 'Indicação' | 'Inbound Técnico';
  responsavel: string;
  status: 'novo' | 'qualificado' | 'proposta';
  created_date: string;
}

export interface ActivityRecord {
  id: string;
  vendedor_nome: string;
  tipo: 'Reunião Técnica' | 'Follow-up' | 'Teste Assistido' | 'Demonstração';
  cliente: string;
  equipamento: string;
  status: 'realizada' | 'pendente';
  data: string;
}

export interface GoalRecord {
  id: string;
  escopo: 'coletiva' | 'individual';
  tipo: 'faturamento' | 'vendas' | 'propostas' | 'atividades' | 'followups';
  vendedor_nome?: string;
  periodo_mes: number;
  periodo_ano: number;
  valor_meta: number;
}

export interface CollaboratorRecord {
  id: string;
  full_name: string;
  email: string;
  cargo: string;
  telefone: string;
  cidade: string;
  role: 'admin' | 'gestor' | 'vendedor';
  ativo: boolean;
  created_date: string;
}

export const INITIAL_INTERACTIONS: InteractionRecord[] = [
  {
    id: 'int-1',
    vendedor_nome: 'Rafael Mendonça',
    cliente: 'Eurofarma Controle de Qualidade',
    equipamento: 'Phoenix BLACK',
    resistencia: 'Preço',
    concorrente_citado: 'Milestone / Mufla Convencional',
    avancou: true,
    contexto: 'Validação de calcinação USP 281 em 15 cadinhos simultâneos.',
    data: 'Hoje · 09:15',
    semana: 'Semana Atual',
  },
  {
    id: 'int-2',
    vendedor_nome: 'Camila Duarte',
    cliente: 'Aché Fitoterápicos P&D',
    equipamento: 'HPTLC PRO',
    resistencia: 'Concorrência',
    concorrente_citado: 'HPLC Convencional',
    avancou: true,
    contexto: 'Automação 21 CFR Part 11 com visionCATS e redução de 70% de solvente.',
    data: 'Ontem · 16:40',
    semana: 'Semana Atual',
  },
  {
    id: 'int-3',
    vendedor_nome: 'Lucas Albuquerque',
    cliente: 'Cristália Síntese Orgânica',
    equipamento: 'Biotage® V-10 Touch',
    resistencia: 'Dúvida Técnica',
    concorrente_citado: 'Büchi Syncore',
    avancou: true,
    contexto: 'Receio de bumping na evaporação de DMSO em frascos de síntese.',
    data: 'Ontem · 11:20',
    semana: 'Semana Atual',
  },
  {
    id: 'int-4',
    vendedor_nome: 'Marina Vasconcelos',
    cliente: 'LabClínico Central BH',
    equipamento: 'Geradores de Nitrogênio',
    resistencia: 'Prazo',
    concorrente_citado: 'Peak Scientific',
    avancou: true,
    contexto: 'Auditoria marcada para o próximo mês, comissionamento sem parar LC-MS.',
    data: '14/11 · 15:05',
    semana: 'Semana Atual',
  },
  {
    id: 'int-5',
    vendedor_nome: 'Rafael Mendonça',
    cliente: 'EMS Formulações Sólidas',
    equipamento: 'LUMiSizer',
    resistencia: 'Preço',
    concorrente_citado: 'Testes em Estufa Convencional',
    avancou: false,
    motivo: 'Orçamento congelado',
    contexto: 'Comitê de Capex postergou aquisição para próximo trimestre.',
    data: '13/11 · 10:30',
    semana: 'Semana Atual',
  },
  {
    id: 'int-6',
    vendedor_nome: 'Lucas Albuquerque',
    cliente: 'Oxiteno Engenharia Química',
    equipamento: 'Syrris ORB Pilot – Reator Jacketed para Escalonamento',
    resistencia: 'Dúvida Técnica',
    concorrente_citado: 'IKA / Büchi Glas Uster',
    avancou: true,
    contexto: 'Escalonamento seguro de batelada de 5 L a 50 L.',
    data: '11/11 · 14:15',
    semana: 'Semana Anterior',
  },
  {
    id: 'int-7',
    vendedor_nome: 'Camila Duarte',
    cliente: 'Cargill Alimentos Controle',
    equipamento: 'Oracle',
    resistencia: 'Concorrência',
    concorrente_citado: 'Soxhlet Tradicional',
    avancou: true,
    contexto: 'Determinação rápida de gordura por TD-NMR sem uso de solvente.',
    data: '10/11 · 09:50',
    semana: 'Semana Anterior',
  },
];

export const INITIAL_OPPORTUNITIES: OpportunityRecord[] = [
  {
    id: 'opp-1',
    cliente: 'Eurofarma Controle de Qualidade',
    produto: 'Phoenix BLACK',
    vendedor_nome: 'Rafael Mendonça',
    valor: 248000,
    status: 'ganha',
    previsao_fechamento: 'Nov/2026',
  },
  {
    id: 'opp-2',
    cliente: 'Aché Fitoterápicos P&D',
    produto: 'HPTLC PRO',
    vendedor_nome: 'Camila Duarte',
    valor: 385000,
    status: 'ganha',
    previsao_fechamento: 'Nov/2026',
  },
  {
    id: 'opp-3',
    cliente: 'Cristália Síntese Orgânica',
    produto: 'Biotage® V-10 Touch',
    vendedor_nome: 'Lucas Albuquerque',
    valor: 295000,
    status: 'proposta_enviada',
    previsao_fechamento: 'Nov/2026',
    validade_proposta: '2026-11-18',
  },
  {
    id: 'opp-4',
    cliente: 'Oxiteno Engenharia Química',
    produto: 'Syrris ORB Pilot – Reator Jacketed para Escalonamento',
    vendedor_nome: 'Lucas Albuquerque',
    valor: 420000,
    status: 'em_negociacao',
    previsao_fechamento: 'Dez/2026',
    validade_proposta: '2026-12-08',
  },
  {
    id: 'opp-5',
    cliente: 'LabClínico Central BH',
    produto: 'Geradores de Nitrogênio',
    vendedor_nome: 'Marina Vasconcelos',
    valor: 176000,
    status: 'ganha',
    previsao_fechamento: 'Nov/2026',
  },
  {
    id: 'opp-6',
    cliente: 'EMS Formulações Sólidas',
    produto: 'LUMiSizer',
    vendedor_nome: 'Rafael Mendonça',
    valor: 310000,
    status: 'perdida',
    motivo_perda: 'Orçamento Capex postergado para Q1',
    previsao_fechamento: 'Nov/2026',
  },
  {
    id: 'opp-7',
    cliente: 'Cargill Alimentos Controle',
    produto: 'Oracle',
    vendedor_nome: 'Camila Duarte',
    valor: 265000,
    status: 'proposta_enviada',
    previsao_fechamento: 'Nov/2026',
    validade_proposta: '2026-11-20',
  },
];

export const INITIAL_LEADS: LeadRecord[] = [
  {
    id: 'lead-1',
    empresa: 'Hypera Pharma — Controle de Qualidade',
    contato: 'Dra. Beatriz Nogueira',
    cargo: 'Gerente de CQ',
    cidade: 'Anápolis - GO',
    equipamento_interesse: 'HPTLC PRO',
    origem: 'Inbound Técnico',
    responsavel: 'Camila Duarte',
    status: 'novo',
    created_date: '2026-11-16',
  },
  {
    id: 'lead-2',
    empresa: 'Grupo Boticário — P&D Cosméticos',
    contato: 'Eng. Thiago Ferraz',
    cargo: 'Coordenador de Formulações',
    cidade: 'São José dos Pinhais - PR',
    equipamento_interesse: 'LUMiSizer',
    origem: 'Site Autec',
    responsavel: 'Rafael Mendonça',
    status: 'novo',
    created_date: '2026-11-15',
  },
  {
    id: 'lead-3',
    empresa: 'Instituto Butantan — Síntese Peptídica',
    contato: 'Dr. Henrique Prado',
    cargo: 'Pesquisador Sênior',
    cidade: 'São Paulo - SP',
    equipamento_interesse: 'Liberty Blue 2.0',
    origem: 'Feira Analitica',
    responsavel: 'Lucas Albuquerque',
    status: 'qualificado',
    created_date: '2026-11-12',
  },
  {
    id: 'lead-4',
    empresa: 'Braskem — Central Analítica',
    contato: 'Eng. Patrícia Lemos',
    cargo: 'Especialista Analítica',
    cidade: 'Camaçari - BA',
    equipamento_interesse: 'Geradores de Nitrogênio',
    origem: 'Indicação',
    responsavel: 'Marina Vasconcelos',
    status: 'proposta',
    created_date: '2026-11-04',
  },
];

export const INITIAL_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'act-1',
    vendedor_nome: 'Rafael Mendonça',
    tipo: 'Demonstração',
    cliente: 'Eurofarma Controle de Qualidade',
    equipamento: 'Phoenix BLACK',
    status: 'realizada',
    data: 'Hoje · 09:00',
  },
  {
    id: 'act-2',
    vendedor_nome: 'Camila Duarte',
    tipo: 'Follow-up',
    cliente: 'Cargill Alimentos Controle',
    equipamento: 'Oracle',
    status: 'pendente',
    data: 'Hoje · 16:00',
  },
  {
    id: 'act-3',
    vendedor_nome: 'Lucas Albuquerque',
    tipo: 'Teste Assistido',
    cliente: 'Cristália Síntese Orgânica',
    equipamento: 'Biotage® V-10 Touch',
    status: 'realizada',
    data: 'Ontem · 14:00',
  },
  {
    id: 'act-4',
    vendedor_nome: 'Marina Vasconcelos',
    tipo: 'Follow-up',
    cliente: 'LabClínico Central BH',
    equipamento: 'Geradores de Nitrogênio',
    status: 'pendente',
    data: 'Amanhã · 10:30',
  },
  {
    id: 'act-5',
    vendedor_nome: 'Rafael Mendonça',
    tipo: 'Reunião Técnica',
    cliente: 'Biolab Farmacêutica',
    equipamento: 'MARS 6',
    status: 'realizada',
    data: '13/11 · 15:00',
  },
];

export const INITIAL_GOALS: GoalRecord[] = [
  {
    id: 'goal-1',
    escopo: 'coletiva',
    tipo: 'faturamento',
    periodo_mes: 11,
    periodo_ano: 2026,
    valor_meta: 2000000,
  },
  {
    id: 'goal-2',
    escopo: 'individual',
    tipo: 'faturamento',
    vendedor_nome: 'Rafael Mendonça',
    periodo_mes: 11,
    periodo_ano: 2026,
    valor_meta: 600000,
  },
  {
    id: 'goal-3',
    escopo: 'individual',
    tipo: 'faturamento',
    vendedor_nome: 'Camila Duarte',
    periodo_mes: 11,
    periodo_ano: 2026,
    valor_meta: 500000,
  },
  {
    id: 'goal-4',
    escopo: 'coletiva',
    tipo: 'propostas',
    periodo_mes: 11,
    periodo_ano: 2026,
    valor_meta: 50,
  },
  {
    id: 'goal-5',
    escopo: 'individual',
    tipo: 'vendas',
    vendedor_nome: 'Lucas Albuquerque',
    periodo_mes: 11,
    periodo_ano: 2026,
    valor_meta: 8,
  },
];

export const INITIAL_COLLABORATORS: CollaboratorRecord[] = [
  {
    id: 'col-1',
    full_name: 'Sydney Caiaffa',
    email: 'gestao@autec.com.br',
    cargo: 'Diretor Comercial',
    telefone: '(11) 4311-6562',
    cidade: 'São Paulo - SP',
    role: 'admin',
    ativo: true,
    created_date: '2026-01-15',
  },
  {
    id: 'col-2',
    full_name: 'Rafael Mendonça',
    email: 'rafael.mendonca@autec.com.br',
    cargo: 'Consultor Técnico Sênior',
    telefone: '(11) 99142-3310',
    cidade: 'São Paulo - SP',
    role: 'vendedor',
    ativo: true,
    created_date: '2026-03-10',
  },
  {
    id: 'col-3',
    full_name: 'Camila Duarte',
    email: 'camila.duarte@autec.com.br',
    cargo: 'Especialista de Aplicações',
    telefone: '(19) 98210-4482',
    cidade: 'Campinas - SP',
    role: 'gestor',
    ativo: true,
    created_date: '2026-11-12',
  },
  {
    id: 'col-4',
    full_name: 'Lucas Albuquerque',
    email: 'lucas.albuquerque@autec.com.br',
    cargo: 'Executivo de Contas — Síntese & Química',
    telefone: '(21) 98755-1209',
    cidade: 'Rio de Janeiro - RJ',
    role: 'vendedor',
    ativo: true,
    created_date: '2026-11-14',
  },
  {
    id: 'col-5',
    full_name: 'Marina Vasconcelos',
    email: 'marina.vasconcelos@autec.com.br',
    cargo: 'Consultora Comercial — MG/CO',
    telefone: '(31) 99411-7840',
    cidade: 'Belo Horizonte - MG',
    role: 'vendedor',
    ativo: true,
    created_date: '2026-11-15',
  },
  {
    id: 'col-6',
    full_name: 'Eduardo Nogueira',
    email: 'eduardo.nogueira@autec.com.br',
    cargo: 'Engenheiro de Aplicação (CEM & Syrris)',
    telefone: '(11) 97430-9912',
    cidade: 'São Bernardo do Campo - SP',
    role: 'gestor',
    ativo: true,
    created_date: '2026-10-25',
  },
];

