## Context

O produto já separa casos reutilizáveis, planos e execuções formais, mas não
possui uma entidade para o trabalho pontual que nasce de um card de bug,
melhoria ou feature. Forçar esse conteúdo para o repositório gera casos
descartáveis; usar apenas notas externas perde resultados, histórico e
rastreabilidade.

A solução deve permanecer local, simples para um único usuário e compatível com
o SQLite existente. A URL do card é apenas uma referência: não haverá leitura,
escrita ou sincronização com Jira nesta fase.

## Goals / Non-Goals

**Goals:**

- organizar fichas em uma árvore livre por projeto;
- registrar objetivo, escopo, critérios, verificações e anotações;
- executar cada check com os mesmos estados semânticos dos runs;
- calcular progresso e resultados a partir dos checks;
- preservar fichas ao remover pastas;
- permitir transformar um check útil em caso reutilizável;
- integrar a área ao shell responsivo e à identidade QaBase.

**Non-Goals:**

- substituir Jira ou manter uma cópia sincronizada do card;
- anexar arquivos binários;
- criar defeitos internos nesta mudança;
- oferecer colaboração, aprovação ou permissões;
- importar automação, CSV ou dados de plataformas externas;
- versionar fichas ou casos.

## Decisions

### Ficha separada de caso e run

`ValidationBrief` será uma entidade própria. Um caso permanece reutilizável e
um run permanece uma execução formal de casos; a ficha registra uma validação
pontual cujo checklist pode nunca ser reutilizado.

Modelar a ficha como plano foi descartado porque planos não guardam objetivo,
critérios, notas ou resultados. Modelá-la como run criaria casos permanentes
antes de o QA saber se eles possuem valor de regressão.

### Organização livre e taxonomia mínima

`ValidationFolder` terá hierarquia por `parentId`, sem tipos fixos como Bug,
Feature ou Melhoria. O usuário decide se organiza por produto, feature, natureza
do trabalho ou outra estrutura.

O estado da ficha será controlado pelo sistema (`Draft`, `InProgress`,
`Blocked`, `Completed`), pois ele representa ciclo de vida, não taxonomia.

### Conteúdo estruturado em quatro entidades

- `ValidationBrief`: identidade, URL, objetivo, escopo, notas gerais e estado;
- `ValidationCriterion`: requisito ou critério ordenado, com marcação atendido;
- `ValidationCheck`: verificação ordenada, resultado esperado, observado, nota,
  estado e vínculo opcional com caso;
- `ValidationNote`: anotação cronológica tipada como Note, Question, Risk ou
  Evidence.

Critérios e checks serão separados porque “o que precisa ser verdade” e “como
verificar” possuem semânticas e ciclos diferentes.

### Vínculo por snapshot durante promoção

Ao promover um check, o backend cria um `TestCase` com um `TestStep` dentro da
suíte selecionada e grava `testCaseId` no check. O texto original permanece no
check; excluir ou editar o caso não altera a evidência da ficha.

Criar sincronização bidirecional foi descartado porque tornaria uma ficha
histórica dependente de uma fonte mutável.

### Endpoints orientados a pequenas ações

Criação da ficha aceita critérios e checks iniciais. Alterações posteriores usam
endpoints próprios para metadados, critérios, checks, notas e promoção. Isso
evita substituir coleções inteiras e perder resultados já registrados.

### Workspace de três regiões

No desktop, a área apresenta pastas, ledger de fichas e detalhe ativo. Em telas
menores, as regiões refluem para lista e detalhe, preservando uma ação explícita
de retorno. O checklist é uma coleção contínua, não uma grade de cards.

## Risks / Trade-offs

- [Muitas entidades para um MVP] -> cada entidade representa uma responsabilidade
  observável e evita armazenar conteúdo crítico como JSON opaco.
- [Excluir uma pasta apaga organização] -> pastas filhas são removidas, mas as
  fichas afetadas voltam para “Sem pasta”.
- [URL externa inválida] -> aceitar apenas URL HTTP ou HTTPS e permitir campo
  vazio.
- [Promoção gera caso incompleto] -> exigir suíte, título e resultado esperado,
  criando um passo estruturado válido.
- [Mobile fica denso] -> exibir apenas uma região principal por vez e manter o
  detalhe em fluxo vertical.

## Migration Plan

1. Criar tabelas, índices e relações opcionais por migration aditiva.
2. Atualizar o setup idempotente e gerar o Prisma Client.
3. Adicionar APIs e smoke tests sem alterar rotas existentes.
4. Adicionar navegação, workspace e identidade QaBase.
5. Validar banco duas vezes, build, isolamento entre projetos e viewports.

O rollback pode remover a rota e o workspace sem afetar casos, planos ou runs.
Casos já promovidos continuam válidos no repositório.

## Open Questions

Nenhuma para esta entrega.
