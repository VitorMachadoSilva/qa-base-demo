## Why

O projeto já possui a base técnica e o CRUD de projetos, mas ainda não entrega
o ciclo diário de QA: organizar casos, executar uma seleção e consultar um
histórico confiável. Esta mudança estabelece esse núcleo usando os padrões
comprovados por Qase, TestRail e PractiTest, adaptados ao uso pessoal e local.

## What Changes

- Criar um workspace de projeto com navegação funcional entre dashboard,
  repositório de testes e execuções.
- Organizar casos em suítes e oferecer criação, edição, busca e filtros sem sair
  do contexto do projeto.
- Evoluir casos para passos estruturados e metadados úteis a diferentes tipos
  de software.
- Criar e executar runs a partir de casos selecionados, com progresso e
  resultados individuais.
- Preservar em cada run um snapshot da definição executada para que edições
  futuras não alterem o histórico.
- Exibir indicadores acionáveis de cobertura da execução e distribuição dos
  resultados.
- Manter compatibilidade com os dados locais já criados.
- Não inclui planos reutilizáveis, milestones, anexos, integrações, usuários ou
  permissões nesta mudança.

## Capabilities

### New Capabilities

- `test-repository`: Organização e manutenção de suítes e casos reutilizáveis
  dentro de um projeto.
- `test-run-execution`: Criação de runs, snapshot dos casos e registro rápido de
  resultados rastreáveis.
- `quality-overview`: Visão do progresso e dos resultados do projeto e de cada
  execução com acesso aos itens que formam os indicadores.

### Modified Capabilities

Nenhuma. Ainda não existem especificações OpenSpec arquivadas para o produto.

## Impact

- Modelos Prisma, migration SQLite e scripts de preparação do banco.
- Endpoints de suítes, casos, runs e dashboard.
- Serviço HTTP e estrutura de navegação do frontend React.
- Novas páginas e componentes para repositório, criação e execução de runs.
- Testes de API e validação visual dos principais fluxos locais.
