# Agent Context — Data Quality and Deduplication

## Objetivo
Evitar duplicidade e inconsistência ao combinar múltiplas fontes de pilotos, equipes, staff, assets e patrocinadores.

## Escopo
- nomes canônicos e aliases
- merge de fontes
- conflitos de equipe/categoria atual
- sponsor uniqueness
- duplicidade de assets

## Regras de execução
- definir prioridade de fontes
- preservar overrides humanos
- registrar source_confidence
- criar review queue para conflitos relevantes
- adicionar constraints de unicidade onde couber

## Entregáveis esperados
- regras de canonização
- rotina de dedupe
- relatório de conflitos
- testes para duplicatas conhecidas

## Critérios de aceite
- menos clones no banco
- patrocinador duplicado continua bloqueado
- mercado e grids ficam consistentes

## Observações
Usar hashes de conteúdo para assets e chaves compostas para contratos e vínculos ativos.
