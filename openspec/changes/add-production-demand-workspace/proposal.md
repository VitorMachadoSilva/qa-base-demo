## Why

ADs e MFs recebidos do suporte hoje não possuem um espaço operacional no
QaBase, o que dispersa prazos, responsáveis, impacto e histórico entre
planilhas e comunicações. Centralizar esse acompanhamento é a próxima evolução
necessária para o QaBase representar o trabalho diário da equipe além dos
testes planejados.

## What Changes

- Adicionar um workspace de projeto para cadastrar, acompanhar, filtrar e
  encerrar demandas de produção dos tipos AD e MF.
- Registrar código e link de origem, contato do suporte, responsável de QA,
  descrição, estado, observações e vínculos opcionais com elementos de teste.
- Calcular para MF um prazo de 20 dias corridos a partir do registro formal pelo
  suporte nível 2 e destacar demandas próximas do prazo ou atrasadas.
- Exigir a entrega de solução paliativa para encerrar um MF.
- Registrar criticidade e quantidade de usuários afetados em AD, aceitar data
  alvo opcional e exigir chegada da correção à produção para encerramento.
- Permitir vincular um MF a uma AD que acompanhe sua correção definitiva.
- Manter uma linha do tempo local de criação, alterações de estado, notas,
  vínculos e encerramento.
- Incluir coleção densa, indicadores operacionais, filtros combinados e
  inspector lateral responsivo nos dois temas do QaBase.
- Preservar isolamento por projeto, validação de vínculos e compatibilidade com
  a instalação SQLite atual.
- Não incluir nesta mudança acessos de terceiros, Telegram, SLA configurável,
  anexos binários, integração automática com Jira, autenticação ou
  colaboração multiusuário.

## Capabilities

### New Capabilities

- `production-demand-management`: Gestão completa do ciclo local de AD e MF,
  incluindo impacto, prazo, responsáveis, vínculos, encerramento e histórico.

### Modified Capabilities

- `quality-instrument-interface`: Adicionar Demandas como destino operacional
  do projeto e definir sua coleção, inspector e adaptação responsiva.

## Impact

- Novas tabelas e migração Prisma para demandas e atividades históricas.
- Novos schemas Zod, controllers e rotas REST isolados por projeto.
- Novos contratos no cliente HTTP centralizado.
- Novo workspace React e destino no shell do projeto.
- Ajustes nos estilos `Quality Instrument` para indicadores de prazo,
  criticidade, coleção e inspector.
- Novos testes de migração, integridade, API, regras de encerramento e interface.
