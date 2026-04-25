# Agent Context — Master Context Orchestrator

## Objetivo
Orquestrar o uso dos agentes para evitar contexto inchado e execução caótica no Codex.

## Escopo
- ordem de leitura dos agentes
- quais agentes carregar por tarefa
- regras de compactação de contexto
- checkpoints e handoff entre módulos

## Regras de execução
- carregar apenas agentes relevantes para a tarefa atual
- resumir estado ao final de cada módulo
- nunca reanexar todo o universo de contexto sem necessidade
- manter um changelog/handoff curto e objetivo

## Entregáveis esperados
- matriz de uso de agentes
- workflow de execução modular
- handoff format
- checklist de encerramento por módulo

## Critérios de aceite
- o Codex trabalha com foco
- contexto não “derrete”
- módulos ficam mais previsíveis e auditáveis

## Observações
Este é o agente mais importante para manter o projeto grande sob controle.
