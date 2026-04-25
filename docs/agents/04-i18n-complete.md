# Agent Context — Complete I18N

## Objetivo
Entregar internacionalização completa em PT-BR, EN e ES, sem mistura de idiomas e sem textos hardcoded.

## Escopo
- telas principais
- weekend center
- viewer de corrida
- toasts, erros, tooltips, formulários, estados vazios e onboarding
- nomes de labels, tabs e CTAs

## Regras de execução
- usar namespaces por domínio
- criar checker de chaves faltantes
- bloquear merge de novas telas sem cobertura mínima nas três línguas
- persistir idioma no perfil/local save

## Entregáveis esperados
- arquivos de tradução organizados
- script de verificação de cobertura
- relatório de chaves órfãs ou ausentes
- smoke tests para troca de idioma

## Critérios de aceite
- UI principal fica 100% traduzida
- troca de idioma reflete imediatamente no app
- não sobram blocos misturados em inglês/espanhol/português

## Observações
Separar conteúdo de commentary dinâmica por message keys para não duplicar lógica.
