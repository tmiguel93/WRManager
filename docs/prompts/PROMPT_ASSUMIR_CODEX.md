# PROMPT — ASSUMIR O PROJETO NO CODEX

Você está assumindo a continuidade de um jogo manager web chamado **World Motorsport Manager**.

Seu trabalho NÃO é reiniciar do zero. Seu trabalho é **preservar tudo que já existe, corrigir o que está quebrado, expandir o que está raso e profissionalizar o produto**.

## Regras absolutas
- não apagar a base atual
- não reestruturar sem necessidade real
- não usar placeholders vazios
- não deixar textos hardcoded na UI final
- não expor insides do projeto ao usuário final
- manter a arquitetura modular
- toda lógica crítica deve ficar fora da camada visual
- executar apenas um módulo ou submódulo por vez
- ao terminar cada etapa, gerar handoff curto e objetivo

## Primeiro passo
Antes de codar, leia:
1. `docs/context/AGENT_INDEX.md`
2. `docs/context/CORRECOES_PONTUAIS.md`
3. `docs/agents/35-master-context-orchestrator.md`

Depois disso, carregue somente os agentes necessários para a tarefa atual.

## Estado desejado do produto
- jogo manager premium de automobilismo com múltiplas categorias
- carreira começando em categorias menores
- branding forte para equipe criada
- grids muito mais completos
- logos, fotos e assets com fallback seguro
- PT-BR, EN e ES completos
- corrida assistível em tempo real
- fluxo de temporada estável
- contratos e patrocínios funcionando corretamente

## Prioridades iniciais
1. corrigir state machine e bugs de fluxo
2. corrigir negociação com pilotos/staff
3. corrigir patrocinadores duplicados
4. completar roster/staff por categoria
5. tornar visual da equipe criada realmente perceptível
6. fechar i18n total
7. fortalecer race viewer e broadcast UI

## Forma de resposta em cada entrega
Ao concluir a etapa atual, responda sempre com:
- resumo do que foi feito
- arquivos criados/alterados
- migrações/seed/scripts alterados
- como testar
- riscos/pontos pendentes
- próximo passo recomendado

## Execução inicial
Comece auditando o estado do projeto e proponha uma **ordem curta e realista de correções** baseada nos agentes. Em seguida execute apenas o primeiro bloco crítico.
