## Context

O `TestPlan` atual possui uma coleção plana de `TestPlanItem`, ordenada por uma
posição global e limitada a uma ocorrência de cada caso. Ao criar um run, essa
lista é convertida em `RunTestCase`, que preserva o conteúdo do caso, mas não
registra estrutura, instruções ou dependências do plano.

Esse modelo atende regressões simples, mas não fluxos que atravessam
funcionalidades como conexão, vídeo, eventos e alarmes. Nesses cenários, a mesma
validação pode aparecer em momentos diferentes e cada etapa precisa manter um
resultado próprio.

A solução deve continuar local, funcionar com SQLite/Prisma, manter planos e
runs existentes legíveis e evitar uma engine genérica de workflow.

## Goals / Non-Goals

**Goals:**

- representar planos por seções e itens ordenados;
- permitir instruções de transição e uma dependência simples por item;
- permitir ocorrências repetidas do mesmo caso dentro de um plano e run;
- preservar a estrutura composta como snapshot do run;
- manter resultado, observação e duração por ocorrência;
- oferecer componentes funcionais configuráveis e associação muitos-para-muitos
  com casos;
- migrar dados atuais sem perda de planos, casos ou runs;
- manter a interface produtiva em desktop, tablet e mobile.

**Non-Goals:**

- criar uma entidade independente de fluxo;
- suportar condições booleanas, ramificações ou múltiplas dependências;
- iniciar automação a partir de uma etapa;
- sincronizar componentes com Jira ou outra plataforma;
- alterar o ciclo de vida de milestones, ambientes ou fichas de validação;
- implementar AD/MF, acessos de terceiros, Telegram, autenticação ou
  multiusuário.

## Decisions

### Seções pertencem ao plano

Será criado `TestPlanSection` com `testPlanId`, nome, descrição opcional e
posição. Todo plano terá pelo menos uma seção, inclusive um rascunho vazio.

Planos existentes receberão uma seção padrão chamada `Casos do plano`, mantendo
a ordem atual dos itens.

Uma entidade `TestFlow` reutilizável foi descartada nesta fase porque exigiria
novo catálogo, navegação e regras de versionamento. Seções resolvem a
necessidade atual dentro do conceito de plano que a equipe já utiliza.

### Posição passa a ser local à seção

`TestPlanItem` receberá `sectionId`, posição local,
`transitionInstructions` opcional e `dependsOnItemId` opcional.

A restrição de unicidade entre plano e caso será removida. A identidade da
ocorrência será o próprio item, permitindo executar o mesmo caso em diferentes
momentos do fluxo.

Manter a unicidade foi descartado porque obrigaria duplicar casos no repositório
apenas para representar estados diferentes de uma jornada.

### Dependência simples e sempre anterior

Um item poderá depender de exatamente um item anterior na ordem total do plano.
O backend rejeitará dependências para o próprio item, itens posteriores, itens
de outro plano ou ciclos produzidos por payload inválido.

Durante o run, o item dependente não aceitará resultado enquanto seu
pré-requisito estiver `Untested`. Depois que o pré-requisito receber qualquer
resultado terminal, o item ficará disponível e exibirá o resultado anterior
como contexto. Falha ou bloqueio não impedem automaticamente a tentativa
seguinte.

Dependências múltiplas e regras condicionais foram descartadas para não criar
uma engine de workflow. Tratar a dependência apenas como texto também foi
descartado porque não permitiria orientar a próxima etapa disponível.

### Atualização transacional da hierarquia

O editor enviará a estrutura completa do plano com seções e itens. Cada item do
payload terá uma chave temporária única e poderá informar
`dependsOnItemKey`.

O backend validará projeto, posições, chaves e precedência, então substituirá a
hierarquia dentro de uma transação. As dependências serão ligadas em uma segunda
etapa após a criação dos itens.

