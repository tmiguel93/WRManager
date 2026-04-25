# Agent Context — Live Race Viewer

## Objetivo
Permitir assistir à corrida em tempo real com sensação de transmissão manager, sem 3D pesado.

## Escopo
- play, pause, velocidade 1x/2x/4x/8x
- timeline
- track map 2D
- leaderboard dinâmica
- gaps, pneus, combustível/energia, clima e pit status
- highlights e feed de eventos

## Regras de execução
- separar simulation ticks da render layer
- permitir modo assistir completo e modo simular rápido
- não acoplar resultado final à UI
- refletir cores, logos e bandeiras das equipes/pilotos

## Entregáveis esperados
- RaceViewerPage
- stream/tick model
- track map simplificado
- widgets de evento, clima e posição
- replay textual curto dos últimos lances

## Critérios de aceite
- usuário consegue acompanhar corrida acontecendo
- corrida continua coerente sob aceleração do tempo
- UI transmite emoção e entendimento do momento da prova

## Observações
Preparar arquitetura para replays, rádio de equipe e câmera 2D mais sofisticada em módulos futuros.
