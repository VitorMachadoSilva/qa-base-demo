# Benchmark de Plataformas de Gestão de Testes

Pesquisa atualizada em 27 de julho de 2026 a partir da documentação oficial das
plataformas. Este documento orienta o produto; ele não é uma lista de recursos
para copiar indiscriminadamente.

## Objetivo da pesquisa

Identificar os padrões que tornam uma ferramenta de gestão de testes útil no
trabalho diário e adaptá-los para uma aplicação local, gratuita, pessoal e
capaz de organizar testes de qualquer tipo de software.

## Padrões encontrados

### 1. Separar definição, planejamento e execução

Qase, TestRail e PractiTest tratam o caso de teste como uma definição
reutilizável. Planos ou conjuntos selecionam o que será testado. Runs guardam
uma execução específica e seus resultados.

Decisão para o QaBase:

- `TestCase` é a fonte reutilizável no repositório.
- `TestPlan` será uma seleção reutilizável e opcional.
- `Run` será um evento de execução.
- Cada item de um run guardará um snapshot do caso usado naquela execução.

Essa separação evita que a edição de um caso altere o significado de um
resultado histórico.

### 2. Organizar sem amarrar a um tipo de aplicação

As ferramentas maduras usam projetos, pastas ou suítes, tags, prioridade,
severidade e tipos configuráveis. Ambientes e configurações descrevem onde o
teste aconteceu, como navegador, sistema operacional, dispositivo, versão,
API, banco ou build.

Decisão para o QaBase:

- Projeto representa um produto ou contexto de qualidade.
- Suítes podem formar uma árvore curta para módulos e funcionalidades.
- Casos recebem identificador legível, prioridade, severidade, tipo, estado de
  automação e tags.
- Ambiente e configuração pertencem ao contexto do run, não ao caso.

### 3. Tornar a execução rápida e explicável

Qase oferece execução sequencial, fast pass, comentários, anexos e criação de
defeitos na falha. PractiTest oferece fast run e histórico por instância.
TestRail permite escolher todos os casos, uma seleção manual ou filtros.

Decisão para o QaBase:

- Tela de execução com navegação anterior/próximo e atalhos de resultado.
- Estados iniciais: Untested, Passed, Failed, Blocked e Skipped.
- Falha e bloqueio solicitam comentário, resultado real ou evidência.
- Ações em lote ficam para depois da execução individual estar sólida.

### 4. Preservar rastreabilidade

As plataformas ligam resultados a casos, runs, planos, releases, requisitos e
defeitos. Os relatórios dependem dessa cadeia, não apenas de contadores soltos.

Decisão para o QaBase:

- Resultado referencia run e snapshot do caso.
- Defeito pode nascer de um resultado falho e manter o vínculo de origem.
- Milestone representará sprint, versão ou entrega.
- Referências externas serão texto ou URL antes de existirem integrações.

### 5. Mostrar progresso que ajuda a decidir

Dashboards maduros mostram execução concluída, distribuição de status,
falhas, cobertura, tendência e comparação entre runs ou configurações.

Decisão para o QaBase:

- Priorizar progresso do run atual, falhas abertas, casos ainda não executados
  e taxa de aprovação.
- Adicionar tendência histórica somente quando houver dados suficientes.
- Permitir abrir a lista que originou um indicador; gráficos não serão becos
  sem saída.

### 6. Estruturar o teste focado sem exigir um caso pronto

PractiTest usa charter, guide points e anotações durante testes exploratórios,
permitindo transformar descobertas em testes roteirizados. Qase separa
requisitos hierárquicos, casos e defeitos, mantendo vínculos de cobertura.

Decisão para o QaBase:

- A ficha de validação reúne objetivo, escopo, critérios, checklist e notas.
- Pastas são definidas pelo usuário, sem impor Bug, Melhoria ou Feature.
- O link da card é armazenado sem sincronização bidirecional.
- Um teste útil pode ser promovido para caso reutilizável.
- A ficha não substitui plano ou run; ela organiza o trabalho pontual.

### 7. Capturar memória de trabalho sem criar estrutura manual

Microsoft Sticky Notes combina captura imediata, lista pesquisável, cores e
adaptação ao tema. Google Keep reforça fixação, cores e busca como meios rápidos
de recuperação. NotePlan usa notas diárias como agrupamento temporal previsível.

Decisão para o QaBase:

- Criar uma área global para fragmentos que ainda não pertencem a uma ficha,
  caso, plano ou demanda.