Essa substituição é apropriada porque planos são fontes mutáveis e runs
preservam snapshots. Endpoints granulares para cada movimento foram descartados
por aumentarem o número de estados intermediários inválidos.

### Snapshot composto normalizado

Será criado `RunPlanSection` com nome, descrição e posição capturados no momento
da criação do run. `RunTestCase` receberá:

- `runPlanSectionId` opcional;
- posição dentro da seção;
- instruções de transição capturadas;
- `dependsOnRunTestCaseId` opcional.

Runs avulsos continuarão sem seções. Ao criar um run por plano, o backend criará
primeiro as seções e ocorrências, depois mapeará cada dependência de origem para
a ocorrência correspondente no run.

Armazenar apenas o nome da seção em cada ocorrência foi descartado por duplicar
dados e dificultar uma resposta agrupada estável.

### Componentes são um catálogo do projeto

Será criado `TestComponent`, com nome único por projeto, descrição opcional e
posição, além da junção `TestCaseComponent`.

Uma suíte continua sendo a localização hierárquica principal do caso.
Componentes são classificações transversais, como `Alarmes`, `Vídeo ao vivo` ou
`Conectividade`. Excluir um componente apenas remove suas associações.

Tags livres armazenadas diretamente no caso foram descartadas porque gerariam
variações de grafia e dificultariam filtros confiáveis.

### Interface usa edição contínua, sem cards aninhados

O editor de plano manterá o catálogo de casos para busca e uma área contínua
para seções e itens. Controles explícitos permitirão adicionar, mover, remover,
selecionar dependência e editar instruções.

A execução agrupará a fila por seções, indicará dependências pendentes e
selecionará o primeiro item `Untested` disponível. Em telas estreitas, catálogo
e estrutura serão apresentados em etapas, sem comprimir as duas regiões.

## Risks / Trade-offs

- [Substituir itens altera seus identificadores] -> nenhuma execução histórica
  depende dos itens mutáveis; dependências são recriadas transacionalmente.
- [Casos repetidos quebram a unicidade atual do run] -> remover a restrição
  `runId/testCaseId` e tratar `RunTestCase.id` como identidade da ocorrência.
- [Reordenação pode invalidar dependência] -> frontend limpa ou solicita nova
  dependência e backend rejeita referências que deixem de apontar para item
  anterior.
- [Planos muito grandes tornam o editor denso] -> seções recolhíveis, busca e
  contadores, mantendo apenas uma hierarquia visual.
- [Componentes duplicam a ideia de suíte] -> textos e interface deixam explícito
  que suíte localiza e componente classifica transversalmente.
- [Migração SQLite exige reconstrução de tabelas] -> migration aditiva e
  transacional, seguida pelos smoke tests idempotentes já usados no projeto.

## Migration Plan

1. Criar `TestComponent`, `TestCaseComponent`, `TestPlanSection` e
   `RunPlanSection`.
2. Criar uma seção padrão para cada plano existente.
3. Reconstruir `TestPlanItem`, associando itens atuais à seção padrão, removendo
   a unicidade por caso e adicionando os campos de composição.
4. Reconstruir `RunTestCase`, preservando todas as ocorrências atuais,
   atribuindo posição determinística por run e adicionando os campos opcionais
   de snapshot composto.
5. Atualizar o setup idempotente e gerar o Prisma Client.
6. Atualizar APIs e smoke tests antes de habilitar a nova interface.
7. Validar leitura de planos e runs legados, duplicação de casos, isolamento por
   projeto e criação repetida do banco.

O rollback de aplicação poderá ignorar as novas estruturas sem apagar dados.
Um rollback físico para o schema anterior somente será seguro se nenhum plano
ou run possuir casos repetidos; por isso não haverá down migration destrutiva
automática.

## Open Questions

Nenhuma para iniciar a implementação. Dependências múltiplas e fluxos
reutilizáveis poderão ser reavaliados após uso real das seções compostas.
