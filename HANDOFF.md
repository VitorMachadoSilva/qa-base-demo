# Handoff do projeto

Atualizado em: 28 de julho de 2026

## Objetivo

Construir uma plataforma local e gratuita de gestão de testes, inspirada em Qase
e TestRail, adaptável a qualquer aplicação ou software e adequada ao uso pessoal
de QA. O nome do produto é **QaBase**.

## Estado OpenSpec

Mudança funcional ativa:

`add-local-authentication-and-private-notes`

Ela está sendo implementada na branch `codex/multi-login-private-notes`.
Autenticação, Minha conta e isolamento de Anotações rápidas estão prontos; a
mudança deve permanecer ativa até a revisão explícita do usuário.

Última mudança funcional concluída e arquivada:

`add-telegram-notification-center`

Ela adiciona o centro global de configurações e notificações por Telegram.
Proposta, design, requisitos, implementação e 55 tarefas estão concluídos. As
delta specs foram sincronizadas e a mudança está arquivada em:

`openspec/changes/archive/2026-07-28-add-telegram-notification-center`.

`add-quality-instrument-themes` também permanece implementada e validada, ainda
sem sincronização ou arquivamento.

A mudança `establish-quality-instrument-design-system`, que formaliza a
linguagem visual `Quality Instrument`, foi concluída, sincronizada e arquivada
em:

`openspec/changes/archive/2026-07-27-establish-quality-instrument-design-system`

A spec principal está em:

`openspec/specs/quality-instrument-interface/spec.md`

A mudança anterior `add-test-planning-context` foi concluída, sincronizada e
arquivada em:

`openspec/changes/archive/2026-07-26-add-test-planning-context`

## Entregue nesta mudança

- identidade visível QaBase e migração da preferência local de tema;
- nova navegação Validações em desktop, tablet e celular;
- pastas hierárquicas livres, sem categorias obrigatórias;
- ficha com título, objetivo, escopo, notas gerais, estado e link HTTP(S);
- critérios de aceite ordenados e marcáveis;
- checklist executável com esperado, observado, notas e cinco resultados;
- progresso derivado por ficha e filtros por busca, pasta e estado;
- notas cronológicas dos tipos nota, dúvida, risco e evidência;
- promoção transacional de um teste para caso reutilizável;
- preservação da ficha ao excluir pasta e do teste ao excluir caso promovido;
- workspace de três regiões com reflow específico para tablet e celular.

Funcionalidades preservadas:

- modelos, migration e setup idempotente para planejamento;
- planos de teste ordenados, incluindo rascunhos vazios;
- milestones com datas, ciclo de vida e resumo de progresso;
- ambientes, grupos e opções de configuração;
- runs por plano ou seleção avulsa;
- validação de isolamento por projeto e uma opção por grupo;
- snapshots de plano, milestone, ambiente e configurações;
- filtros contextuais no histórico;
- área Planejamento com abas Planos, Milestones e Contextos;
- diálogo compartilhado de criação de run;
- contexto visível no histórico e workspace de execução.

## Evidências

- setup de banco executado duas vezes sem alteração destrutiva;
- Prisma Client gerado com os cinco novos modelos;
- `backend/scripts/checkDatabase.js`: todos os indicadores de integridade em zero;
- `backend/scripts/smoke.js`: fluxos antigos e de fichas aprovados;
- build Vite de produção aprovado;
- OpenSpec 1.6.0 aprovado em modo estrito;
- navegador aprovado em desktop, tablet 768 x 1024 e celular 390 x 844;
- temas claro e escuro aprovados no novo workspace;
- criação de pasta/ficha, critério, resultado, evidência e promoção exercitados;
- dados temporários da validação visual removidos.

O projeto local `Validação visual E2E` foi mantido como evidência funcional.

## Arquivos centrais

- `backend/prisma/schema.prisma`
- `backend/src/controllers/testPlansController.js`
- `backend/src/controllers/planningController.js`
- `backend/src/controllers/runsController.js`
- `backend/src/controllers/validationBriefsController.js`
- `backend/src/routes/validationBriefs.js`
- `backend/scripts/smoke.js`
- `frontend/src/components/AppShell.jsx`
- `frontend/src/components/ThemeSwitcher.jsx`
- `frontend/src/components/QualityPrimitives.jsx`
- `frontend/src/DesignSystemFixture.jsx`
- `frontend/src/PlanningWorkspace.jsx`
- `frontend/src/RunDialog.jsx`
- `frontend/src/TestRuns.jsx`
- `frontend/src/ValidationWorkspace.jsx`
- `frontend/src/ProductionDemandsWorkspace.jsx`
- `frontend/src/utils/productionDemands.js`
- `frontend/src/styles/`
- `backend/src/controllers/productionDemandsController.js`
- `backend/src/routes/productionDemands.js`
- `backend/scripts/smokeProductionDemands.js`
- `backend/src/controllers/quickNotesController.js`
- `backend/src/routes/quickNotes.js`
- `backend/scripts/smokeQuickNotes.js`
- `frontend/src/QuickNotesWorkspace.jsx`
- `frontend/src/styles/quick-notes.css`
- `openspec/specs/quality-instrument-interface/spec.md`
- `openspec/changes/add-quality-instrument-themes/`
- `openspec/changes/add-validation-brief-workspace/`
- `openspec/changes/archive/2026-07-28-add-quick-notes-workspace/`
- `openspec/changes/archive/2026-07-27-establish-quality-instrument-design-system/`

