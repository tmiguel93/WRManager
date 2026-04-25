# Agent Context — Save Migration and Compatibility

## Objetivo
Proteger a continuidade dos saves conforme novos sistemas entram no projeto.

## Escopo
- migrations de schema
- backfill de campos novos
- versionamento do save
- adaptadores de compatibilidade
- validação após load

## Regras de execução
- nunca quebrar saves antigos sem estratégia explícita
- migrar campos novos com fallback
- detectar e informar versões incompatíveis de forma amigável
- criar testes de round-trip save/load

## Entregáveis esperados
- save version registry
- scripts de migração
- compat layer
- relatório de risco por release

## Critérios de aceite
- saves antigos continuam carregando ou são migrados corretamente
- novos campos aparecem sem corromper dados
- QA consegue reproduzir cenários de upgrade

## Observações
Muito importante porque o projeto está expandindo rápido e isso costuma quebrar managers ambiciosos.
