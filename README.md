# World Motorsport Manager — Context Suite v4

Pacote consolidado de agentes de contexto para conduzir o projeto no Codex com menos ruído, mais foco e menos estouro de contexto.

## O que contém
- 35 agentes de contexto em `docs/agents/`
- prompt mestre para assumir o projeto no Codex
- prompt de execução modular
- prompt de auditoria de correções
- índice de agentes e matriz de uso
- resumo de correções pontuais recomendadas

## Ordem sugerida
1. Ler `docs/prompts/PROMPT_ASSUMIR_CODEX.md`
2. Ler `docs/context/AGENT_INDEX.md`
3. Carregar apenas os agentes necessários para o módulo atual
4. Executar um módulo por vez e fechar com handoff curto

## Agentes disponíveis
- 01-roster-ingestion.md
- 02-assets-branding.md
- 03-team-identity-theme.md
- 04-i18n-complete.md
- 05-live-race-viewer.md
- 06-weekend-season-state.md
- 07-created-team-logo-upload.md
- 08-data-quality-dedupe.md
- 09-sponsor-system.md
- 10-driver-contracts.md
- 11-staff-negotiation.md
- 12-weekend-rulesets.md
- 13-rookie-progression.md
- 14-team-creation-flow.md
- 15-live-race-commentary.md
- 16-driver-staff-chemistry.md
- 17-manufacturer-programs.md
- 18-media-rumors-press.md
- 19-save-migration-compat.md
- 20-multi-series-calendar.md
- 21-budget-category-economy.md
- 22-wikipedia-wikidata-importers.md
- 23-real-logos-and-asset-packs.md
- 24-complete-localization-qa.md
- 25-post-race-advance-week-fix.md
- 26-real-time-race-broadcast-ui.md
- 27-team-color-visual-propagation.md
- 28-created-team-branding-suite.md
- 29-category-progression-gates.md
- 30-roster-and-staff-global-expansion.md
- 31-season-state-machine-qa.md
- 32-negotiation-feedback-dashboard.md
- 33-sponsor-uniqueness-integrity.md
- 34-ui-product-polish-no-debug-leaks.md
- 35-master-context-orchestrator.md
