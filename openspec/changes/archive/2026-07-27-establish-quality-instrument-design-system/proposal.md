## Why

O QA Manager já cobre o fluxo funcional de repositório, planejamento e
execução, mas sua interface ainda usa a linguagem visual genérica de dashboards
SaaS: sidebar ampla, superfícies brancas repetidas, cards equivalentes e azul
como assinatura universal. Agora é necessário construir uma identidade própria
que aumente densidade, orientação e velocidade sem comprometer legibilidade.

## What Changes

- Estabelecer a linguagem visual `Quality Instrument`, ligada a inspeção,
  evidência e controle de qualidade.
- Introduzir tokens semânticos de cor, tipografia, espaçamento, geometria,
  elevação, densidade e movimento.
- Redesenhar o shell como rail global, navegação contextual, barra de localização
  e canvas operacional.
- Padronizar command bars, operational strips, data ledgers, status marks,
  inspectors, overlays e estados vazios.
- Aplicar o sistema primeiro às telas de estresse: Repositório, Histórico de Runs
  e Execução.
- Adaptar Planejamento, Visão Geral e Projetos aos mesmos fundamentos após os
  componentes compartilhados estarem estáveis.
- Criar navegação e composição próprias para mobile, em vez de apenas comprimir
  o layout desktop.
- Adicionar comportamento previsível de foco, teclado, contraste, redução de
  movimento e zoom.
- Preservar todos os fluxos, contratos de API, dados e compatibilidade histórica
  existentes.
- Não inclui dark mode, personalização de temas, nova marca definitiva,
  ilustrações, gráficos adicionais ou mudanças no backend.

## Capabilities

### New Capabilities

- `quality-instrument-interface`: Define a linguagem visual, shell, densidade,
  componentes operacionais, adaptação responsiva e critérios de acessibilidade
  para toda a aplicação.

### Modified Capabilities

Nenhuma capacidade funcional muda de comportamento nesta entrega.

## Impact

- Reestruturação dos componentes e estilos em `frontend/src`.
- Possível inclusão local das famílias IBM Plex Sans e IBM Plex Mono.
- Criação de componentes compartilhados para shell, barras, tabelas/listas,
  estados, inspector e overlays.
- Atualização dos testes visuais para desktop, tablet, mobile, zoom e redução de
  movimento.
- `DESIGN_SYSTEM.md` passa a ser a fonte permanente de decisões visuais.
- Backend, banco SQLite, rotas e formatos de resposta permanecem inalterados.
