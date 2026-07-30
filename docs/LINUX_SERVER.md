# QaBase em servidor Linux

Este guia prepara uma instancia unica do QaBase para uso por dispositivos da
mesma rede local. A interface e a API usam o mesmo endereco, e o banco permanece
em um volume separado do container.

> Nao encaminhe a porta do QaBase para a internet. O modo inicial usa HTTP e foi
> desenhado para uma rede interna confiavel.

## 1. Pre-requisitos

- computador Linux x86_64 ou ARM64 conectado por cabo, quando possivel;
- Docker Engine;
- plugin Docker Compose (`docker compose version`);
- pelo menos 2 GB de RAM e 2 GB livres em disco;
- reserva DHCP ou IP fixo para o servidor;
- copia do repositorio QaBase no servidor.

Use a instalacao oficial correspondente a distribuicao:

- Ubuntu: https://docs.docker.com/engine/install/ubuntu/
- Debian: https://docs.docker.com/engine/install/debian/
- outras distribuicoes: https://docs.docker.com/engine/install/

O plugin Compose e o formato recomendado no Linux. Nao use o executavel legado
`docker-compose`.

## 2. Configuracao inicial

Na raiz do projeto:

```bash
cp deploy/.env.example deploy/.env
nano deploy/.env
```

Preencha `TELEGRAM_BOT_TOKEN` com o token ja usado pelo QaBase. Mantenha:

```dotenv
QABASE_PORT=8080
QABASE_SECURE_COOKIES=false
QABASE_TRUST_PROXY=false
QABASE_BACKUP_RETENTION_DAYS=30
```

O arquivo `deploy/.env` contem segredo e esta ignorado pelo Git.

Prepare a pasta de backups:

```bash
mkdir -p deploy/backups
chmod 700 deploy/backups
```

## 3. Primeira inicializacao

```bash
docker compose \
  --env-file deploy/.env \
  -f deploy/compose.yaml \
  up -d --build
```

Consulte o estado:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml ps
docker compose --env-file deploy/.env -f deploy/compose.yaml logs --tail=100 qabase
```

O servico deve aparecer como `healthy`. No proprio servidor:

```bash
curl http://127.0.0.1:8080/api/health
```

Resposta esperada:

```json
{"status":"ok"}
```

## 4. Acesso pela rede

Descubra o IP:

```bash
hostname -I
```

Em outro computador ou celular da mesma rede, abra:

```text
http://IP_DO_SERVIDOR:8080
```

Exemplo: `http://192.168.1.50:8080`.

Crie uma reserva DHCP no roteador para que esse IP nao mude. Caso o firewall do
servidor esteja ativo, permita a porta somente para a sub-rede local. Exemplo com
UFW para uma rede `192.168.1.0/24`:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 8080 proto tcp
```

Docker pode interagir diretamente com regras de firewall. Confirme o acesso a
partir de outro dispositivo e revise a documentacao oficial de firewall do
Docker antes de aplicar regras mais restritivas.

## 5. Persistencia

O banco fica no volume Docker `qabase-data`, no caminho `/data/qabase.db` dentro
do container. Recriar ou atualizar o container nao remove esse volume.

Comando normal para desligar:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml down
```

Nao execute `down -v`. A opcao `-v` remove o volume e, portanto, o banco.

O SQLite usa WAL, espera de cinco segundos para bloqueios transitórios e uma
unica instancia do backend. Essa configuracao atende uma equipe pequena, mas nao
deve ser escalada para varias replicas.

## 6. Backup

Crie uma copia consistente enquanto o QaBase estiver ativo:

```bash
sh scripts/linux/backup-qabase.sh
```

O arquivo sera criado em `deploy/backups/qabase-AAAAMMDD-HHMMSS.db`. Copie os
backups periodicamente para outro computador ou armazenamento protegido. O
script remove apenas backups QaBase mais antigos que
`QABASE_BACKUP_RETENTION_DAYS`.

Valide a presenca do arquivo:

```bash
ls -lh deploy/backups
```

## 7. Restauracao da instancia

1. Pare o servico:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml stop qabase
```

2. Preserve uma copia do banco atual antes de substituir qualquer arquivo.
3. Remova arquivos auxiliares antigos e ajuste o proprietario:

```bash
docker compose \
  --env-file deploy/.env \
  -f deploy/compose.yaml \
  run --rm --user root --entrypoint sh qabase \
  -c 'rm -f /data/qabase.db-wal /data/qabase.db-shm'
```

4. Copie o backup escolhido para o container parado:

```bash
docker compose \
  --env-file deploy/.env \
  -f deploy/compose.yaml \
  cp deploy/backups/qabase-AAAAMMDD-HHMMSS.db qabase:/data/qabase.db
```

5. Corrija a permissao e reinicie:

```bash
docker compose \
  --env-file deploy/.env \
  -f deploy/compose.yaml \
  run --rm --user root --entrypoint chown qabase \
  node:node /data/qabase.db

docker compose --env-file deploy/.env -f deploy/compose.yaml start qabase
```

Confirme o health check e abra projetos, notas e configuracoes antes de liberar
novamente para a equipe.

## 8. Migracao do banco atual

Para levar `backend/prisma/dev.db` ao servidor:

1. encerre o QaBase no computador de origem;
2. copie `dev.db` para `deploy/backups/qabase-migracao.db` no servidor;
3. inicie o Compose uma vez para criar o container e depois pare o servico;
4. siga o procedimento de restauracao usando `qabase-migracao.db`.

Copiar somente `dev.db` com a aplicacao de origem ativa pode ignorar alteracoes
presentes no WAL. Sempre encerre a instancia antiga antes da copia.

## 9. Atualizacao

Antes de atualizar, gere um backup. Depois:

```bash
git pull
docker compose \
  --env-file deploy/.env \
  -f deploy/compose.yaml \
  up -d --build
```

O entrypoint prepara o banco de forma idempotente. Verifique:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yaml ps
docker compose --env-file deploy/.env -f deploy/compose.yaml logs --tail=100 qabase
```

## 10. Diagnostico rapido

**A pagina nao abre em outro dispositivo**

- confirme o IP com `hostname -I`;
- confirme `healthy` em `docker compose ps`;
- teste `curl http://127.0.0.1:8080/api/health` no servidor;
- confirme a porta no firewall e a ausencia de isolamento entre clientes Wi-Fi.

**Login ou salvamento retorna erro de origem**

- acesse pelo mesmo endereco exibido no navegador;
- nao misture nomes, IPs, HTTP e HTTPS durante a mesma sessao;
- mantenha frontend e API no mesmo Compose.

**Telegram nao envia**

- confirme `TELEGRAM_BOT_TOKEN` em `deploy/.env`;
- veja os logs do servico;
- use o teste de canal na pagina Configuracoes e notificacoes.

**Banco bloqueado**

- confirme que existe somente uma replica de `qabase`;
- nao execute dois projetos Compose apontando para `qabase-data`;
- verifique espaco em disco e permissoes do volume.

## Seguranca

- use o QaBase apenas na rede interna;
- nao publique a porta 8080 no roteador;
- proteja `deploy/.env` e a pasta `deploy/backups`;
- altere as senhas iniciais de todos os usuarios;
- para acesso externo ou redes nao confiaveis, configure HTTPS e uma VPN antes
  de liberar o servico.
