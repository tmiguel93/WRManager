# Agent Context — Assets and Branding

## Objetivo
Dar suporte seguro a logos, fotos e branding visual com asset registry, attribution, review state e fallback premium.

## Escopo
- logos de equipe
- logos de fornecedoras de motor, pneus e componentes
- logos de patrocinadores
- fotos de pilotos e staff
- placeholders premium

## Regras de execução
- nunca quebrar layout por falta de asset
- armazenar attribution, source_page, license_type e trademark_warning
- permitir override local via asset pack
- usar fallback premium quando não houver logo real aprovado

## Entregáveis esperados
- AssetRegistry completo
- componentes de imagem com fallback automático
- pipeline de importação manual/local
- badges de status de asset (approved, needs_review, fallback)

## Critérios de aceite
- listas, cards, detalhes e dashboard exibem branding consistente
- falta de asset não gera erro visual
- assets podem ser trocados sem refazer seed inteira

## Observações
Separar mídia livre, mídia aprovada internamente e placeholders para não travar o projeto por direitos de uso.
