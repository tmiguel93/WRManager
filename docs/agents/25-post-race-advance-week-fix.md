# Agent Context — Post-Race Advance Week Fix

## Objetivo
Corrigir especificamente o bug de travamento após a corrida, garantindo avanço para a próxima semana.

## Escopo
- post-race summary
- weekend-complete
- advance-week action
- refresh de calendário, inbox, projetos, standings e finanças

## Regras de execução
- mapear todos os pontos onde o fluxo pode ficar preso
- criar guarda explícita para race_finished -> weekend_complete -> next_week_ready
- sincronizar estado local e persistido

## Entregáveis esperados
- testes end-to-end do fluxo
- logging amigável em ambiente dev
- mensagens claras para o usuário se algo falhar

## Critérios de aceite
- após a corrida o jogador consegue seguir normalmente
- a semana seguinte aparece
- pre-season e season-running atualizam corretamente

## Observações
Mesmo se o state machine já existir, este agente serve como auditoria focalizada.
