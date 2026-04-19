import type { ManagerProfileDefinition } from "@/domain/models/core";

export const MANAGER_PROFILE_CODES = [
  "NEGOCIADOR",
  "ESTRATEGISTA",
  "ENGENHEIRO",
  "VISIONARIO",
  "FORMADOR",
  "COMERCIAL",
  "MOTIVADOR",
  "DIRETOR_GLOBAL",
] as const;

export const MANAGER_PROFILES: ManagerProfileDefinition[] = [
  {
    code: "NEGOCIADOR",
    name: "Negociador",
    style: "Maximiza contratos e reduz custos de acordos.",
    bonuses: ["+8% valor de patrocínio", "+6% desconto em contratos"],
    penalties: ["-4% eficiência de P&D"],
  },
  {
    code: "ESTRATEGISTA",
    name: "Estrategista",
    style: "Leitura de corrida e decisões de pit wall mais seguras.",
    bonuses: ["+7% decisões de estratégia", "+4% economia de pneus"],
    penalties: ["-4% apelo comercial"],
  },
  {
    code: "ENGENHEIRO",
    name: "Engenheiro",
    style: "Extrai mais performance técnica e teto de desenvolvimento.",
    bonuses: ["+8% ganho de upgrade", "+5% confiabilidade mecânica"],
    penalties: ["-5% atratividade para pilotos estrela"],
  },
  {
    code: "VISIONARIO",
    name: "Visionário",
    style: "Constrói estrutura de longo prazo e cultura vencedora.",
    bonuses: ["+6% evolução de facilities", "+4% reputação sazonal"],
    penalties: ["-3% performance imediata"],
  },
  {
    code: "FORMADOR",
    name: "Formador",
    style: "Transforma academia em fonte de talentos.",
    bonuses: ["+10% desenvolvimento de jovens", "+6% valor de academia"],
    penalties: ["-4% ritmo médio no curto prazo"],
  },
  {
    code: "COMERCIAL",
    name: "Comercial",
    style: "Marca forte e retorno financeiro acima da média.",
    bonuses: ["+9% merchandising", "+7% retenção de patrocinadores"],
    penalties: ["-4% eficácia de setup"],
  },
  {
    code: "MOTIVADOR",
    name: "Motivador",
    style: "Alta moral de equipe em ambientes de pressão.",
    bonuses: ["+8 moral de pilotos/staff", "-8% chance de erro humano"],
    penalties: ["-3% precisão de scouting"],
  },
  {
    code: "DIRETOR_GLOBAL",
    name: "Diretor Global",
    style: "Sinergia entre programas esportivos multi-categoria.",
    bonuses: ["+6% ganhos em transferências", "+5% sinergia entre categorias"],
    penalties: ["-3% foco operacional"],
  },
];
