# API

Base local: `http://localhost:3001/api`

Todas as entradas JSON são validadas. Erros usam o formato:

```json
{ "error": "Mensagem clara" }
```

## Autenticação

A autenticação usa uma sessão opaca em cookie `HttpOnly`, sem armazenar tokens
no frontend. A sessão dura sete dias, usa `SameSite=Strict` e é renovada somente
por um novo login. Todas as rotas de negócio exigem uma sessão válida; somente
`GET /health` e `POST /auth/login` são públicas.

| Método | Endpoint | Finalidade |
|---|---|---|
| POST | `/auth/login` | Autenticar uma conta local fixa |
| GET | `/auth/session` | Restaurar a sessão e obter a identidade atual |
| POST | `/auth/logout` | Encerrar a sessão atual |
| PUT | `/auth/password` | Alterar a senha e revogar as demais sessões |
| POST | `/auth/password-notice` | Confirmar a leitura do aviso inicial |

O navegador deve enviar credenciais em todas as chamadas. Falhas de login usam
uma resposta genérica, e tentativas repetidas recebem limitação temporária. As
requisições de alteração também validam o cabeçalho `Origin` contra a origem
configurada do frontend.

## Projetos e repositório

| Método | Endpoint | Finalidade |
|---|---|---|
| GET | `/projects` | Listar projetos |
| POST | `/projects` | Criar projeto |
| PUT | `/projects/:id` | Atualizar projeto |
| DELETE | `/projects/:id` | Excluir projeto e dados vinculados |
| GET | `/projects/:id/backup` | Baixar o backup completo `.qabase` |
| POST | `/project-backups/preview` | Validar um backup sem escrever no banco |
| POST | `/project-backups/import?name=...` | Restaurar como um novo projeto |
| GET | `/projects/:projectId/dashboard` | Obter indicadores do projeto |
| GET/POST | `/projects/:projectId/suites` | Listar ou criar suítes |
| PUT/DELETE | `/suites/:id` | Atualizar ou excluir suíte |
| GET/POST | `/suites/:suiteId/cases` | Listar ou criar casos da suíte |
| GET | `/projects/:projectId/cases` | Buscar e filtrar casos do projeto |
| PUT/DELETE | `/cases/:id` | Atualizar ou excluir caso |
| GET/POST | `/projects/:projectId/components` | Listar ou criar componentes |
| PUT/DELETE | `/components/:id` | Renomear, reordenar ou excluir componente |

Casos aceitam `componentIds` com zero ou mais componentes do mesmo projeto. A
busca do repositório aceita `componentId` junto aos filtros existentes. Excluir
um componente remove somente suas associações, sem excluir os casos.

### Backup de projeto

Os endpoints de previa e importacao recebem o documento diretamente com
`Content-Type: application/vnd.qabase.project-backup+json`. O limite e 50 MiB.
O formato versionado inclui manifesto, contagens e SHA-256 do payload canonico.

A previa nao altera o banco. A importacao repete todas as verificacoes, exige um
nome valido e cria um projeto independente em uma unica transacao. Ela nunca
mescla, substitui ou exclui um projeto existente.

Erros de backup tambem retornam `code`, incluindo `INVALID_JSON`,
`INVALID_FORMAT`, `UNSUPPORTED_VERSION`, `INTEGRITY_FAILURE`,
`INVALID_STRUCTURE`, `BACKUP_TOO_LARGE` e `INVALID_PROJECT_NAME`.

O arquivo inclui somente dados vinculados ao projeto. Contas, sessoes, notas
rapidas, terceiros, Telegram e entregas globais de notificacoes ficam de fora.

## Fichas de validação

| Método | Endpoint | Finalidade |
|---|---|---|
| GET/POST | `/projects/:projectId/validation-folders` | Listar ou criar pastas |
| PUT/DELETE | `/validation-folders/:id` | Atualizar ou excluir pasta |
| GET/POST | `/projects/:projectId/validation-briefs` | Filtrar ou criar fichas |
| GET/PUT/DELETE | `/validation-briefs/:id` | Consultar, atualizar ou excluir ficha |
| POST | `/validation-briefs/:briefId/criteria` | Adicionar critério |
| PUT/DELETE | `/validation-criteria/:id` | Atualizar ou excluir critério |
| POST | `/validation-briefs/:briefId/checks` | Adicionar teste executável |
| PUT/DELETE | `/validation-checks/:id` | Registrar resultado ou excluir teste |
| POST | `/validation-briefs/:briefId/notes` | Adicionar anotação tipada |
| DELETE | `/validation-notes/:id` | Excluir anotação |
| POST | `/validation-checks/:id/promote` | Criar caso reutilizável vinculado |

