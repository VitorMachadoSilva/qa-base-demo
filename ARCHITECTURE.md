# Arquitetura

## Visão geral

O QaBase é uma aplicação local de gestão de testes formada por:

- React e Vite no frontend;
- Node.js, Express e Zod na API;
- Prisma sobre um arquivo SQLite local;
- OpenSpec para governar mudanças funcionais.

O acesso usa autenticação local com contas fixas e sessões persistidas no
SQLite. Não há provedor de identidade, banco externo ou dependência de nuvem
para autenticação.

## Organização

```text
backend/
  prisma/
    schema.prisma
    migrations/
  scripts/
    checkDatabase.js
    smoke.js
  src/
    controllers/
    db/
    routes/
    validation/

frontend/
  src/
    App.jsx
    DesignSystemFixture.jsx
    PlanningWorkspace.jsx
    RunDialog.jsx
    TestRepository.jsx
    TestRuns.jsx
    ValidationWorkspace.jsx
    components/
      AppShell.jsx
      QualityPrimitives.jsx
    services/api.js
    styles.css
    styles/
      tokens.css
      base.css
```

### Identidade e sessão

`User` representa uma das contas locais permitidas. Senhas são derivadas com
`scrypt`, salt aleatório e formato versionado; texto puro nunca é persistido.
`Session` guarda somente o hash SHA-256 de um token opaco aleatório, seu prazo e
a última utilização. O token existe apenas em cookie `HttpOnly`,
`SameSite=Strict`, com duração de sete dias.

O bootstrap cria as três identidades fixas de forma idempotente e não substitui
senhas que já tenham sido alteradas. A troca de senha revoga as demais sessões.
Um comando operacional permite redefinir uma conta local sem expor a nova senha
na linha de comando. Todas as rotas de negócio passam pelo middleware de
autenticação, e mutações validam a origem do frontend.
      components.css
      workspaces.css
      responsive.css

openspec/
  changes/
  specs/
```

## Fluxo

```text
React -> services/api.js -> rota Express -> controller -> Prisma -> SQLite
```

Rotas conectam endpoints aos controllers. Controllers validam parâmetros,
isolamento por projeto e regras de domínio antes de persistir.

### Portabilidade e backup de projetos

`projectBackupContract.js` define o contrato `.qabase` versao 1, suas colecoes,
schemas estritos, serializacao canonica e checksum SHA-256.
`projectBackupService.js` le o grafo completo em uma transacao de snapshot e
substitui ids locais por referencias portateis.

A restauracao valida formato, versao, checksum, contagens, referencias,
unicidade e ciclos antes de abrir uma transacao de escrita. Dentro dela, cada
referencia recebe um novo id e os vinculos autorreferentes sao resolvidos em um
segundo passe. Qualquer falha desfaz o novo projeto integralmente.

O parser de importacao aceita no maximo 50 MiB e esta isolado das demais rotas
JSON. Backups sao portateis, mas nao criptografados; devem ser guardados em local
protegido. Dados privados e configuracoes globais nao pertencem ao grafo
exportado.

## Modelo de domínio

```text
Project
├── Suite
│   ├── Suite (filha)
│   └── TestCase
│       ├── TestStep
│       ├── TestCaseComponent
│       └── TestPlanItem (ocorrência)
├── TestComponent
│   └── TestCaseComponent
├── TestPlan
│   └── TestPlanSection
│       └── TestPlanItem
├── Milestone
├── Environment
├── ConfigurationGroup
│   └── ConfigurationOption
├── ValidationFolder
│   ├── ValidationFolder (filha)
│   └── ValidationBrief
│       ├── ValidationCriterion
│       ├── ValidationCheck
│       └── ValidationNote
└── Run
    ├── RunPlanSection
    │   └── RunTestCase
    └── RunConfiguration
