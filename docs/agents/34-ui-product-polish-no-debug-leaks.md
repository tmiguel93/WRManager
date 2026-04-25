# Agent Context — UI Product Polish and No Debug Leaks

## Objetivo
Remover vazamentos de elementos internos e elevar o acabamento de produto.

## Escopo
- ids técnicos
- labels de debug
- mensagens cruas de erro
- painéis internos indevidos
- microcopy e estados vazios

## Regras de execução
- interface final não deve expor nomes de seed, json cru ou dados internos
- ambiente dev pode continuar tendo logs próprios
- melhorar toasts, tooltips e empty states

## Entregáveis esperados
- revisão de UI
- copy polish
- ocultação de elementos internos
- fallback messages amigáveis

## Critérios de aceite
- o jogo parece produto final
- usuário não vê “insides” do projeto
- mensagens ficam claras e bonitas

## Observações
Esse agente ataca diretamente a reclamação sobre insides vazando na interface.
