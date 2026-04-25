# Agent Context — Season State Machine QA

## Objetivo
Auditar sistematicamente a máquina de estados da temporada e do fim de semana.

## Escopo
- cenários de primeira corrida
- transições de mid-season
- fim de temporada
- offseason
- save/load no meio de um estado
- rollback de sessão falhada

## Regras de execução
- criar matriz de cenários
- cobrir estados felizes e edge cases
- garantir que UI, banco e engine concordem sobre o estado atual

## Entregáveis esperados
- plano de testes
- relatório de edge cases
- correções pontuais em guards e reducers/services

## Critérios de aceite
- não sobram estados invisíveis ou mortos
- season flow fica confiável para features futuras

## Observações
Útil depois de adicionar viewer e múltiplos formats de fim de semana.
