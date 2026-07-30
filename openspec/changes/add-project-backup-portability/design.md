## Context

O QaBase usa SQLite/Prisma e concentra em `Project` um grafo relacional extenso:
suítes hierárquicas, casos e passos, componentes, planos compostos, configurações,
marcos, ambientes, execuções com snapshots e resultados, fichas de validação e
demandas AD/MF. A exclusão de um projeto já percorre esse grafo por cascata, mas
hoje não existe uma operação inversa capaz de reconstruí-lo.

Os três usuários autenticados compartilham os projetos. Notas rápidas pertencem a
usuários, enquanto terceiros e notificações são globais. Esses dados não podem
ser incluídos implicitamente em um backup de projeto. A solução deve continuar
local, funcionar no navegador e evitar dependência de um serviço externo.

## Goals / Non-Goals

**Goals:**

- produzir uma cópia completa, portátil e verificável de um projeto;
- preservar conteúdo, hierarquias, vínculos, snapshots, resultados e datas;
- detectar corrupção, formato incompatível e referências inválidas antes de
  escrever no banco;
- apresentar uma prévia compreensível antes da restauração;
- restaurar sempre em um novo projeto e sem alterar o projeto de origem;
- garantir atomicidade e reconstruir relações com novos ids locais;
- manter um contrato de arquivo evolutivo e testável.

**Non-Goals:**

- mesclar ou substituir um projeto existente;
- backup automático, agendamento, retenção ou armazenamento em nuvem;
- backup integral do SQLite, contas, senhas, sessões ou configurações globais;
- incluir notas rápidas, terceiros, Telegram ou histórico de notificações;
- criptografar ou assinar digitalmente o arquivo;
- importar CSV, Excel, XML ou formatos de outras plataformas;
- incluir anexos binários, que ainda não existem no modelo atual.

## Decisions

### Arquivo JSON versionado com extensão `.qabase`

O download será um documento JSON UTF-8 com MIME
`application/vnd.qabase.project-backup+json` e extensão `.qabase`. O documento
terá quatro blocos:

- `format`: identificador fixo `qabase.project-backup`;
- `version`: versão inteira do contrato, iniciando em `1`;
- `manifest`: aplicação, data de exportação, nome de origem, contagens e
  algoritmo de integridade;
- `payload`: projeto e coleções de entidades;
- `integrity`: SHA-256 da representação canônica de `payload`.

JSON foi escolhido por ser auditável, simples de validar e suficiente enquanto
o produto armazena texto e links, não arquivos binários. Um ZIP com múltiplos
arquivos reduziria tamanho, mas adicionaria dependência e mais pontos de falha
sem benefício material nesta fase.

O nome seguirá
`qabase-<projeto>-<AAAAMMDD-HHmmss>.qabase`, com slug seguro para Windows.

### Referências portáteis em vez de ids do banco

Cada registro exportado receberá uma referência local ao arquivo, como
`suite:12`, `case:31` ou `run:8`. Relações apontarão para essas referências, não
para ids que possam colidir na base de destino. Datas serão serializadas em ISO
8601 e todos os campos funcionais, inclusive snapshots e resultados históricos,
serão preservados.

O payload cobrirá:

1. projeto;
2. suítes, casos, passos, componentes e associações;
3. planos, seções, itens e dependências;
4. marcos, ambientes, grupos e opções de configuração;
5. fichas, pastas, critérios, checks e notas de validação;
6. execuções, seções, casos executados, dependências e configurações;
7. demandas AD/MF, vínculos entre demandas e atividades.

Alternativa considerada: preservar os ids numéricos. Foi rejeitada porque
impediria restaurações repetidas e criaria colisões ou dependência da sequência
interna do SQLite.

### Snapshot consistente na exportação

O serviço de exportação lerá todo o grafo em uma transação de leitura do Prisma,
produzindo uma visão consistente mesmo se outro usuário editar o projeto durante
a geração. A API responderá somente depois de validar internamente as
referências e conferir se as contagens do manifesto correspondem ao payload.

`GET /api/projects/:id/backup` exigirá sessão autenticada e retornará o arquivo
como download. Gerar o arquivo não modificará `updatedAt` do projeto.

### Integridade por SHA-256 canônico

Objetos do payload serão serializados com chaves ordenadas recursivamente antes
do hash. A importação recalculará o SHA-256 e rejeitará qualquer divergência.
Esse checksum detecta truncamento e alteração acidental, mas não é uma assinatura
contra adulteração intencional.

Alternativa considerada: confiar apenas no JSON válido. Foi rejeitada porque um
arquivo pode continuar sintaticamente válido após perda ou alteração parcial.

### Prévia sem escrita e importação não destrutiva

O frontend manterá o arquivo selecionado em memória e o enviará duas vezes:

- `POST /api/project-backups/preview` valida e devolve origem, data, versão,
  checksum, tamanho, contagens, nome sugerido e avisos, sem escrever no banco;
- `POST /api/project-backups/import?name=<nome>` repete toda a validação e
  restaura o conteúdo após confirmação.

