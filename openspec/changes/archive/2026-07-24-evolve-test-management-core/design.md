## Context

O backend já possui as entidades `Project`, `Suite`, `TestCase`, `Run` e
`RunTestCase`, além dos endpoints básicos. O frontend oferece apenas o CRUD de
projetos. O banco local pode conter dados criados pelo smoke test ou pelo
usuário e precisa continuar abrindo após a evolução.

A principal lacuna arquitetural é que `RunTestCase` referencia diretamente o
caso atual. Se o caso for editado, não há informação suficiente para demonstrar
qual definição foi executada. Também faltam uma navegação por contexto de
projeto e uma representação estruturada dos passos.

## Goals / Non-Goals

**Goals:**

- Entregar o fluxo Projeto -> Repositório -> Run -> Resultado.
- Preservar uma fotografia legível de cada caso incluído em um run.
- Permitir evolução de passos e metadados sem perder os textos existentes.
- Manter a aplicação simples de instalar e usar localmente.
- Criar superfícies de API adequadas para busca, filtros e progresso.

**Non-Goals:**

- Autenticação, permissões, trabalho em equipe ou sincronização em nuvem.
- Planos reutilizáveis, milestones, anexos e integrações com issue trackers.
- Status e campos totalmente customizáveis.
- Importação de resultados automatizados nesta mudança.

## Decisions

### Workspace orientado ao projeto

O frontend terá um projeto ativo e rotas de interface para `overview`,
`repository` e `runs`. A navegação global continuará pequena; ações de casos e
runs sempre ocorrerão dentro de um projeto.

Alternativa considerada: manter toda a aplicação em um único componente e
alternar seções por estado. Foi descartada porque dificulta links diretos,
navegação do navegador e crescimento das telas.

### Suítes hierárquicas com profundidade prática curta

`Suite` receberá `parentId` opcional com autorrelacionamento. A API impedirá que
uma suíte seja seu próprio pai ou seja movida para um descendente. A interface
suportará árvore, mas favorecerá até três níveis.

Alternativa considerada: manter suítes planas e usar nomes com `/`. Isso não
permite mover ramos ou calcular escopo com segurança.

### Passos normalizados e migração compatível

Será criada a entidade `TestStep` com posição, ação e resultado esperado.
Durante a migração, os campos textuais existentes de `TestCase` permanecerão
temporariamente disponíveis como fallback. Novos casos usarão passos
estruturados; uma rotina de migração converterá o texto legado em um primeiro
passo quando necessário.

Alternativa considerada: armazenar passos em JSON. A tabela normalizada
facilita ordenação, edição parcial e resultados por passo em mudanças futuras.

### Snapshot autocontido no item do run

Ao criar um run, cada `RunTestCase` receberá título, pré-condições, passos,
resultado esperado e metadados serializados daquele momento. A execução e o
histórico lerão o snapshot. A referência ao `TestCase` será mantida para abrir o
caso atual quando ele ainda existir.

Alternativa considerada: versionar cada alteração do caso em uma tabela de
revisões. Isso oferece auditoria mais ampla, mas adiciona complexidade que não é
necessária para garantir o histórico de execução pessoal.

### Resultado editável com trilha temporal mínima

Enquanto o run estiver ativo, o item poderá mudar entre `Untested`, `Passed`,
`Failed`, `Blocked` e `Skipped`. O sistema registrará comentário, resultado
real, duração e data da última execução. Runs concluídos serão somente leitura.

Alternativa considerada: resultados completamente imutáveis a cada clique.
Uma sequência de eventos é mais robusta para auditoria corporativa, porém
excessiva para esta fase.

### Estatísticas calculadas a partir dos resultados

O backend continuará sendo responsável pelas contagens. O frontend receberá
totais, progresso e distribuição já consistentes, mas cada indicador terá um
filtro ou link para os itens correspondentes.

## Risks / Trade-offs

- [Migração Prisma continua instável no ambiente atual] -> Manter SQL de
  migration versionado e atualizar o script `setup-db` com operações
  idempotentes; validar ambos quando o schema engine estiver disponível.
- [Snapshots aumentam o tamanho do SQLite] -> Aceitar o custo por preservar
  histórico; texto de casos manuais é pequeno para uso pessoal.
- [Árvore de suítes pode introduzir ciclos] -> Validar ancestralidade antes de
  atualizar `parentId` e cobrir com teste de API.
- [Compatibilidade entre casos legados e passos estruturados] -> Ler o formato
  legado como fallback até uma migração explícita confirmar a conversão.
- [Mudança ampla no frontend] -> Implementar por fatias navegáveis, mantendo o
  CRUD de projetos funcional durante toda a evolução.

## Migration Plan

1. Adicionar colunas opcionais e tabelas novas sem remover campos existentes.
2. Atualizar `setup-db` e gerar migration SQL equivalente.
3. Preencher snapshots apenas para novos runs; runs antigos usam o caso atual
   como fallback e exibem aviso de registro legado quando necessário.
4. Converter passos legados sob demanda e validar contagens antes de qualquer
   remoção futura de colunas.
5. Implementar e validar o workspace e o repositório antes da nova execução.

Rollback: manter uma cópia do arquivo SQLite antes da migração. Como a mudança é
aditiva, o código anterior ignora as novas tabelas e colunas.

## Open Questions

- O identificador humano do caso deve usar apenas o ID global (`TC-42`) ou um
  código configurável do projeto (`APP-42`)? Será decidido em uma mudança
  específica para identidade e importação.
- Resultados por passo serão adicionados junto de anexos/evidências ou antes?
  O snapshot já deixará o formato preparado para essa evolução.