- Agrupar automaticamente pelo dia de criação, sem cadastro de pastas.
- Manter o dia imutável após edições e mostrar a atualização separadamente.
- Usar busca, fixação e cores como organização leve.
- Adiar etiquetas, lembretes, colaboração, anexos e editor rico.

### 8. Notificar sem transformar o produto em infraestrutura de mensagens

Ferramentas operacionais maduras separam configuração do canal, regras de
agenda e histórico de entrega. A API de bots do Telegram oferece identidade do
bot, descoberta explícita de atualizações, consulta do grupo e envio de
mensagens com retorno de identificador, sem exigir que o QaBase mantenha SMTP.

Decisão para o QaBase:

- usar um bot e um grupo privado fixo;
- manter o token somente no ambiente do backend;
- consolidar AD/MF e acessos em relatórios curtos;
- registrar execuções sem dados sem enviar mensagens vazias;
- persistir partes, tentativas, erros seguros e reenvios;
- manter cadência e antecedências configuráveis na aplicação;
- adiar múltiplos grupos, mensagens diretas, webhooks e comandos operacionais.

## Priorização adaptada ao uso pessoal

### Essencial

1. Workspace do projeto com navegação entre repositório, runs e dashboard.
2. Suítes hierárquicas e casos com passos estruturados.
3. Runs com snapshot, execução rápida, comentário e duração.
4. Busca e filtros por suíte, prioridade, tipo, tag e status.
5. Histórico por caso e por run.

### Próxima camada

1. Planos reutilizáveis.
2. Ambientes, configurações e milestones.
3. Defeitos vinculados aos resultados.
4. Importação e exportação CSV.
5. Anexos locais e relatórios compartilháveis.
6. Passos compartilhados e parâmetros reutilizáveis.
7. Rastreabilidade entre fichas, casos, runs e defeitos.

### Adiar

1. Usuários, equipes, permissões e distribuição de carga.
2. Assinaturas, nuvem e links públicos.
3. Integrações bidirecionais complexas.
4. Campos e status totalmente customizáveis.
5. IA generativa dentro do produto antes de o fluxo básico ter dados confiáveis.

## Fontes oficiais

- Qase, conceitos:
  https://docs.qase.io/en/articles/14442829-qase-concepts
- Qase, casos de teste:
  https://docs.qase.io/en/articles/5563704-test-cases
- Qase, test runs:
  https://docs.qase.io/en/articles/5563702-test-runs
- Qase, planos:
  https://docs.qase.io/en/articles/5563703-test-plans
- TestRail, introdução:
  https://support.testrail.com/hc/en-us/articles/7076810203028-Introduction-to-TestRail
- TestRail, planos:
  https://support.testrail.com/hc/en-us/articles/7077711537684-Plans
- TestRail, milestones:
  https://support.testrail.com/hc/en-us/articles/15545364561044-Milestones
- TestRail, relatórios:
  https://support.testrail.com/hc/en-us/articles/9285210470420-Reports-overview
- PractiTest, metodologia:
  https://www.practitest.com/help/getting-started/practitest-methodology/
- Zephyr Scale, parâmetros:
  https://support.smartbear.com/zephyr-scale-cloud/docs/en/test-cases/parameters.html
- Qase, requisitos:
  https://docs.qase.io/en/articles/5563700-requirements
- Qase, passos compartilhados:
  https://docs.qase.io/en/articles/5563709-shared-steps
- Qase, defeitos:
  https://docs.qase.io/en/articles/5563710-defects
- PractiTest, testes exploratórios e baseados em sessão:
  https://www.practitest.com/help/test-planning-and-execution/tests/exploratory-and-session-based-tests/
- Kiwi TCMS, alternativa open source e local:
  https://kiwitcms.org/
- Microsoft Sticky Notes, início, busca, cores e tema:
  https://support.microsoft.com/en-US/Windows/Apps/StickyNotes/get-started-with-sticky-notes
- Google Keep, etiquetas, cores e fixação:
  https://support.google.com/keep/answer/6191044
- NotePlan, notas diárias:
  https://help.noteplan.co/article/43-part-1-daily-notes
- Telegram Bot API:
  https://core.telegram.org/bots/api
- Telegram, criação e recursos de bots:
  https://core.telegram.org/bots/features

## Princípio de produto

O QaBase deve ser mais rápido que uma planilha para registrar e executar
testes, mas manter histórico e rastreabilidade suficientes para explicar o que
foi testado, onde, quando e com qual resultado.
