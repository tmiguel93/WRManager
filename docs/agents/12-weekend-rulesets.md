# Agent Context — Weekend Rulesets

## Objetivo
Modelar formatos diferentes de fim de semana por campeonato sem hardcode único.

## Escopo
- practice sessions
- qualifying formats
- sprint/feature/stage races
- endurance variations
- points systems
- caution/safety car rules

## Regras de execução
- criar WeekendRuleSet configurável por série
- manter engine genérica
- permitir futuras temporadas/regulamentos
- separar regras de sessão, pontuação, pneus e procedimentos de corrida

## Entregáveis esperados
- schema de ruleset
- loaders por categoria
- validações
- ligação com season calendar

## Critérios de aceite
- F1, F2, Formula E, INDYCAR, NASCAR e endurance usam formatos coerentes
- mudar categoria muda estrutura do fim de semana sem quebrar o loop

## Observações
Ideal para expansão futura de reversão de grid, hyperpole, stages e playoffs.
