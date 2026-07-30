# Estado da implementação

Atualizado em 28 de julho de 2026.

## Entregue

O QaBase possui um workspace local funcional para:

- projetos, suítes hierárquicas, casos e passos estruturados;
- busca e filtros por metadados;
- catálogo de componentes transversais com associação múltipla por caso;
- planos de teste com seções, ocorrências repetidas e ordem local;
- instruções de transição e uma dependência anterior por ocorrência;
- milestones com datas, estados e progresso agregado;
- ambientes e configurações reutilizáveis;
- runs avulsos ou originados de plano;
- resultados por ocorrência, duração, comentários, evidência, defeito e executor;
- snapshots históricos do escopo e do contexto;
- histórico com filtros por plano, milestone, ambiente e configuração;
- dashboard com indicadores acionáveis;
- design system `Quality Instrument` com tokens semânticos e IBM Plex local;
- shell responsivo com rail global, contexto recolhível, drawer de tablet e
  navegação inferior mobile;
- ledgers contínuos, inspectors contextuais e overlays responsivos;
- workspace de execução com fila, contexto capturado e dock de resultado;
- fixture isolado para estados e coleções de até 200 registros;
- temas Light instrument e Graphite bench com persistência local;
- seletor acessível no shell e aplicação do tema antes da montagem React.
- fichas de validação com pastas hierárquicas definidas pelo usuário;
- objetivo, escopo, link do card, critérios, checklist executável e notas;
- progresso derivado e estados de rascunho, validação, bloqueio e conclusão;
- promoção transacional de teste da ficha para caso do repositório.
- gestão global de terceiros com ciclos trimestrais e histórico;
- exclusão permanente de terceiros limitada a identidades já encerradas;
- anotações rápidas privadas por usuário com pastas diárias, busca, fixação e cores;
- autenticação local com três contas fixas e sessão persistente de sete dias;
- área Minha conta para alteração de senha e encerramento da sessão.

## Decisões de implementação

- Autenticação local sem provedor externo, cadastro aberto, papéis ou permissões.
- Dados de negócio permanecem compartilhados; somente anotações rápidas são
  isoladas pelo usuário autenticado.
- Sessões usam tokens opacos em cookie `HttpOnly`; somente o hash do token é
  persistido.
- Zod valida entradas e a API retorna `{ "error": "Mensagem clara" }`.
- `frontend/src/services/api.js` centraliza contratos HTTP.
- `RunDialog.jsx` é compartilhado entre o repositório e os planos.
- `PlanningWorkspace.jsx` concentra Planos, Milestones e Contextos.
- Novas relações de run são opcionais para preservar compatibilidade.
- Snapshots continuam válidos após renomear ou excluir registros de origem.
- Um run aceita um plano ou casos avulsos, nunca ambos.
- No máximo uma opção de cada grupo pode ser selecionada.
- Fichas são independentes de planos e runs para preservar o foco na card.
- Excluir uma pasta mantém suas fichas em `Sem pasta`.
- A integração externa desta fase se limita a armazenar um link HTTP(S).
- Suítes continuam sendo a organização principal; componentes são etiquetas
  transversais isoladas por projeto.
- Uma dependência sempre aponta para uma ocorrência anterior do mesmo plano.
- O run captura seções e dependências e não muda após editar o plano de origem.
- Planos legados são lidos em uma seção padrão sem quebrar clientes anteriores.

## Validação mais recente

- setup de banco executado duas vezes;
- Prisma Client gerado;
- run legado lido com contexto nulo;
- integridade do SQLite aprovada, sem órfãos ou vínculos cruzados;
- smoke test da API aprovado para fluxos antigos e novos;
- build de produção Vite aprovado;
- fluxo visual aprovado em desktop e 390 x 844;
- console do navegador sem erros;
- snapshots e filtros confirmados pela interface;
- 21 capturas finais para desktop, tablet e mobile;
- reflow equivalente a zoom de 200% sem overflow de página;
- 0, 1, 20 e 200 linhas verificadas no ledger compartilhado;
- temas claro e escuro aprovados em 1440 x 900 e 390 x 844;
- contraste dos estados semânticos medido e aprovado em WCAG AA;
- persistência após recarregamento e console sem erros confirmados.
- fluxo de ficha aprovado no navegador em desktop, tablet e 390 x 844;
- checklist, evidência e diálogo de promoção confirmados nos dois temas;
- OpenSpec `add-validation-brief-workspace` aprovado em modo estrito.
- migração aditiva e instalação limpa aprovadas para planos compostos;
- smoke específico aprovado para componentes, repetições e dependências;
- editor composto e execução guiada aprovados em 1280, 820 e 390 pixels;
- temas claro e escuro, foco por teclado e ausência de overflow confirmados;
- build Vite aprovado com 1.599 módulos transformados.
- banco migrado e banco novo aprovados para `ProductionDemand` e atividades;
- smoke dedicado de AD/MF aprovado para filtros, prazo, links e ciclo de vida;
- workspace Demandas aprovado em 1280, 820 e 390 x 844;
- temas claro e escuro, estados vazio, atrasado, sem data e encerrado aprovados;
- fila com 200 registros, conteúdo longo, diálogo e Escape verificados;
- data sugerida no formulário corrigida para o calendário local do usuário;
- build Vite final aprovado com 1.601 módulos transformados.
- gestão global de terceiros aprovada com quatro tabelas aditivas e integridade zerada;
- prazo de três meses, ajuste de fim de mês, filtros, renovação, encerramento e notas aprovados;
- workspace Acessos de terceiros aprovado em 1280, 820 e 390 x 844, claro e escuro;
- estados vazio, ativo, a vencer, vencido, encerrado e conteúdo longo verificados;
- ledger com 200 registros carregado em 461 ms, sem overflow horizontal;
- smoke dedicado e todos os smoke tests anteriores aprovados;
- build Vite aprovado com 1.602 módulos transformados.
- tabela aditiva `QuickNote`, setup idempotente e integridade de notas aprovados;
- smoke dedicado de notas aprovado para validação, fuso, busca, ordenação,
  edição, fixação, cor, dia imutável, exclusão e limpeza;
