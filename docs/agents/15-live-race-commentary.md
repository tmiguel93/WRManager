# Agent Context — Live Race Commentary

## Objetivo
Adicionar camada de narração textual premium ao viewer de corrida para tornar a prova mais viva e compreensível.

## Escopo
- comentários de largada, ultrapassagem, pit, erro, safety car, clima, melhor volta e final
- intensidade baixa/média/alta
- suporte a PT-BR, EN e ES

## Regras de execução
- commentary reage ao motor, não controla a simulação
- evitar repetição excessiva
- priorizar clareza antes de floreio
- usar message keys e interpolation data

## Entregáveis esperados
- event commentary service
- templates por idioma
- filtros de importância
- histórico recente de comentários

## Critérios de aceite
- corrida parece mais viva
- comentários ajudam sem poluir
- performance permanece estável

## Observações
Preparar integração futura com rádio de equipe e narrador contextual de campeonato.
