## Why

O trabalho diário de QA frequentemente começa em um card isolado de bug,
melhoria ou feature, antes de existir um caso reutilizável ou um run formal. O
produto precisa registrar esse raciocínio pontual sem obrigar o usuário a
transformar toda verificação temporária em item permanente do repositório.

## What Changes

- Adotar `QaBase` como nome visível do produto.
- Adicionar a área `Validações` dentro de cada projeto.
- Permitir pastas hierárquicas e inteiramente definidas pelo usuário para
  organizar fichas por feature, seção ou qualquer taxonomia pessoal.
- Criar fichas de validação com título, objetivo, escopo, anotações, estado e
  URL opcional para o card de origem, incluindo Jira.
- Registrar critérios de aceite ou requisitos como checklist ordenado.
- Registrar verificações pontuais com resultado esperado, resultado observado,
  notas e estados Untested, Passed, Failed, Blocked ou Skipped.
- Exibir progresso e resumo semântico derivados do checklist.
- Permitir promover uma verificação relevante para um caso reutilizável no
  repositório, preservando o vínculo entre os dois.
- Manter fora do escopo sincronização com Jira, anexos binários, colaboração,
  comentários de equipe, versionamento, importação CSV e resultados
  automatizados.

## Capabilities

### New Capabilities

- `validation-briefs`: organização, planejamento, execução pontual, anotações,
  progresso e promoção de verificações de uma ficha.

### Modified Capabilities

- `quality-instrument-interface`: inclui a nova área na navegação responsiva e
  aplica a identidade visível `QaBase`.

## Impact

- Novas entidades e migration SQLite para pastas, fichas, critérios e checks.
- Novos endpoints REST e validação Zod.
- Novo workspace React e integração com o shell.
- Extensão do smoke test e das verificações de integridade.
- Atualização do nome visível e da documentação do produto.
- Nenhuma integração externa ou nova dependência de produção.