- todos os quatro smoke tests anteriores passaram sem regressões;
- workspace Anotações rápidas aprovado em 1280, 820 e 390 x 844;
- temas claro e escuro, estado vazio, busca, texto longo, editor e Escape verificados;
- 200 cartões renderizados com alturas estáveis e sem overflow horizontal;
- reflow equivalente a 200%, build com 1.603 módulos e limpeza final aprovados.
- inspectors laterais compartilhados fecham ao clicar fora sem salvar;
- editor de notas isolado por identidade, sem herdar cor ou conteúdo da nota anterior.

## Estado OpenSpec

A mudança ativa `add-local-authentication-and-private-notes` está implementada
na branch `codex/multi-login-private-notes` e aguarda revisão do usuário antes
de sincronização e arquivamento. Ela adiciona login local, sessão de sete dias,
Minha conta, alteração de senha e isolamento das anotações rápidas.

A mudança ativa `evolve-composite-test-plans` está implementada e validada em
modo estrito, com 44 de 44 tarefas concluídas. Ela adiciona componentes
transversais, planos compostos e execução guiada por dependências; sua evidência
está em
`openspec/changes/evolve-composite-test-plans/verification.md`.

`add-validation-brief-workspace` permanece implementada e validada, com
22 de 22 tarefas concluídas. Sua evidência está em
`openspec/changes/add-validation-brief-workspace/VALIDATION.md`.

`add-quality-instrument-themes` permanece implementada e validada, ainda sem
arquivamento.

A linguagem visual base permanece sincronizada na spec principal
`openspec/specs/quality-instrument-interface/spec.md`.

`add-production-demand-workspace` está implementada e validada, aguardando
revisão e arquivamento. Ela entrega a fila operacional de AD/MF, API, histórico,
vínculos e regras de encerramento. A evidência está em
`openspec/changes/add-production-demand-workspace/verification.md`.

`establish-quality-instrument-design-system` está concluída e arquivada em
`openspec/changes/archive/2026-07-27-establish-quality-instrument-design-system`.
Sua matriz de validação foi preservada dentro do arquivo.

`add-test-planning-context` permanece concluída e arquivada em
`openspec/changes/archive/2026-07-26-add-test-planning-context`.

`add-quick-notes-workspace` está implementada, validada, sincronizada e
arquivada. Ela adiciona memória de trabalho global, pastas automáticas por dia,
busca, fixação, cores e edição. A evidência está em
`openspec/changes/archive/2026-07-28-add-quick-notes-workspace/verification.md`.

## Próxima evolução

Próximas mudanças candidatas:

1. importação e exportação de casos;
2. anexos e evidências locais nas fichas e execuções;
3. comparação e tendência entre runs.

## Diálogos de confirmação

As confirmações e entradas curtas que antecedem ações críticas usam um modal
interno único, adaptado aos temas claro e escuro e ao celular. O componente
preserva foco, aceita `Escape` e clique no fundo para cancelar e devolve o foco
ao controle de origem. Nenhum fluxo da interface depende de `alert`, `confirm`
ou `prompt` nativo do navegador.

A exclusão completa de um projeto exige a digitação exata do nome antes de
liberar a ação permanente.

## Centro de notificações Telegram

A mudança `add-telegram-notification-center` foi concluída, sincronizada e
arquivada em
`openspec/changes/archive/2026-07-28-add-telegram-notification-center`.
Modelos, migration, setup idempotente, integridade, transporte HTTPS nativo,
descoberta do grupo, renderização HTML segura, divisão em partes, fila, retries,
catch-up, API, workspace global e smoke dedicado estão implementados.

Defaults: `America/Sao_Paulo`, `09:00`, AD/MF a cada dois dias e acessos com
antecedências de sete e dois dias, além do vencimento e aviso diário após
vencer. A automação nasce desativada.

Evidências atuais:

- schema Prisma formatado e validado; setup executado duas vezes;
- dez verificações de integridade de notificações em zero;
- smoke Telegram com quatro partes, quatro tentativas, falha parcial, catch-up,
  deduplicação, reenvio e proteção do segredo;
- todos os cinco smoke tests anteriores aprovados;
- build Vite aprovado com 1.604 módulos;
- navegador aprovado em 1280, 820 e 390 x 844, claro e escuro, sem erros de
  console ou sobreposição.

### Validação real concluída

O bot `@QaBaseAssistentBot` foi validado, o supergrupo `QaBase` foi descoberto
por comando explícito e confirmado como destino fixo. A entrega real `#42`
recebeu o identificador Telegram `6`, foi enviada na primeira tentativa e
aprovada pelo usuário.

O ledger foi validado com 201 registros e nove páginas. Depois da inspeção da
entrega real, as 200 entregas artificiais foram removidas. O banco terminou com
uma entrega, uma parte, uma tentativa e zero violações de integridade.

O fluxo **Reconectar** remove a associação vigente e desativa a automação. Uma
nova busca exige outro `/connect@QaBaseAssistentBot` enviado no grupo.
