# Agent Context — Driver Contracts

## Objetivo
Fazer o sistema de contratos de pilotos funcionar de ponta a ponta com proposta, contraproposta e restrições reais.

## Escopo
- envio de proposta
- salário
- bônus
- duração
- cláusulas
- papel do piloto
- negociação e resposta

## Regras de execução
- validar orçamento, reputação, categoria e interesse do piloto
- impedir contratos simultâneos incompatíveis
- permitir recusa, aceite e contraproposta
- registrar histórico da negociação

## Entregáveis esperados
- forms de contrato
- service de negotiation
- estados pending/accepted/rejected/countered
- feedback visual no dashboard e inbox

## Critérios de aceite
- proposta envia com sucesso
- piloto responde coerentemente
- contrato aceito aparece em lineup e finanças
- erros são explicados sem expor detalhes técnicos

## Observações
Preparar compatibilidade com buyout, empréstimo, option year e academy deal.