Os endpoints receberão o documento diretamente com o MIME do backup e um parser
JSON específico com limite inicial de 50 MiB. O router de importação será
montado antes do parser JSON geral para não ampliar o limite das demais rotas.
Extensão e MIME ajudam a interface, mas a aceitação dependerá do conteúdo.

O nome sugerido será `<nome original> - restaurado`, ganhando sufixo numérico
quando necessário. O usuário poderá alterá-lo antes de confirmar. A primeira
versão nunca oferecerá “substituir”, “sincronizar” ou “mesclar”.

Alternativa considerada: restaurar sobre o projeto selecionado. Foi rejeitada
porque um erro de arquivo, escolha ou mapeamento teria potencial destrutivo.

### Validação em camadas

A prévia e a importação usarão o mesmo pipeline:

1. limite de tamanho e parse seguro;
2. `format` e `version`;
3. schema Zod estrito por versão;
4. checksum e contagens;
5. unicidade das referências;
6. existência e tipo de cada referência;
7. pertencimento de todos os vínculos ao mesmo payload;
8. posições únicas e enums conhecidos;
9. ausência de ciclos em hierarquias e dependências;
10. datas e regras invariantes do domínio.

Versões futuras terão adaptadores explícitos. Uma versão superior à suportada
será rejeitada com mensagem que orienta atualizar o QaBase; campos desconhecidos
não serão ignorados silenciosamente.

### Restauração transacional e em fases

Uma única transação Prisma reconstruirá o grafo e manterá mapas
`referência do arquivo -> novo id`. A ordem respeitará dependências:

1. projeto;
2. hierarquias e cadastros independentes;
3. casos, passos e associações;
4. planos e fichas de validação;
5. execuções e seus snapshots;
6. demandas e atividades;
7. segundo passe para dependências autorreferentes e vínculos cruzados.

Qualquer falha causará rollback integral. O tempo da transação será configurado
para restaurações maiores sem retirar o limite total do arquivo. O resultado
retornará o novo projeto e as contagens realmente inseridas.

### Interface na gestão de projetos

“Importar backup” ficará na barra de comandos da página Projetos, ao lado de
“Novo projeto”, com ícone de upload. Cada linha terá uma ação de download com
ícone e tooltip “Exportar backup”, junto das ações de editar e excluir.

Após escolher um arquivo, uma modal própria exibirá identidade do backup,
data, versão, tamanho, contagens por área, avisos e o nome do novo projeto.
Somente uma prévia válida habilitará “Restaurar projeto”. Durante exportação,
validação e importação, a ação mostrará estado ocupado e impedirá submissão
duplicada. Sucesso abrirá o novo projeto; falhas preservarão a tela e explicarão
se o problema é arquivo, versão, integridade, relação ou servidor.

### Validação por round trip

O teste principal exportará um projeto representativo, importará o arquivo e
exportará o projeto restaurado. Os dois payloads normalizados deverão ser
equivalentes depois de remover referências regeneradas, nome restaurado e
metadados de exportação. Haverá casos separados para projeto vazio, histórico
completo, corrupção, versão incompatível, relação quebrada e rollback.

## Risks / Trade-offs

- [Backup sem criptografia pode conter informações internas] -> alertar que o
  arquivo deve ser armazenado em local protegido e nunca incluir credenciais ou
  tokens globais.
- [Checksum não prova autoria] -> documentar que ele detecta integridade
  acidental; assinatura ou criptografia ficam para uma evolução específica.
- [Projeto grande pode consumir memória no navegador e servidor] -> limitar a
  50 MiB, indicar tamanho na prévia e manter anexos fora do formato inicial.
- [Nova entidade de projeto pode ser esquecida no exportador] -> centralizar o
  manifesto de coleções e manter teste que compara o grafo Prisma suportado com
  o contrato de backup.
- [Mudanças simultâneas podem gerar cópia incoerente] -> ler em uma transação e
  validar referências e contagens antes de responder.
- [Importação longa bloqueia escrita no SQLite] -> validar tudo antes da
  transação e executar dentro dela apenas a criação ordenada.
- [Arquivo válido importado repetidamente cria cópias] -> exigir confirmação em
  cada operação e gerar nomes distintos; deduplicação destrutiva fica fora.
- [Evolução do schema quebra arquivos antigos] -> versionar o contrato, manter
  fixtures da versão 1 e criar adaptadores explícitos quando o formato evoluir.

## Migration Plan

1. Introduzir schemas, serialização canônica e fixtures sem alterar o banco.
2. Implementar exportação e validar arquivos contra projetos existentes.
3. Implementar prévia e restauração transacional com mapeamento de ids.
4. Integrar as ações e a modal na página Projetos.
5. Executar round trip, rollback, smokes existentes, build e validação visual.
6. Documentar armazenamento seguro, compatibilidade e procedimento de
   restauração.

Não há migration obrigatória de dados. Rollback remove endpoints e interface;
arquivos `.qabase` já gerados permanecem válidos para uma versão futura que
continue suportando o contrato `1`.

## Open Questions

Nenhuma decisão funcional permanece aberta para a primeira versão. Backup
automático rotativo da instância completa é a evolução recomendada depois desta
entrega.