Uma ficha aceita `Draft`, `InProgress`, `Blocked` ou `Completed`. Seu `sourceUrl`
é opcional e aceita apenas HTTP(S). A listagem pode usar `q`, `folderId` e
`status`; `folderId=unfiled` retorna fichas sem pasta.

```json
{
  "title": "Validar cupom no checkout",
  "folderId": 4,
  "sourceUrl": "https://jira.exemplo/browse/QAB-42",
  "objective": "Confirmar o cálculo do desconto",
  "scope": "Carrinho web",
  "status": "InProgress",
  "criteria": [{ "text": "O total reflete o desconto" }],
  "checks": [
    {
      "title": "Aplicar cupom válido",
      "expectedResult": "Desconto aplicado ao total"
    }
  ]
}
```

Excluir uma pasta preserva as fichas como sem pasta. Promover um teste exige
uma suíte do mesmo projeto e cria um caso com um passo estruturado.

## Planos

| Método | Endpoint | Finalidade |
|---|---|---|
| GET/POST | `/projects/:projectId/plans` | Listar ou criar planos |
| GET/PUT/DELETE | `/plans/:id` | Consultar, substituir ou excluir plano |

Corpo para criar ou substituir um plano:

```json
{
  "name": "Regressão de checkout",
  "description": "Fluxos críticos",
  "sections": [
    {
      "key": "preparacao",
      "name": "Preparação",
      "description": "Estado inicial do dispositivo",
      "items": [
        {
          "key": "ativar-alarme",
          "testCaseId": 12,
          "transitionInstructions": null,
          "dependsOnItemKey": null
        }
      ]
    },
    {
      "key": "reconexao",
      "name": "Reconexão",
      "items": [
        {
          "key": "reconectar-video",
          "testCaseId": 18,
          "transitionInstructions": "Mantenha o alarme ativo.",
          "dependsOnItemKey": "ativar-alarme"
        }
      ]
    }
  ]
}
```

Chaves de seção e item são locais à requisição. Uma dependência pode apontar
para exatamente um item anterior do mesmo plano. O mesmo caso pode aparecer
mais de uma vez e cada ocorrência mantém instruções e dependência próprias.

O formato legado com `testCaseIds` continua aceito e é convertido para a seção
`Casos do plano`. Um plano sem ocorrências é um rascunho válido, mas não pode
iniciar uma execução.

## Milestones

| Método | Endpoint | Finalidade |
|---|---|---|
| GET/POST | `/projects/:projectId/milestones` | Listar ou criar milestones |
| GET/PUT/DELETE | `/milestones/:id` | Consultar, atualizar ou excluir milestone |

```json
{
  "name": "Release 2.0",
  "description": "Validação final",
  "status": "Active",
  "startDate": "2026-07-20",
  "dueDate": "2026-07-31"
}
```

Estados aceitos: `Upcoming`, `Active` e `Completed`. Um milestone concluído não
pode ser associado a um novo run.

## Ambientes e configurações

| Método | Endpoint | Finalidade |
|---|---|---|
| GET/POST | `/projects/:projectId/environments` | Listar ou criar ambientes |
| PUT/DELETE | `/environments/:id` | Atualizar ou excluir ambiente |
| GET | `/projects/:projectId/configurations` | Listar grupos e opções |
| POST | `/projects/:projectId/configuration-groups` | Criar grupo |
| PUT/DELETE | `/configuration-groups/:id` | Atualizar, reordenar ou excluir grupo |
| POST | `/configuration-groups/:groupId/options` | Criar opção |
| PUT/DELETE | `/configuration-options/:id` | Atualizar ou excluir opção |

Ambiente:

```json
{
  "name": "Homologação",
  "description": "Ambiente estável",
  "target": "https://hml.exemplo.local"
}
```

Grupo e opção:

```json
{ "name": "Navegador", "position": 1 }
```

```json
{ "name": "Chrome" }
```

## Execuções

