# Agent Context — Wikipedia and Wikidata Importers

## Objetivo
Estruturar importadores robustos usando Wikipedia/Wikidata/Wikimedia como apoio principal para seeds e enriquecimento.

## Escopo
- source manifests
- parsers por página/tabela
- normalização
- cache
- metadados de verificação
- integração com AssetRegistry e dedupe

## Regras de execução
- não confiar em uma única tabela sem validação
- registrar origem de todo dado importado
- suportar reexecução e refresh
- marcar campos frágeis para revisão humana

## Entregáveis esperados
- import scripts versionados
- adapters por campeonato
- logs de importação
- modo dry-run

## Critérios de aceite
- o projeto consegue popular dados sem trabalho totalmente manual
- importers são reexecutáveis e transparentes
- conflitos ficam auditáveis

## Observações
Combinar com páginas oficiais para validação final melhora qualidade da base.
