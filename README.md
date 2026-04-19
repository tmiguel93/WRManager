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

Módulo 3: Dashboard HQ orientado por carreira ativa.
