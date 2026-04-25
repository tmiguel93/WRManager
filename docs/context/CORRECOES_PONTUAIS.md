# Correções pontuais recomendadas

## Correções priorizadas
1. **Trava pós-corrida / avanço de semana**
   - revisar state machine do fim de semana e temporada
   - garantir transição `race_finished -> weekend_complete -> next_week_ready`

2. **Pré-temporada não encerra**
   - primeira corrida oficial deve mudar o estado para `season_running`

3. **Patrocínio duplicado**
   - validar unicidade em frontend, backend e banco

4. **Propostas para pilotos/staff falhando**
   - auditar formulário, action/service, validação, persistência e feedback visual

5. **Mudança de cor pouco visível**
   - propagar tema para dashboard, standings, viewer, botões, banners e placeholders

6. **I18N incompleta**
   - remover textos hardcoded e rodar checker de cobertura

7. **Vazamento de insides/debug**
   - ocultar ids técnicos, chaves internas, JSON cru e mensagens de erro inadequadas

8. **Cobertura incompleta de pilotos/staff**
   - priorizar importers por categoria e backfill de dados

9. **Branding fraco de equipe criada**
   - integrar upload de logo, fallback logo e suite de branding

10. **Race viewer pouco cinematográfico**
    - fortalecer leaderboard, track map, event feed e commentary

## Ordem prática de ataque
- primeiro: fluxo e bugs críticos (`06`, `25`, `31`, `33`, `10`, `11`)
- depois: dados e roster (`01`, `08`, `22`, `30`)
- depois: visual e branding (`02`, `03`, `07`, `23`, `27`, `28`, `34`)
- depois: viewer e broadcast (`05`, `15`, `26`)
- por fim: QA de i18n e economia (`04`, `21`, `24`, `29`)
