# Agent Context — Complete Localization QA

## Objetivo
Garantir qualidade final da localização com auditoria de cobertura, consistência e visual.

## Escopo
- detecção de chaves faltantes
- truncamento de strings
- consistência terminológica
- pluralização e interpolation
- revisão de componentes críticos

## Regras de execução
- toda tela nova deve passar por QA de i18n
- labels de motorsport precisam manter coerência por idioma
- layouts devem suportar strings maiores
- erros não podem voltar em inglês puro

## Entregáveis esperados
- script de auditoria
- checklist visual
- snapshot tests de strings essenciais
- relatório de gaps

## Critérios de aceite
- PT-BR, EN e ES ficam completos e consistentes
- nenhum componente estoura layout por string maior
- UX parece produto final internacional

## Observações
Separar tradução literal de tom de produto ajuda muito na percepção premium.