```

### Repositório

Suítes formam uma árvore com proteção contra ciclos e vínculos entre projetos.
Casos possuem passos ordenados e metadados de prioridade, tipo, severidade e
automação. `TestComponent` cria uma classificação transversal muitos-para-muitos
sem substituir a suíte principal do caso.

### Planejamento

`TestPlan` organiza ocorrências em `TestPlanSection`. A posição é local à seção,
o mesmo caso pode se repetir e cada ocorrência pode guardar instruções de
transição e uma dependência para um único item anterior do plano. A hierarquia
completa é substituída em uma transação. Excluir um caso remove suas ocorrências
do plano em cascata; o plano não duplica a definição do caso.

`Milestone` representa uma entrega e possui ciclo de vida explícito.
`Environment` descreve o alvo. Grupos e opções representam dimensões
independentes, como navegador e sistema operacional.

### Execução e snapshots

Um `Run` nasce de um plano ou de uma seleção avulsa. O run guarda snapshots dos
nomes do plano, milestone e ambiente. `RunConfiguration` guarda snapshots do
grupo e da opção. `RunPlanSection` e `RunTestCase` preservam a estrutura do plano,
incluindo ordem, repetições, transições e dependências. `RunTestCase` guarda a
definição completa do caso e o resultado independente da ocorrência.

Uma ocorrência dependente só aceita resultado depois que seu pré-requisito deixa
`Untested`. O resultado terminal libera a continuidade sem exigir que o
pré-requisito tenha passado.

Referências históricas usam `SetNull`. A exclusão das fontes não remove a
evidência capturada.

### Validação focada

`ValidationFolder` forma uma hierarquia livre por projeto. `ValidationBrief`
concentra o contexto de uma card sem assumir tipos fixos de bug ou melhoria.
Critérios e testes possuem posições estáveis; notas são cronológicas e tipadas.

Uma promoção cria `TestCase` e `TestStep` na mesma transação e mantém a
rastreabilidade em `ValidationCheck.testCaseId`. Se o caso for excluído, a
definição original do teste da ficha permanece disponível.

### Demandas recebidas da produção

`ProductionDemand` representa AD e MF dentro do projeto. Campos comuns guardam
código normalizado, origem, descrição, contato do suporte, responsável de QA,
estado e datas. Campos condicionais registram criticidade e impacto da AD ou a
solução paliativa do MF.

MF aponta opcionalmente para uma AD definitiva por autorrelação. Ficha de
validação, run e milestone são vínculos opcionais validados no mesmo projeto e
usam `SetNull`, evitando que a exclusão da fonte apague a demanda.

`ProductionDemandActivity` mantém eventos de sistema e notas em ordem
cronológica. Mensagens legíveis registradas no momento da alteração preservam o
contexto de vínculos mesmo se a fonte for renomeada ou excluída. Encerrar e
reabrir são transações explícitas; o prazo exibido é derivado em dias civis UTC
para evitar diferença de horário no servidor.

### Gestão global de terceiros

`ThirdParty` é uma identidade global, independente de projeto. Nome e empresa
normalizados formam a chave de unicidade. `ThirdPartyAccessCycle` representa uma
vigência histórica; apenas um ciclo sem encerramento pode existir por identidade,
regra reforçada por índice parcial no SQLite.

`ThirdPartyAccessGrant` registra um dos cinco sistemas fixos por ciclo e impede
duplicidade. `ThirdPartyAccessActivity` guarda eventos de sistema e notas. A
renovação fecha o ciclo anterior e cria o seguinte na mesma transação. O estado
operacional e a distância em dias são derivados no servidor, sem persistir
informação que envelheceria.

### Memória de trabalho individual

`QuickNote` é independente de projeto, mas pertence obrigatoriamente a um
`User`. Guarda título opcional, texto, chave de paleta, fixação, `createdDay`,
criação e atualização. As pastas por dia são virtuais: não existe tabela de
pasta, e a API deriva as contagens do dia civil imutável de cada nota sempre
dentro do proprietário autenticado.

O backend calcula novos dias no fuso configurado por `QABASE_TIME_ZONE`, com
`America/Sao_Paulo` como padrão. Alterar o fuso afeta somente novas notas. A
interface usa busca global, escopo diário e ordenação determinística com
fixadas primeiro, mantendo o módulo local e sem dependência de serviços
externos.

## Compatibilidade do SQLite

As migrations SQL ficam versionadas. Como `prisma migrate dev` falhou com o
schema engine neste ambiente, o projeto também mantém:

- setup aditivo e idempotente;
- geração explícita do Prisma Client;
- verificação de órfãos, posições e vínculos entre projetos;
- smoke test pela API.

O setup pode ser executado mais de uma vez e preserva runs legados, cujo contexto
de planejamento é `null`. A migração de planos compostos cria uma seção
`Casos do plano` para cada plano anterior e replica a estrutura correspondente
nos runs sem alterar resultados históricos.

## Decisões

1. JavaScript enquanto o produto permanece pessoal e compacto.
2. REST JSON em vez de GraphQL.
3. Estado local React sem biblioteca global.
4. SQLite e arquivos locais fora de integrações externas.
5. Snapshots para toda informação histórica mutável.
6. Mudanças funcionais relevantes passam pelo workflow OpenSpec.
7. A interface usa o design system nativo `Quality Instrument`, sem framework
   visual externo.
8. O shell separa navegação global, contexto do projeto e canvas operacional;
   hash navigation continua sendo o mecanismo de rota.
9. AD e MF compartilham uma fila operacional, mas mantêm regras de impacto e
   encerramento distintas.
10. A gestão de terceiros e as notificações permanecem compartilhadas entre
    usuários e desacopladas de projetos.
11. Anotações rápidas usam pastas virtuais por dia de criação; o dia é imutável
    e cores são chaves semânticas, não valores CSS persistidos; toda consulta
    inclui o proprietário autenticado.
12. O centro de notificações usa um agendador civil dentro do processo Express,
    com deduplicação final no SQLite e recuperação de apenas uma execução
    perdida por tipo de relatório.
13. `NotificationDelivery`, `NotificationMessagePart` e `NotificationAttempt`
    separam relatório lógico, partes enviáveis e chamadas externas. Snapshots
    preservam o conteúdo e o destino usados em cada entrega.
14. `TELEGRAM_BOT_TOKEN` existe somente no ambiente do backend. A API persiste
    identidade segura do bot e do grupo, nunca o segredo ou URLs com o segredo.
15. A implantação compartilhada deve usar HTTPS e
    `QABASE_SECURE_COOKIES=true`; HTTP é admitido apenas no desenvolvimento
    local.

## Pipeline de notificações

```text
Relógio civil -> seleção AD/MF ou acessos -> snapshot -> partes <= 3.800 chars
              -> Telegram -> tentativa -> retry 1/5/15 min -> histórico
```

O agendador verifica trabalho a cada minuto. AD/MF usa cadência configurável;
acessos são avaliados diariamente para antecedências, vencimento e atraso. A
chave única `tipo + dia planejado` impede duplicação entre ticks e reinícios.