| Método | Endpoint | Finalidade |
|---|---|---|
| GET | `/projects/:projectId/runs` | Listar e filtrar runs |
| POST | `/projects/:projectId/runs` | Criar run |
| GET | `/runs/:id` | Obter workspace e snapshots |
| PUT | `/runs/:id` | Concluir run |
| PUT | `/run-cases/:runTestCaseId` | Registrar resultado |

Um run usa exatamente uma origem de escopo:

```json
{
  "name": "Release 2.0 - Checkout",
  "testPlanId": 3,
  "milestoneId": 4,
  "environmentId": 2,
  "configurationOptionIds": [5, 9]
}
```

ou:

```json
{
  "name": "Smoke avulso",
  "testCaseIds": [12, 18],
  "configurationOptionIds": []
}
```

Filtros aceitos em `GET /projects/:projectId/runs`:

- `testPlanId`
- `milestoneId`
- `environmentId`
- `configurationOptionId`

As respostas de listagem e detalhe incluem `context.testPlan`,
`context.milestone`, `context.environment` e `context.configurations`. Os nomes
são snapshots do momento da criação e permanecem legíveis após edição ou
exclusão das fontes.

Runs originados de plano também capturam seções, posições, ocorrências
repetidas, instruções de transição e dependências. Runs avulsos permanecem em
ordem contínua, sem depender de seções de planejamento.

`PUT /run-cases/:runTestCaseId` aceita:

```json
{
  "status": "Failed",
  "comment": "Reconexão não recuperou o vídeo.",
  "evidence": "Log local e captura da tela 3",
  "defectLink": "https://jira.exemplo/browse/QAB-84",
  "executor": "Vitor",
  "duration": 180
}
```

Uma ocorrência dependente fica bloqueada enquanto seu pré-requisito está
`Untested`. Qualquer resultado terminal libera a execução e o resumo do
pré-requisito permanece visível como contexto. Resultados são independentes por
ocorrência, inclusive quando o mesmo caso foi repetido no plano.

## Demandas de produção

| Método | Rota | Uso |
|---|---|---|
| GET | `/projects/:projectId/production-demands` | Lista e filtra ADs e MFs |
| GET | `/projects/:projectId/production-demands/summary` | Resume ativas, atrasadas, sem data e ADs de criticidade alta |
| POST | `/projects/:projectId/production-demands` | Cria uma demanda |
| GET | `/production-demands/:id` | Retorna detalhe, vínculos e linha do tempo |
| PUT | `/production-demands/:id` | Atualiza uma demanda ativa |
| DELETE | `/production-demands/:id` | Exclui uma demanda ativa |
| POST | `/production-demands/:id/notes` | Adiciona uma anotação |
| DELETE | `/production-demand-activities/:id` | Exclui somente uma anotação elegível |
| POST | `/production-demands/:id/close` | Encerra com dados específicos de AD ou MF |
| POST | `/production-demands/:id/reopen` | Reabre com motivo obrigatório |

Filtros combináveis: `q`, `type`, `status`, `criticality`, `qaOwner` e
`deadlineState`. O código é único por projeto e tipo sem distinguir maiúsculas,
minúsculas ou espaços externos.

MF recebe prazo automático de 20 dias corridos desde `registeredAt`. Seu
encerramento exige `workaroundSummary`, `workaroundDeliveredAt` e
`closureReason`. AD aceita `dueDate` nula, exige criticidade e quantidade
afetada positivas e, para encerrar, requer `resolutionSummary`,
`productionReleasedAt` e `closureReason`; `productionVersion` é opcional.

Demandas encerradas não aceitam edição, exclusão ou remoção de notas até serem
reabertas. O tipo AD/MF é imutável após a criação. Vínculos opcionais com ficha,
run, milestone e AD definitiva precisam pertencer ao mesmo projeto.

## Acessos de terceiros

