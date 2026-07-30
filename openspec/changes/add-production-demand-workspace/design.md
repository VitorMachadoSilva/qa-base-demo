## Context

O QaBase já organiza casos, planos, execuções, milestones e fichas de validação,
mas não possui um domínio para acompanhar problemas encontrados por usuários em
produção e escalados pelo suporte. A equipe diferencia MF, encerrado quando uma
solução paliativa é entregue, de AD, encerrada somente quando a correção chega à
produção.

A aplicação continua local, sem autenticação e sobre SQLite. Contato do suporte
e responsável de QA serão referências textuais, não contas de usuário. A
primeira versão precisa funcionar sem Jira, Telegram ou configuração global,
mas seus dados devem permitir essas evoluções posteriores.

O desenho adota padrões enxutos de gestão de incidentes e problemas: fila com
prazo, estado e responsável; linha do tempo; e vínculo entre a resposta imediata
e a correção definitiva. Esses padrões correspondem às orientações oficiais de
[incident management](https://www.atlassian.com/software/jira/service-management/product-guide/getting-started/incident-management)
e [problem management](https://www.atlassian.com/software/jira/service-management/product-guide/getting-started/problem-management)
do Jira Service Management, sem importar workflows corporativos.

## Goals / Non-Goals

**Goals:**

- fornecer uma fonte local única para ADs e MFs por projeto;
- tornar prazo, impacto, contato e responsabilidade comparáveis em uma fila;
- aplicar regras distintas de prazo e encerramento por tipo;
- preservar uma linha do tempo legível de decisões e observações;
- vincular a demanda ao trabalho de teste sem acoplar os domínios;
- manter API, migração e interface coerentes com os padrões atuais do QaBase.

**Non-Goals:**

- gerenciar acessos de terceiros;
- enviar Telegram, email ou qualquer notificação externa;
- tornar o SLA configurável nesta mudança;
- sincronizar ou importar chamados do Jira;
- armazenar anexos, logs sensíveis ou dados de clientes;
- introduzir autenticação, permissões, atribuição por usuário ou colaboração;
- substituir o repositório, as fichas de validação ou o fluxo de runs.

## Decisions

### 1. Um agregado comum com regras por tipo

`ProductionDemand` armazenará os campos comuns e um tipo imutável `AD` ou `MF`.
Campos específicos permanecerão anuláveis no banco e serão obrigatórios pela
validação conforme o tipo.

Campos principais:

- `projectId`, `type`, `code`, `normalizedCode`, `sourceUrl`;
- `title`, `description`, `supportContact`, `qaOwner`;
- `status`, `registeredAt`, `dueDate`;
- `criticality`, `affectedUsersCount`;
- `workaroundSummary`, `workaroundDeliveredAt`;
- `resolutionSummary`, `productionVersion`, `productionReleasedAt`;
- `closedAt`, `closureReason`, timestamps.

O código será único por projeto e tipo após normalização. Um modelo único evita
duplicar listagem, filtros, vínculos e histórico. Tabelas separadas para AD e MF
foram descartadas porque aumentariam o custo de consultas e da interface sem
benefício para a escala local.

### 2. Ciclo de vida comum e encerramento explícito

Os estados serão `Open`, `InProgress`, `Waiting` e `Closed`. Mudanças entre
estados ativos serão permitidas; fechar e reabrir usarão operações explícitas
para aplicar regras e registrar atividades.

- MF exige resumo e data de entrega da solução paliativa para fechar.
- AD exige resumo e data em que a correção chegou à produção para fechar.
- Reabrir exige motivo, retorna a demanda para `InProgress` e preserva no
  histórico os dados do encerramento anterior.
- O tipo não poderá mudar depois da criação.

Workflows específicos mais extensos foram descartados nesta fase porque os
estados atuais da equipe ainda não foram estabilizados. O estado comum permite
trabalhar agora sem impedir uma evolução configurável.

### 3. Prazo persistido e estado temporal derivado

No cadastro de MF, `dueDate` será calculada como 20 dias corridos após
`registeredAt`. Alterar a data de registro recalculará o prazo enquanto o MF
estiver ativo. AD aceitará `dueDate` opcional e exibirá `Sem data` quando ausente.

A API derivará `deadlineState` e `daysRemaining` a partir da data local:
`NoDate`, `OnTrack`, `DueToday`, `Overdue` ou `Closed`. Persistir a data, em vez
de somente recalculá-la em toda leitura, preserva o compromisso assumido e
permite que uma futura configuração de SLA se aplique apenas às novas demandas.

### 4. Vínculos opcionais e isolados por projeto

Uma demanda poderá apontar para uma ficha de validação, run e milestone do mesmo
projeto. Um MF também poderá apontar para uma AD do mesmo projeto; uma AD poderá
receber vários MFs.

As relações com outros domínios usarão `SetNull`. Ao remover uma origem, a
atividade que registrou o vínculo continuará com seu texto descritivo. Duplicar
dados completos dos registros vinculados foi descartado porque a demanda não é
um snapshot de execução.

### 5. Linha do tempo append-only

`ProductionDemandActivity` guardará `kind`, mensagem, autor textual opcional,
estado anterior, estado seguinte e data. O backend criará atividades para
criação, mudanças de estado, vínculos, encerramento e reabertura; notas serão
adicionadas por endpoint próprio.

Atividades não serão editáveis. Uma nota incorreta poderá ser excluída somente
enquanto a demanda estiver aberta e por confirmação explícita, mantendo o
restante do histórico. Um log genérico em JSON foi descartado para preservar
consultas e respostas legíveis.

### 6. API transacional e coleção operacional

A API fornecerá:

- listagem e criação por projeto;
- detalhe, atualização e exclusão;
- resumo operacional por projeto;
- adição de nota;
- encerramento e reabertura.

Filtros combinarão busca, tipo, estado, criticidade, responsável e condição de
prazo. Atualização, encerramento e atividade correspondente ocorrerão na mesma
transação.

### 7. Workspace próprio no shell

`Demandas` será um destino do projeto. A tela usará:

- faixa compacta com totais ativos, atrasados, sem data e ADs de alta
  criticidade;
- toolbar com busca e filtros combinados;
- ledger contínuo com código, tipo, título, estado, impacto, responsável e
  prazo;
- inspector lateral largo para cadastro, edição, vínculos e linha do tempo;
- estados vazio, carregando, erro e coleção populada;
- drawer de largura total no mobile e adaptação para tablet;
- os temas Light instrument e Graphite bench.

O inspector seguirá a mesma largura ampliada dos demais componentes laterais.
Cards aninhados e um dashboard separado foram descartados para manter a tarefa
principal, acompanhar a fila, como primeiro nível da página.

## Risks / Trade-offs

- [Estados comuns podem ser insuficientes no futuro] → manter o histórico e
  permitir posterior migração para workflow configurável.
- [Responsáveis textuais podem variar na grafia] → oferecer sugestões com
  valores recentes sem criar um cadastro de usuários prematuro.
- [Alterar a data do MF muda o prazo] → registrar a alteração na linha do tempo
  e bloquear mudanças depois do encerramento.
- [Hard delete reduz rastreabilidade] → exigir confirmação forte e impedir
  exclusão de demanda fechada até que ela seja reaberta.
- [Datas locais podem variar por fuso] → persistir início do dia em UTC e
  calcular dias civis no fuso local configurado da aplicação.
- [Vínculos removidos deixam relações nulas] → preservar descrição e código no
  texto da atividade histórica.

## Migration Plan

1. Criar `ProductionDemand` e `ProductionDemandActivity` por migration aditiva.
2. Atualizar o setup idempotente para bases novas e existentes.
3. Gerar o Prisma Client e executar verificação de isolamento e integridade.
4. Registrar rotas e disponibilizar o workspace somente após a API estar pronta.
5. Validar base existente, base vazia e reexecução do setup.

Não há dados anteriores para backfill. Em rollback antes do uso, as novas
tabelas podem ser removidas. Depois que houver dados reais, o rollback deverá
usar backup do SQLite e nunca eliminar as tabelas automaticamente.

## Open Questions

Não há decisão bloqueante. SLA configurável, catálogo de pessoas, notificações
e workflow personalizado permanecem deliberadamente reservados para mudanças
posteriores.
