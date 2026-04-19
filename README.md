# WORLD MOTORSPORT MANAGER

Base do manager global de automobilismo construída com foco em:

- Next.js App Router + TypeScript + Tailwind + shadcn/ui
- Prisma ORM com SQLite (pronto para migração PostgreSQL)
- Engine de simulação desacoplada da UI
- Arquitetura modular para evolução em múltiplos módulos
- Visual premium desktop-first com fallback assets seguro

## Stack

- Frontend: `Next.js`, `React`, `TypeScript`, `Tailwind`, `shadcn/ui`, `Framer Motion`, `Lucide`
- Estado: `Zustand`
- Forms/Validation: `React Hook Form`, `Zod`
- Dados: `Prisma` + `SQLite`
- Data viz: `Recharts`
- Tables: `TanStack Table`
- Testes: `Vitest` + `Playwright`

## Módulo 1 (entregue)

- Scaffold completo e estrutura modular
- Tema visual premium base + shell layout (side nav/top bar)
- Navegação para páginas centrais do jogo
- Helpers de bandeira e placeholders premium de assets
- Prisma schema inicial com entidades do ecossistema global
- Seed inicial coerente de categorias, regras, equipes, pilotos, fornecedores, patrocinadores e calendário
- Import layer para asset packs autorizados
- Base da simulation engine desacoplada e testável
- Smoke tests (Playwright) e testes de lógica (Vitest)

## Módulo 2 (entregue)

- Fluxo completo de `New Career` em `/career/new`
- Category Selection, Team Selection e My Team Creator em wizard de 4 etapas
- Perfis de manager com impacto no orçamento inicial
- Persistência real da carreira com Prisma (inclui `save slot` inicial)
- Criação de equipe customizada com lineup inicial, carro, facilities e contratos base
- Contexto de carreira ativa via cookie no shell do jogo

## Módulo 3 (entregue)

- Dashboard HQ orientado por carreira ativa
- KPIs de caixa, burn rate, moral, índice competitivo e ritmo de desenvolvimento
- Alert Center com níveis de severidade e prioridades operacionais
- Agenda de próximos eventos por categoria/carreira
- Blocos visuais de caixa, próximo evento e pulse de pilotos
- Gráficos de evolução financeira e técnica com Recharts
- Camada de regras de negócio do HQ desacoplada em `domain/rules`

## Módulo 4 (entregue)

- Base real de pilotos, equipes e staff multi-série (F1, F2, INDYCAR, NASCAR, WEC, LMGT3)
- Seed atualizado para usar dados reais e contratos reais de roster
- Pipeline de retratos reais via Wikimedia com manifesto local
- Páginas de listagem + detalhe para:
  - Drivers (`/game/drivers` e `/game/drivers/[driverId]`)
  - Staff (`/game/staff` e `/game/staff/[staffId]`)
  - Teams (`/game/teams` e `/game/teams/[teamId]`)
- Quick compare de pilotos e scouting board com score de avaliação desacoplado (`domain/rules`)
- Navegação expandida com `Staff` e `Scouting`

## Módulo 5 (entregue)

- Marketplace de fornecedores com negociação de contrato e substituição por tipo
- Marketplace de patrocinadores com objetivos de risco (`SAFE`, `BALANCED`, `AGGRESSIVE`)
- Perfis comerciais de fornecedores e marcas com previews financeiros
- Contratação com impacto real em caixa e orçamento do time
- Registro financeiro em `transactions` para signing fee e signing advance
- Novas telas:
  - `/game/suppliers` (contratos ativos + marketplace)
  - `/game/sponsors` (portfólio ativo + negociação)
- Regras de negócio desacopladas em `domain/rules/commercial-deals.ts`

## Módulo 6 (entregue)

- Centro de engenharia com pipeline de upgrades reais em `/game/car-development`
- Tela de infraestrutura em `/game/facilities` com evolução por nível e custo progressivo
- Sistema de projetos com:
  - custo
  - duração
  - risco
  - delta esperado
  - variância oculta
  - estados `AVAILABLE`, `IN_PROGRESS` e `COMPLETED`
- Conclusão de projeto aplica delta diretamente no carro (`basePerformance`, `reliability`, `weight`, `downforce`, `drag`)
- Efeito de fornecedores no desempenho integrado ao cálculo de pace/reliability/development velocity
- Upgrades de facilities impactam eficiência de desenvolvimento e confiabilidade
- Movimentações financeiras registradas em `transactions` para projetos e upgrades de infraestrutura

## Módulo 7 (entregue)

