# Agent Context — Sponsor Uniqueness and Integrity

## Objetivo
Blindar o sistema de patrocinadores contra duplicidade e inconsistência lógica.

## Escopo
- unicidade por equipe/slot/período
- sponsor exclusivity
- recontratação inválida
- conflito entre contratos simultâneos

## Regras de execução
- validar no frontend, backend e banco quando possível
- exibir motivo do bloqueio
- evitar edge cases em renovação e cancelamento

## Entregáveis esperados
- constraints
- guards de serviço
- UX de desabilitação/aviso
- testes para cenários duplicados

## Critérios de aceite
- mesmo sponsor não pode reaparecer de forma errada
- o sistema continua consistente após renewals e expirations

## Observações
Agente focalizado para garantir que o bug já reportado não volte depois.