## Ponto exato de retomada

`add-production-demand-workspace` foi implementada de ponta a ponta. A nova
destinação **Demandas** gerencia AD e MF por projeto com resumo operacional,
filtros combináveis, prazo automático de 20 dias corridos para MF, criticidade e
quantidade afetada para AD, contato do suporte, QA responsável, links opcionais,
notas e histórico.

Encerramento e reabertura foram exercitados no navegador. MF exige solução
paliativa e data de entrega; AD exige correção e data de produção. Registros
encerrados ficam bloqueados até reabertura. A data inicial do formulário usa o
calendário local, evitando avanço de um dia à noite no horário de Brasília.

Banco representativo e banco novo passaram com integridade zerada. Os três smoke
tests e o build Vite passaram. O frontend foi validado em 1280, 820 e
390 x 844, nos temas claro e escuro, incluindo 200 registros. Todos os dados
temporários foram removidos.

Próxima ação: revisar a entrega em `http://127.0.0.1:5173`, sincronizar as delta
specs e arquivar `add-production-demand-workspace` somente após aprovação
explícita. Depois, as próximas evoluções planejadas são gestão de acessos de
terceiros e notificações Telegram com cadência configurável.

## Serviços locais

- frontend: `http://127.0.0.1:5173`
- API: `http://localhost:3001/api`

O Vite usa `host: 0.0.0.0` e `strictPort: true`. Essa configuração evita que
duas instâncias diferentes ocupem separadamente IPv4 e IPv6 na porta 5173 e
sirvam versões distintas do frontend.

## Retomada em 28 de julho de 2026

`add-third-party-access-management` foi implementada de ponta a ponta. A nova
aba global **Acessos de terceiros** fica na rail principal, abaixo de Projetos,
e não depende do projeto selecionado. No celular, Projetos e Terceiros ficam na
navegação global inferior.

A área entrega cadastro de pessoa, empresa, função, contato, responsável interno
e observações; acessos fixos a Teams, GitLab, VPN, Jira e Confluence; aprovação,
vencimento máximo de três meses, estados operacionais, filtros, renovação,
encerramento, histórico de ciclos e anotações.

Banco representativo, integridade, smoke dedicado e smoke tests anteriores
passaram. O build Vite passou. A interface foi revisada em 1280, 820 e
390 x 844, nos temas claro e escuro, com estados vazio e populado, conteúdo
longo e 200 registros. Os dados temporários foram removidos.

Próxima ação: revisão do usuário em
`http://127.0.0.1:5173/#third-party-access`. Após aprovação explícita,
sincronizar as delta specs e arquivar `add-third-party-access-management`.
Notificações Telegram e configuração de cadência continuam fora desta mudança.

## Anotações rápidas em 28 de julho de 2026

`add-quick-notes-workspace` foi implementada de ponta a ponta. A nova aba global
**Anotações rápidas** fica abaixo de Acessos de terceiros na rail principal e
aparece como **Notas** na navegação móvel. Ela não depende de projeto.

A área entrega captura com título opcional, texto, sete cores e fixação; pastas
virtuais pelo dia imutável de criação; visão de todas as notas; busca global;
cartões com recorte estável; e edição ou exclusão pelo inspetor lateral. Novas
notas usam `QABASE_TIME_ZONE`, com `America/Sao_Paulo` como padrão.

Prisma, setup, integridade e smoke dedicado passaram. Os smoke tests de núcleo,
planos compostos, AD/MF e terceiros também passaram. O build Vite transformou
1.603 módulos. A interface foi validada em 1280, 820 e 390 x 844, nos temas
claro e escuro, com estado vazio, busca, fixação, texto longo, Escape, reflow a
200% e 200 notas. Os 200 registros temporários foram removidos e o total voltou
a zero.

Ponto exato de retomada: a entrega foi aprovada pelo usuário em 28 de julho de
2026, as delta specs foram sincronizadas e a mudança foi arquivada em
`openspec/changes/archive/2026-07-28-add-quick-notes-workspace`. Lembretes,
checklists, Markdown, anexos, tags e conversão em registros formais permanecem
fora desta mudança.

