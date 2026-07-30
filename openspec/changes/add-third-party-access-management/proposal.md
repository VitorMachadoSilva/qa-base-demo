## Why

O controle atual de acessos de terceiros depende de uma planilha e de atualização
manual, o que dificulta identificar vencimentos, confirmar quais sistemas cada
pessoa utiliza e preservar o histórico de renovações. O QaBase deve centralizar
esse processo operacional e tornar os próximos prazos visíveis antes que um
acesso expire.

## What Changes

- Adicionar `Acessos de terceiros` como destino global na barra principal, sem
  depender de um projeto selecionado.
- Cadastrar terceiro, empresa, função, contato, responsável interno e
  observações.
- Registrar a lista fixa de sistemas: Teams, GitLab, VPN, Jira e Confluence.
- Criar ciclos de acesso com data de aprovação e vencimento máximo de três meses.
- Derivar estados ativo, próximo do vencimento, vencido e encerrado.
- Permitir renovação explícita com novo ciclo e preservação do histórico.
- Oferecer resumo operacional, busca e filtros por estado, sistema, empresa e
  responsável.
- Bloquear alteração destrutiva de ciclos históricos e registrar eventos
  relevantes em uma linha do tempo.
- Manter notificações Telegram, cadência configurável, autenticação,
  permissões e integrações com diretórios fora desta mudança.

## Capabilities

### New Capabilities

- `third-party-access-management`: Cadastro global de terceiros, sistemas
  concedidos, ciclos trimestrais, vencimento derivado, renovação e histórico.

### Modified Capabilities

- `quality-instrument-interface`: Adicionar um destino operacional global à barra
  principal e definir o comportamento responsivo do novo workspace.

## Impact

- Novos modelos e migration Prisma para terceiros, ciclos, concessões e
  atividades.
- Novas rotas REST, validações Zod, verificações de integridade e smoke test.
- Novo workspace React, contratos em `api.js`, navegação global e estilos
  responsivos nos dois temas.
- Atualização da documentação de produto, arquitetura, API, implementação,
  tarefas e handoff.
