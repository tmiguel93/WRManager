# Agent Context — Created Team Logo Upload

## Objetivo
Permitir que o usuário envie o próprio logo em PNG para a equipe criada e veja isso no jogo inteiro.

## Escopo
- upload de PNG
- preview
- validação de tamanho/dimensão
- persistência
- exibição global em dashboard, standings, negotiation e cards

## Regras de execução
- aceitar PNG como mínimo obrigatório
- preservar transparência quando existir
- aplicar fallback se o arquivo falhar
- não deformar logo ao renderizar em containers variados

## Entregáveis esperados
- fluxo de upload
- component de preview
- registro do asset no AssetRegistry
- política de resize/fit

## Critérios de aceite
- logo aparece corretamente após salvar
- reload mantém o asset
- layout não quebra com arquivos quadrados, retangulares ou transparentes

## Observações
Opcional futuro: SVG/WebP e crop manual.
