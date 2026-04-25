# Agent Context — Weekend and Season State Machine

## Objetivo
Corrigir travas e garantir que fim de semana, semana seguinte e temporada avancem sem estados mortos.

## Escopo
- estados de pré-temporada, preparação, practice, qualifying, race, post-race, weekend-complete, next-week-ready, season-running, season-end e offseason
- atualização de dashboard, calendário, standings, inbox, finanças e moral

## Regras de execução
- modelar state machine explícita
- nenhum fluxo pode terminar sem transição válida
- pós-corrida sempre deve permitir avançar semana
- primeira corrida oficial deve encerrar pré-temporada

## Entregáveis esperados
- state chart
- testes de transição
- guard clauses e mensagens de erro amigáveis
- sincronização do estado no save/load

## Critérios de aceite
- a temporada sai de pre-season corretamente
- o fim de semana fecha e a semana seguinte carrega
- não há soft lock após corrida ou resumo

## Observações
Essa camada é crítica e deve ser auditada antes de qualquer novo módulo de gameplay.
