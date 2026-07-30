## Why

O QA Manager já permite definir casos e executar seleções avulsas, mas ainda
obriga o usuário a reconstruir manualmente o escopo de regressões recorrentes e
não registra de forma estruturada a versão, o ambiente e as condições em que o
teste ocorreu. A próxima evolução deve preencher essa camada de planejamento
sem introduzir a complexidade de equipes e infraestrutura corporativa.

## What Changes

- Adicionar planos de teste reutilizáveis, com nome, descrição e uma seleção
  ordenada de casos atuais do projeto.
- Permitir criar um run diretamente de um plano ou continuar criando runs por
  seleção avulsa no repositório.
- Adicionar milestones para representar sprint, versão ou entrega, com período
  opcional e ciclo de vida controlado.
- Adicionar ambientes reutilizáveis e grupos de configuração com opções, como
  `Ambiente: Homologação`, `Navegador: Chrome` e `SO: Windows`.
- Permitir escolher um ambiente, um milestone e no máximo uma opção de cada
  grupo de configuração ao criar um run.
- Preservar no run um snapshot legível do plano e do contexto selecionado para
  que alterações ou exclusões futuras não prejudiquem o histórico.
- Exibir plano, milestone, ambiente e configurações nas listas e no workspace de
  execução, com filtros úteis para localizar runs anteriores.
- Manter compatibilidade com runs existentes, que continuarão válidos sem
  contexto associado.
- Não inclui geração automática de matriz de configurações, responsáveis,
  credenciais, anexos, defeitos, importação, exportação ou integrações.

## Capabilities

### New Capabilities

- `test-plans`: Criação e manutenção de coleções reutilizáveis e ordenadas de
  casos de teste, além do início de runs a partir de um plano.
- `release-milestones`: Gestão local de versões, sprints ou entregas que
  contextualizam runs e preservam seu histórico após a conclusão.
- `execution-contexts`: Gestão de ambientes, grupos de configuração e opções
  reutilizáveis para descrever onde e em quais condições um run foi executado.

### Modified Capabilities

- `test-run-execution`: Runs passam a aceitar origem em plano, milestone,
  ambiente e configurações opcionais, mantendo snapshots desses vínculos e
  permitindo filtrar o histórico pelo contexto de execução.

## Impact

- Novos modelos Prisma, relações opcionais e migration SQLite aditiva.
- Novos endpoints REST para planos, milestones, ambientes e configurações.
- Extensão dos contratos de criação, listagem e detalhe de runs.
- Novas áreas de planejamento no workspace do projeto e ampliação do diálogo de
  criação de execução.
- Novos testes de API para isolamento por projeto, exclusões, snapshots,
  compatibilidade legada e regras de ciclo de vida.
- Atualizações em `API.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `PRODUCT.md`
  e `TASKS.md`.
