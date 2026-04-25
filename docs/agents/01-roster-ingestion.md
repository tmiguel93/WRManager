# Agent Context — Roster Ingestion

## Objetivo
Completar a cobertura de pilotos por categoria usando pipeline reexecutável, deduplicada e preparada para atualizações futuras sem destruir dados já existentes.

## Escopo
- pilotos titulares, reservas e developmental drivers quando houver
- vínculo com equipe, categoria, país, idade e status contratual
- metadados de origem, verificação e confiança da fonte

## Regras de execução
- priorizar pages oficiais de drivers/teams/grid/entry list como validação e Wikipedia/Wikidata como apoio estrutural
- normalizar nomes, aliases, acentuação e sufixos
- nunca apagar manual overrides do usuário
- registrar source_url, source_confidence e last_verified_at em toda entidade importada

## Entregáveis esperados
- importers por campeonato
- tabela de aliases canônicos
- rotina de merge e dedupe
- fila de conflitos para revisão manual

## Critérios de aceite
- cada categoria configurada possui roster coerente
- rerun do importer não duplica pilotos
- filtros por categoria, equipe, país e status funcionam
- mercado deixa de parecer incompleto

## Observações
Criar compatibilidade com temporadas futuras e permitir backfill por ano de campeonato.
