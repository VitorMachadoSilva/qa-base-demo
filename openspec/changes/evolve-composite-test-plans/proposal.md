## Why

Os planos atuais organizam uma lista ordenada de casos, mas não representam
cenários reais em que funcionalidades independentes precisam ser executadas em
sequência, compartilham estado e ainda exigem resultados separados. Essa
limitação incentiva casos excessivamente grandes ou duplicados e dificulta
entender qual parte de um fluxo combinado falhou.

## What Changes

- Organizar planos em seções ordenadas que representem etapas ou blocos de um
  cenário composto.
- Permitir que cada item do plano registre instruções de transição e uma
  dependência opcional de outro item do mesmo plano.
- Preservar a execução e o resultado individual de cada caso, mesmo quando ele
  pertence a um fluxo dependente.
- Salvar no run um snapshot das seções, dependências e instruções usadas na
  criação da execução.
- Associar casos a múltiplos componentes funcionais configuráveis sem alterar
  sua suíte principal.
- Permitir busca e filtro de casos por componente durante a manutenção do
  repositório e a composição de planos.
- Migrar planos existentes para uma seção padrão sem alterar sua ordem atual.
- Manter fora desta mudança uma entidade independente de fluxo, dependências
  condicionais complexas, execução automática, AD/MF, acessos de terceiros,
  Telegram, autenticação e colaboração multiusuário.

## Capabilities

### New Capabilities

Nenhuma. A mudança evolui capacidades já existentes sem introduzir uma área
funcional independente.

### Modified Capabilities

- `test-repository`: casos passam a aceitar múltiplos componentes funcionais e
  filtros por componente sem perder a organização principal por suíte.
- `test-plans`: planos passam a possuir seções, instruções de transição e
  dependências simples entre seus itens ordenados.
- `test-run-execution`: runs passam a preservar e apresentar o snapshot da
  estrutura composta do plano, mantendo resultados individuais por caso.

## Impact

- Novas tabelas e relações aditivas no Prisma/SQLite para componentes, seções de
  plano e metadados de composição.
- Migração dos itens de planos atuais para uma seção padrão.
- Alterações nas APIs REST de casos, planos e runs, com respostas compatíveis
  com a estrutura composta.
- Evolução do workspace de repositório, do editor de planos, da criação de runs
  e da tela de execução.
- Ampliação dos smoke tests de API, validações Zod e verificações responsivas do
  frontend.
- Nenhuma dependência externa nova é necessária.
