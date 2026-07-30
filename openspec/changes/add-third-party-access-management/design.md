## Context

O controle de terceiros hoje está em uma planilha com pessoa, função, sistemas e
datas. A aprovação de um chamado inicia um período de acesso de no máximo três
meses. O QaBase já possui shell global, API REST, SQLite, setup idempotente,
históricos transacionais e workspaces operacionais densos, mas seus módulos
atuais são majoritariamente vinculados a projetos.

Esta mudança introduz o primeiro workspace operacional global além de Projetos.
Ela precisa permanecer simples para uso local, preservar renovações e preparar
dados confiáveis para notificações futuras sem implementar Telegram agora.

## Goals / Non-Goals

**Goals:**

- centralizar terceiros e seus acessos em Teams, GitLab, VPN, Jira e Confluence;
- calcular e destacar vencimentos a partir da aprovação;
- permitir prazo menor, mas nunca maior que três meses civis;
- preservar ciclos anteriores ao renovar ou encerrar acessos;
- oferecer uma fila global pesquisável com resumo e detalhe cronológico;
- integrar o destino à barra global sem exigir projeto ativo.

**Non-Goals:**

- enviar mensagens Telegram ou configurar cadências;
- provisionar ou revogar contas nos sistemas externos;
- autenticação, permissões ou responsáveis como usuários do QaBase;
- múltiplas listas personalizadas de sistemas;
- anexos, importação de planilha ou sincronização com diretórios.

## Decisions

### Separar identidade, ciclos e concessões

`ThirdParty` guarda a identidade operacional: nome, empresa, função, contato,
responsável interno e observações. `ThirdPartyAccessCycle` guarda cada período
aprovado. `ThirdPartyAccessGrant` registra os sistemas do ciclo.

Uma tabela única seria menor, mas sobrescreveria datas e sistemas a cada
renovação. A separação preserva histórico e permite que uma renovação altere a
lista de acessos sem reescrever o ciclo anterior.

### Usar sistemas fixos validados pela API

O sistema será armazenado como enum lógico de texto com os valores `Teams`,
`GitLab`, `VPN`, `Jira` e `Confluence`. A validação rejeita valores diferentes e
exige ao menos um sistema.

Uma tabela configurável foi descartada nesta fase porque a lista foi definida
pelo processo da equipe e adicionaria administração sem necessidade atual.

### Calcular o limite por meses civis

O vencimento padrão será a data de aprovação acrescida de três meses civis. Em
datas inexistentes no mês de destino, será usado o último dia desse mês. Um
vencimento manual será aceito entre a aprovação e esse limite.

Somar 90 dias foi descartado porque não representa consistentemente três meses e
diverge do exemplo operacional de 27/07 a 27/10.

### Manter apenas um ciclo corrente

Cada terceiro terá no máximo um ciclo sem encerramento explícito que represente
seu acesso corrente. A renovação encerra o ciclo anterior como `Renewed` e cria
o próximo na mesma transação, copiando os sistemas por padrão quando não houver
alteração.

Os estados `Active`, `Expiring`, `Expired` e `Closed` serão derivados. `Expiring`
significa vencimento entre zero e sete dias civis. Um ciclo expirado continua
corrente até ser renovado ou encerrado, preservando a pendência operacional.

### Preservar uma linha do tempo legível

`ThirdPartyAccessActivity` registra criação, atualização, anotação, renovação e
encerramento com mensagem legível, autor opcional e data. Eventos de sistema são
imutáveis; notas podem ser removidas enquanto o terceiro não estiver arquivado.

### Usar um workspace global

O novo botão ficará na barra principal abaixo de Projetos, usando ícone Lucide
de identificação/acesso. A rota hash `#third-party-access` não exige projeto. O
contexto lateral do projeto desaparece e o canvas usa a composição global.

O workspace terá resumo compacto, filtros, ledger contínuo e inspector amplo.
No celular, o ledger mantém rolagem interna quando necessário e o inspector
ocupa a largura disponível.

## Risks / Trade-offs

- [Datas no fim do mês] → aplicar adição de meses com limite no último dia do
  mês e cobrir janeiro, fevereiro e anos bissextos.
- [Dois ciclos correntes por falha concorrente] → validar e criar renovação em
  transação, com índice para busca do corrente e smoke de repetição.
- [Terceiro duplicado] → normalizar nome e empresa e impedir duplicidade ativa,
  sem tentar deduplicar pessoas de empresas diferentes.
- [Lista fixa ficar insuficiente] → manter validação centralizada para facilitar
  uma futura migração para catálogo configurável.
- [Módulo global confundir projeto ativo] → remover contexto de projeto e usar
  título explícito `Workspace local` nesta rota.

## Migration Plan

1. Criar tabelas e índices por migration aditiva.
2. Estender o setup idempotente para bancos existentes e novos.
3. Gerar Prisma Client e validar integridade sem alterar dados atuais.
4. Registrar API e smoke test.
5. Adicionar navegação e frontend.
6. Validar fluxo, temas e tamanhos de tela com dados temporários.

Rollback de código pode deixar as tabelas sem uso; nenhuma tabela existente é
alterada destrutivamente.

## Open Questions

Nenhuma questão bloqueante. A política de notificações e o destino Telegram
serão definidos em mudança posterior a partir dos ciclos confiáveis criados
aqui.
