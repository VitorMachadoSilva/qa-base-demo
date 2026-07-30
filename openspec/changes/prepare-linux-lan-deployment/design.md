## Context

O QaBase usa React/Vite, Express, Prisma e SQLite. No desenvolvimento, Vite escuta
na porta 5173 e encaminha `/api` para a porta 3001. Em produção na rede local,
manter dois processos e duas origens exigiria CORS dinâmico, mais portas abertas e
mais pontos de falha. O agendador do Telegram também exige que somente uma
instância do backend esteja ativa.

## Goals / Non-Goals

**Goals:**

- iniciar o QaBase de forma reproduzível em Linux;
- expor interface e API em um único endereço da rede local;
- preservar banco e backups quando o container for substituído;
- reiniciar o serviço após falhas ou reinicialização do computador;
- tolerar o volume pequeno de escritas simultâneas da equipe;
- fornecer procedimentos claros de instalação, atualização, backup e restauração;
- manter o desenvolvimento local atual funcionando.

**Non-Goals:**

- publicar o QaBase diretamente na internet;
- executar múltiplas réplicas do backend;
- substituir SQLite por PostgreSQL nesta etapa;
- configurar domínio público, certificado TLS ou descoberta automática na rede;
- administrar firewall, IP fixo ou DNS do roteador;
- automatizar cópia de backups para outro equipamento.

## Decisions

### Docker Compose como distribuição principal

Um build multiestágio produzirá o frontend e instalará as dependências Linux do
backend. O Compose executará exatamente um serviço `qabase`, com política
`unless-stopped`, health check e uma porta configurável. Isso evita dependência da
versão de Node instalada no servidor e reduz diferenças entre distribuições.

### Uma única origem HTTP

O Express servirá `frontend/dist` em produção e manterá `/api` no mesmo host e
porta. O navegador usará URLs relativas já adotadas pelo frontend. Mutações
aceitarão a origem que corresponder ao host da própria requisição, além das
origens explicitamente configuradas para desenvolvimento.

### Persistência explícita

O banco usará `DATABASE_URL=file:/data/qabase.db` em um volume nomeado. A pasta
`deploy/backups` será montada separadamente para cópias consistentes e fáceis de
transferir a outro equipamento. O banco nunca ficará apenas na camada gravável do
container.

### Concorrência SQLite adequada ao uso da equipe

Na inicialização serão aplicados `journal_mode=WAL`, `busy_timeout=5000`,
`synchronous=NORMAL` e `foreign_keys=ON`. Essa configuração reduz falhas
transitórias de bloqueio para poucas sessões simultâneas, sem prometer escala de
banco cliente-servidor. O Compose manterá uma única réplica.

### Inicialização e encerramento controlados

O entrypoint executará o setup idempotente do banco antes do servidor. O backend
só abrirá a porta depois da configuração do banco. Sinais SIGTERM/SIGINT
encerrarão o HTTP, o agendador e o Prisma antes da saída.

### Backup consistente com SQLite online

Um script Node executado dentro do container usará `VACUUM INTO` para criar uma
cópia consistente sem copiar diretamente o arquivo e o WAL durante escritas. Um
script shell dará nome por data e aplicará retenção configurável.

## Risks / Trade-offs

- [HTTP expõe credenciais dentro da rede] -> limitar ao segmento confiável e não
  encaminhar a porta para a internet; HTTPS fica como evolução de infraestrutura.
- [SQLite tem um único escritor] -> WAL e espera por bloqueio atendem a equipe
  pequena; crescimento ou múltiplas réplicas exigirão PostgreSQL.
- [Volume Docker pode ser removido por engano] -> documentar que `down -v` apaga
  dados e criar backups fora do volume do banco.
- [Agendador duplicado enviaria mensagens repetidas] -> manter uma réplica e não
  configurar escalonamento horizontal.
- [IP do servidor pode mudar] -> recomendar reserva DHCP ou IP fixo, decisão que
  permanece sob controle da rede local.

## Migration Plan

1. Gerar uma cópia do banco atual com o QaBase parado ou por backup consistente.
2. Instalar Docker Engine e o plugin Compose no servidor.
3. Copiar o projeto e criar `deploy/.env` a partir do exemplo.
4. Construir e iniciar o serviço.
5. Confirmar health check e acesso pelo IP do servidor em outro dispositivo.
6. Copiar o banco existente para o volume apenas durante a migração inicial, se
   necessário, seguindo o procedimento documentado.
7. Criar e transferir o primeiro backup para outro equipamento.

Rollback interrompe o container novo e preserva o volume. A instância anterior
pode ser retomada com seu banco original.

## Open Questions

- A distribuição Linux e o endereço definitivo do servidor serão confirmados no
  momento da instalação física.
- HTTPS interno e nome DNS amigável poderão ser adicionados depois que o acesso
  básico por IP estiver estável.
