## Context

O fluxo atual cria runs apenas a partir de uma seleção avulsa do repositório.
`Run` guarda nome, estado e snapshots dos casos, mas não registra a origem do
escopo, a entrega testada nem as condições de execução. Isso torna regressões
recorrentes repetitivas e reduz a capacidade de comparar ou localizar histórico.

O produto é local, pessoal e usa React, Express, Prisma e SQLite. A mudança deve
preservar runs existentes, continuar funcionando sem contexto cadastrado e
evitar recursos orientados a equipes, como responsáveis e permissões.

## Goals / Non-Goals

**Goals:**

- Reutilizar seleções ordenadas de casos por meio de planos.
- Identificar a versão, sprint ou entrega associada a cada run.
- Registrar ambiente e uma combinação explícita de configurações por run.
- Preservar nomes e valores históricos mesmo após edição ou exclusão da origem.
- Manter criação avulsa de runs e dados legados totalmente funcionais.
- Oferecer uma área de planejamento compacta e adequada ao uso diário.

**Non-Goals:**

- Gerar automaticamente o produto cartesiano de configurações.
- Distribuir casos entre responsáveis ou controlar permissões.
- Armazenar senhas, tokens ou outras credenciais de ambiente.
- Importar resultados automatizados ou integrar issue trackers.
- Adicionar anexos, defeitos, relatórios exportáveis ou comparação de tendência.

## Decisions

### Plano reutilizável referencia casos atuais

`TestPlan` pertence a um projeto e possui itens ordenados em `TestPlanItem`.
Cada item referencia um `TestCase` atual. Alterar o caso atualiza naturalmente o
que será usado no próximo run; excluir o caso remove sua participação nos
planos. O snapshot imutável continua sendo criado apenas em `RunTestCase`.

Alternativa considerada: copiar o conteúdo do caso para o plano. Foi descartada
porque transformaria o plano em uma segunda fonte de verdade e exigiria
sincronização com o repositório.

### Planos vazios são rascunhos válidos

Um plano pode ser salvo sem casos para permitir construção progressiva, mas não
pode iniciar um run enquanto estiver vazio. A interface informa a condição e
leva o usuário à seleção de casos.

Alternativa considerada: exigir casos na criação. Isso reduz estados vazios,
mas força um fluxo longo e impede cadastrar primeiro a intenção do plano.

### Milestone representa a entrega, não o template

`Milestone` pertence ao projeto, possui nome, descrição, datas opcionais e
estado `Upcoming`, `Active` ou `Completed`. Runs podem apontar para um milestone;
planos não apontam, pois um mesmo plano de regressão pode servir a várias
releases. Milestones concluídos ficam indisponíveis para novos runs.

Alternativa considerada: associar o plano ao milestone. Foi descartada por
misturar o template reutilizável com um ciclo específico.

### Ambiente e configuração são conceitos separados

`Environment` descreve o alvo reutilizável, com nome, descrição e identificador
opcional como URL, build ou caminho. `ConfigurationGroup` e
`ConfigurationOption` representam dimensões independentes, como navegador,
sistema operacional ou dispositivo. O usuário escolhe no máximo uma opção de
cada grupo ao criar um run.

Alternativa considerada: um único campo JSON livre em `Run`. Seria simples,
mas impediria reutilização, validação e filtros consistentes.

### Seleções de configuração possuem linha própria e snapshot

`RunConfiguration` liga o run a uma opção atual e também guarda os nomes do
grupo e da opção naquele momento. `Run` guarda snapshots do nome do plano,
milestone, ambiente e identificador do ambiente. As referências são opcionais e
usam `SetNull` na exclusão; os snapshots continuam legíveis.

Alternativa considerada: serializar toda a configuração em uma coluna JSON.
Uma tabela própria facilita validar um valor por grupo, filtrar runs e evoluir
as opções sem perder o histórico.

### Criação de run aceita uma única origem de escopo

O contrato aceita `testCaseIds` para seleção avulsa ou `testPlanId` para usar
todos os casos atuais do plano, nunca ambos. Contexto é sempre opcional:
`milestoneId`, `environmentId` e `configurationOptionIds`. Todos os IDs devem
pertencer ao projeto do run e as opções não podem repetir o mesmo grupo.

Alternativa considerada: permitir editar a seleção do plano durante a criação.
Foi adiada para evitar ambiguidade entre o plano salvo e o run gerado.

### Planejamento fica em uma única área do workspace

A navegação do projeto recebe `Planejamento`, com abas internas para `Planos`,
`Milestones` e `Contextos`. O histórico de runs mantém sua tela atual e recebe
filtros compactos por origem e contexto. A criação de run pode começar no plano
ou no repositório e usa o mesmo diálogo.

Alternativa considerada: adicionar três itens à navegação principal. Isso
aumentaria o ruído de uma ferramenta pessoal e fragmentaria um único fluxo.

## Risks / Trade-offs

- [Exclusão de casos pode esvaziar planos silenciosamente] -> Remover itens em
  cascata, recalcular contagens e exibir claramente planos sem casos.
- [Muitos grupos podem tornar a criação de run longa] -> Usar controles
  compactos, seleção opcional e ordem configurável de grupos.
- [Datas e estados de milestone podem divergir] -> Validar início menor ou igual
  ao prazo e tratar estado como decisão explícita, sem automação por relógio.
- [Snapshots duplicam texto no SQLite] -> Aceitar o pequeno custo para garantir
  histórico autocontido.
- [Migração pode encontrar runs legados] -> Todas as novas relações e colunas
  serão opcionais, com respostas de API usando `null` ou listas vazias.
- [Nomes duplicados confundem filtros] -> Impedir duplicatas sem distinção de
  maiúsculas dentro do mesmo projeto ou grupo.

## Migration Plan

1. Adicionar tabelas de planos, milestones, ambientes e configurações.
2. Adicionar relações e snapshots opcionais em `Run`.
3. Atualizar o setup idempotente e criar migration SQL aditiva.
4. Gerar o cliente Prisma e verificar a leitura dos runs existentes.
5. Implementar APIs e smoke tests antes das novas telas.
6. Adicionar a área de planejamento e estender a criação/listagem de runs.
7. Validar o fluxo avulso legado e o novo fluxo por plano em desktop e celular.

Rollback: manter cópia do SQLite antes da migration. O código anterior ignora
as novas tabelas e colunas; nenhum campo existente será removido.

## Open Questions

- Um identificador humano configurável para planos e milestones será tratado
  junto da futura identidade de casos, não nesta mudança.
- Matriz automática de configurações poderá ser adicionada depois que o uso
  manual demonstrar quais dimensões realmente se repetem.
- O campo opcional do ambiente permanecerá texto genérico até haver necessidade
  comprovada de tipos específicos para URL, build, dispositivo ou banco.