- Calendário completo de temporada por categoria em `/game/calendar`
- Visão global multi-série com radar de próximos eventos e status por campeonato
- Standings completos em `/game/standings` com:
  - classificação de pilotos
  - classificação de equipes
  - classificação de fabricantes
- Histórico da temporada anterior por categoria (campeões de pilotos/equipes/fabricantes)
- Seed expandida com duas temporadas (`2025` finalizada + `2026` preseason) e tabelas populadas
- Regras de desempate desacopladas para standings em `domain/rules/championship-standings.ts`

## Módulo 8 (entregue)

- Engine de Weekend Rules desacoplada da UI em `domain/rules/weekend-rules.ts`
- Normalização de rulesets por categoria com suporte a:
  - F1 style (`Q1/Q2/Q3`, sprint)
  - F2 style (sprint + feature)
  - INDYCAR style (variações por pista)
  - NASCAR style (stage racing)
  - Endurance style (hyperpole + race endurance)
- Novo centro operacional em `/game/weekend-rules` com:
  - catálogo de rulesets da categoria
  - preview por tipo de pista
  - leitura de complexidade e sensibilidade climática
  - geração de skeleton de fim de semana para o próximo evento
- Serviço server-side para gerar `RaceWeekend` + `Session` ordenadas:
  - `features/weekend-rules/service.ts`
  - ação em `app/(game)/game/weekend-rules/actions.ts`
- Registry de simulação expandido para todas as séries seedadas em `simulation/rulesets/registry.ts`

## Módulo 9 (entregue)

- Tela de treino completa em `/game/practice`
- Sistema de aprendizado de setup por sessão com persistência em `SessionTeamState`
- Ganho de `setupConfidence` e `trackKnowledge` influencia diretamente a classificação
- Tela de classificação em `/game/qualifying` com dois modos:
  - `QUICK`
  - `DETAILED` (risco, timing de saída e composto)
- Simulação de grid com resultados persistidos em `qualifying_results`
- Conclusão de sessão atualiza progresso do fim de semana (`session.completed`)
- Regras puras desacopladas da UI:
  - `domain/rules/weekend-session-sim.ts`

## Módulo 10 (entregue)

- Tela `Race Control` completa em `/game/race-control`
- Simulação de corrida com decisões em tempo real:
  - `pace mode`
  - `pit plan`
  - `fuel mode`
  - `tyre mode`
  - `team orders`
  - `weather reaction`
- Leaderboard de corrida com status, gaps, pontos, pit stops e voltas completas
- Feed de eventos e resumo final de sessão com desempenho da equipe gerenciada
- Persistência de resultados em `race_results` e notas de estratégia/feed em `session_team_states`
- Atualização automática de standings (`drivers`, `teams`, `manufacturers`) após sessão
- Evolução de `season.currentRound` em sessões principais de corrida
- Engine desacoplada da UI:
  - `domain/rules/race-control-sim.ts`

## Módulo 11 (entregue)

- Newsroom completo em `/game/newsroom` com:
  - inbox operacional priorizada
  - headlines por categoria e globais
  - rumor wire com credibilidade
  - transfer rumor board gerado por regras
- Global Motorsport Hub em `/game/global-hub` com:
  - pulso simultâneo de todas as categorias
  - pilotos e fabricantes em alta
  - radar global de transferências
  - watchlist regulatória
  - resultados recentes multi-série
- Nova camada de regras para narrativa sistêmica:
  - `domain/rules/world-hub.ts`
- Queries server-side dedicadas para ecossistema vivo:
  - `server/queries/motorsport-world.ts`

## Estrutura de pastas (resumo)

```txt
src/
  app/                 -> rotas Next.js
  components/          -> UI reutilizável e layout
  config/              -> navegação, perfis e constantes
  domain/              -> regras e value objects
  persistence/         -> Prisma client, repositórios, assets
  server/queries/      -> consultas para server components
  simulation/          -> engine desacoplada
prisma/
  schema.prisma
  seed.ts
tests/
  simulation/
  e2e/
```

## Como rodar

1. Instalar dependências:
```bash
npm install
```

2. Gerar cliente Prisma:
```bash
npm run db:generate
```

3. Criar schema no SQLite:
```bash
npm run db:push
```

4. Popular dados iniciais:
```bash
npm run assets:sync-portraits
npm run db:seed
```

5. Rodar aplicação:
```bash
npm run dev
```

6. Testes:
```bash
npm run test
npm run test:e2e
```

## Import de asset pack

Manifesto exemplo:
`assets/packs/sample-pack/asset-pack.json`

Execução:
```bash
npm run assets:import -- assets/packs/sample-pack/asset-pack.json
```

## Próximo módulo

Módulo 12: Save/load, autosave, persistência final e pass de polimento/testes.
