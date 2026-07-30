## Why

Um projeto do QaBase concentra casos reutilizáveis, planejamento, execuções,
resultados e demandas de produção que não podem depender apenas de uma única
base SQLite. A aplicação precisa oferecer uma cópia portátil, verificável e
restaurável de cada projeto antes de ampliar seu uso compartilhado.

## What Changes

- Adiciona exportação integral de um projeto para um arquivo versionado
  `.qabase`, incluindo suas hierarquias, vínculos e histórico operacional.
- Adiciona checksum SHA-256 e manifesto com versão, origem, data e contagens para
  detectar arquivos incompletos ou alterados.
- Adiciona importação em duas etapas: validação sem escrita e confirmação após
  uma prévia clara do conteúdo.
- Restaura o backup sempre como um novo projeto, com nome ajustável e novos
  identificadores internos, sem mesclar nem substituir dados existentes.
- Executa a restauração em uma única transação, revertendo tudo quando qualquer
  registro ou relação não puder ser reconstruído.
- Adiciona ações de importar e exportar na gestão de projetos, com estados de
  processamento, erros acionáveis e confirmação personalizada antes da criação.
- Mantém fora do arquivo contas e sessões, anotações rápidas privadas, acessos de
  terceiros, configuração do Telegram e histórico global de notificações.
- Mantém fora desta entrega backup automático, restauração sobre um projeto
  existente, mesclagem, criptografia do arquivo, anexos binários e cópia integral
  da instância SQLite.

## Capabilities

### New Capabilities

- `project-backup-portability`: exportação completa e versionada de projetos,
  verificação de integridade, prévia segura e restauração transacional como novo
  projeto.

### Modified Capabilities

Nenhuma.

## Impact

A mudança afeta consultas Prisma do grafo completo de projeto, serviços de
serialização e restauração, validação Zod, rotas autenticadas de projetos,
limites de corpo da API, cliente HTTP do frontend, gestão visual de projetos,
documentação operacional e smoke tests. O formato `.qabase` passa a ser um
contrato versionado e independente dos ids locais do banco.