Correção posterior: todos os inspectors laterais compartilhados fecham ao clicar
fora. O editor de notas é reinicializado pelo identificador da nota, impedindo
que título, texto, cor ou fixação vazem ao abrir outro cartão. A regressão foi
reproduzida com notas Lemon e Sky, validada no navegador e limpa do banco.

## Centro de notificações em 28 de julho de 2026

`add-telegram-notification-center` foi implementada, validada, aprovada,
sincronizada com as specs permanentes e arquivada em:

`openspec/changes/archive/2026-07-28-add-telegram-notification-center`.

A nova aba global **Configurações e notificações** possui Visão geral, Telegram,
Agendamentos e Histórico. O token não aparece nem é aceito na interface.

Backend concluído: cinco modelos aditivos, defaults desativados, setup
idempotente, integridade, cliente Telegram nativo, descoberta por
`/connect@bot_username`, confirmação de um grupo, relatórios consolidados,
particionamento em 3.800 caracteres, tentativas inicial + 1/5/15 minutos,
catch-up único após parada, histórico e reenvio por snapshot.

Validação concluída: setup duas vezes, integridade zerada, seis smoke suites,
build Vite e navegador em desktop, tablet e celular, claro e escuro. A bateria
Telegram simulou quatro partes, falha parcial, quatro tentativas, retomada,
deduplicação, no-data, reenvio e proteção do token. Registros temporários foram
removidos.

Ponto exato de retomada:

1. concluído: token privado carregado em `backend/.env`;
2. concluído: API reiniciada e bot `@QaBaseAssistentBot` validado;
3. concluído: comando `/connect@QaBaseAssistentBot` enviado;
4. concluído: supergrupo `QaBase` detectado e confirmado;
5. concluído tecnicamente: entrega de teste `#42`, mensagem Telegram `#6`,
   enviada na primeira tentativa e registrada como `Sent`;
6. concluído: usuário confirmou o recebimento e aprovou a entrega real `#42`.

Fechamento da validação: 200 entregas temporárias foram exercitadas no ledger,
com paginação em nove páginas. A entrega real foi filtrada, aberta no inspector
e conferida com destino, parte, tentativa e snapshot; o fechamento por `Esc`
também passou. As 200 entregas foram removidas e somente `#42` permaneceu.

Estado operacional final:

- token local configurado e não exposto;
- bot `@QaBaseAssistentBot` validado;
- supergrupo `QaBase` foi conectado e validado durante o teste real;
- teste `#42` enviado na primeira tentativa e aprovado;
- automação global ainda desativada por decisão segura;
- API precisa permanecer em execução e com acesso à internet para agendar,
  retentar e recuperar entregas;
- escopo atual continua limitado a um bot e um grupo fixo.

Ao selecionar **Reconectar**, a associação atual é removida e a automação é
desativada. Para descobrir novamente o mesmo grupo, é necessário enviar um novo
`/connect@QaBaseAssistentBot` no Telegram antes de usar **Buscar grupo**.

Nunca colar o token em chat, documento, banco ou interface. A ativação da
automação deve ser uma decisão explícita nas configurações.

## Multi-login e notas privadas em 28 de julho de 2026

A mudança `add-local-authentication-and-private-notes` adiciona três contas
locais fixas, login responsivo, sessão opaca de sete dias em cookie `HttpOnly`,
logout, Minha conta e alteração da própria senha. Não existe cadastro, remoção
de conta, recuperação por e-mail, papéis ou permissões nesta fase.

Projetos, repositório, fichas, planos, runs, demandas, terceiros e notificações
continuam compartilhados entre todos os usuários. Anotações rápidas são a única
área individual: listas, pastas diárias, buscas, contagens, leitura, edição,
fixação e exclusão sempre usam o usuário autenticado.

As notas legadas foram removidas durante a evolução do schema, conforme decisão
do produto. O bootstrap das contas é idempotente e não sobrescreve senhas já
alteradas. O comando `npm run user:reset-password -- <email>` exige a nova senha
em `QABASE_RESET_PASSWORD` e revoga as sessões da conta.

Ponto exato de retomada:

1. branch `codex/multi-login-private-notes` criada;
2. implementação backend e frontend concluída;
3. smoke de autenticação e isolamento entre usuários aprovado;
4. validação visual aprovada em desktop, tablet e celular, claro e escuro;
5. dados temporários e sessões de validação removidos;
6. executar a regressão final e validar o OpenSpec em modo estrito;
7. entregar para revisão do usuário sem arquivar a mudança;
8. após aprovação, sincronizar e arquivar;
9. criar uma segunda mudança OpenSpec para confirmações de criação, edição e
   exclusão, incluindo confirmação digitada do nome ao excluir um projeto.
