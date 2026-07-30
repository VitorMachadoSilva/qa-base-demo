# Verificacao final

Data: 2026-07-28

## Resultado

A mudanca foi implementada e validada de ponta a ponta. O QaBase exporta um
projeto para um arquivo `.qabase`, valida o arquivo antes de qualquer escrita e
sempre restaura o conteudo como um novo projeto.

## Evidencias automatizadas

- `smokeProjectBackups.js`: fixtures vazia e representativa, cobertura de
  modelos Prisma, checksum deterministico, exportacao, previa, importacao,
  corrupcao, versao futura, referencia invalida, rollback, importacoes
  repetidas e round trip export-import-export.
- `checkDatabase.js`: nenhuma relacao orfa ou inconsistencia encontrada.
- Smokes existentes: autenticacao, repositorio, planos compostos, AD/MF,
  anotacoes rapidas, notificacoes e acessos de terceiros aprovados.
- Parser HTTP: `INVALID_JSON`, `INVALID_REQUEST_JSON` e
  `BACKUP_TOO_LARGE` confirmados contra a API local.
- Build de producao do frontend: aprovado com 1.609 modulos transformados.
- OpenSpec: mudanca validada sem erros.

## Evidencias visuais

- Exportacao acionada pela linha do projeto e arquivo `.qabase` baixado.
- Previa exibiu origem, data, versao, tamanho, contagens, checksum e nome
  sugerido.
- Restauracao criou e abriu um novo projeto, mantendo o original intacto.
- Modal revisado nos temas claro e escuro.
- Modal revisado em 1280x720 e 390x844, sem overflow horizontal.
- Escape fecha o modal; foco inicial, bloqueio durante processamento e
  navegacao por teclado foram revisados.
- Projetos temporarios usados na verificacao foram removidos.

## Escopo de seguranca

O arquivo nao inclui usuarios, sessoes, senhas, anotacoes privadas,
configuracoes globais, credenciais do Telegram, terceiros ou historico de
notificacoes. O arquivo possui verificacao SHA-256, mas nao e criptografado.

O backup automatico e rotativo do banco completo continua como uma evolucao
separada, pois atende recuperacao operacional da instancia e nao portabilidade
de um projeto.