| Método | Rota | Uso |
|---|---|---|
| GET | `/third-parties` | Lista o cadastro global com filtros combináveis |
| GET | `/third-parties/summary` | Resume total, ativos, a vencer, vencidos e encerrados |
| POST | `/third-parties` | Cria identidade, primeiro ciclo e acessos |
| GET | `/third-parties/:id` | Retorna ciclo atual, histórico e atividades |
| PUT | `/third-parties/:id` | Atualiza somente os dados da identidade |
| DELETE | `/third-parties/:id` | Exclui permanentemente somente um terceiro encerrado |
| POST | `/third-parties/:id/renew` | Encerra o ciclo atual como renovado e cria o próximo |
| POST | `/third-parties/:id/close` | Encerra o ciclo atual com motivo obrigatório |
| POST | `/third-parties/:id/notes` | Registra uma anotação opcionalmente assinada |
| DELETE | `/third-party-access-activities/:id` | Exclui somente anotações do usuário |

Filtros aceitos em `GET /third-parties`: `q`, `state`, `system`, `company` e
`internalOwner`. Estados derivados: `Active`, `Expiring` para zero a sete dias,
`Expired` e `Closed`. A ordenação prioriza vencidos, próximos do vencimento,
ativos e encerrados.

Os sistemas permitidos são `Teams`, `GitLab`, `VPN`, `Jira` e `Confluence`.
Cada ciclo começa na aprovação e pode terminar antes, mas nunca depois de três
meses de calendário. Datas no fim do mês são ajustadas para o último dia válido
do mês de destino. Renovação e encerramento preservam todos os ciclos anteriores.
Uma exclusão é aceita somente quando não existe ciclo aberto e remove em cascata
a identidade, seus ciclos, acessos e atividades.

## Anotações rápidas

| Método | Rota | Uso |
|---|---|---|
| GET | `/quick-notes/days` | Retorna hoje, total e contagem por dia de criação |
| GET | `/quick-notes` | Lista notas por dia, busca global e estado de fixação |
| POST | `/quick-notes` | Cria uma nota no dia civil atual |
| GET | `/quick-notes/:id` | Retorna uma nota para edição |
| PUT | `/quick-notes/:id` | Atualiza título, texto, cor e fixação |
| DELETE | `/quick-notes/:id` | Exclui definitivamente uma nota |

`GET /quick-notes` aceita `day=YYYY-MM-DD`, `q` e `pinned=true|false`. Quando
`q` está presente, a busca percorre título e texto em todos os dias. A ordenação
sempre coloca notas fixadas primeiro e usa a atualização mais recente como
desempate.

Todas as operações de anotações rápidas são limitadas ao usuário autenticado.
Uma nota pertencente a outra pessoa não aparece em listas, buscas ou contagens
e responde como não encontrada em consultas, edições e exclusões diretas.

O título é opcional e o texto é obrigatório, com limite de 10.000 caracteres.
As cores aceitas são `Paper`, `Lemon`, `Mint`, `Sky`, `Lilac`, `Rose` e
`Coral`. `createdDay` é definido uma vez no fuso `QABASE_TIME_ZONE`, cujo padrão
é `America/Sao_Paulo`, e não pode ser alterado por uma edição.

## Configurações e notificações

| Método | Rota | Uso |
|---|---|---|
| GET | `/notifications/overview` | Resume prontidão, próximas agendas e últimas entregas |
| GET/PUT | `/notifications/settings` | Consulta ou substitui a configuração global |
| GET | `/notifications/telegram/status` | Valida bot e grupo sem retornar o token |
| POST | `/notifications/telegram/discover` | Busca comandos recentes de conexão em grupos |
| POST | `/notifications/telegram/connect` | Confirma um grupo descoberto como destino fixo |
| DELETE | `/notifications/telegram/connection` | Desconecta o grupo e desativa os envios |
| POST | `/notifications/telegram/test` | Envia e registra uma mensagem real de teste |
| GET | `/notifications/deliveries` | Lista o histórico paginado e filtrável |
| GET | `/notifications/deliveries/:id` | Retorna partes, tentativas, erros e snapshot |
| POST | `/notifications/deliveries/:id/resend` | Cria um reenvio ligado ao snapshot original |

`PUT /notifications/settings` recebe `enabled`, `timeZone`, `sendTime`,
`demandCadenceDays` e `accessLeadDays`. O token vem exclusivamente de
`TELEGRAM_BOT_TOKEN` no ambiente do backend e nunca integra uma resposta.

O histórico aceita `type`, `trigger`, `status`, `page` e `pageSize`. Execuções
sem registros elegíveis ficam como `NoData` e não enviam mensagem. Relatórios
longos são divididos em partes; cada parte guarda suas próprias tentativas e
identificador do Telegram.
