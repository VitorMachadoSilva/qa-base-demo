# Verification

Data: 2026-07-29

## Resultado

A implementação está funcionalmente validada no ambiente Windows atual. A
validação da imagem e do Compose permanece pendente porque Docker não está
instalado neste computador; ela deverá ser executada no servidor Linux antes da
liberação para a equipe.

## Evidências aprovadas

- `npm run build` no frontend: 1610 módulos transformados e build concluído.
- `npm run setup-db`: setup idempotente concluído com SQLite pronto.
- `npm run smoke:production`: health check, SPA fallback, isolamento das rotas
  `/api`, origem do próprio host e rejeição de origem estrangeira aprovados.
- `npm run smoke`: repositório, planejamento, execução, validações e regras de
  domínio aprovados.
- `npm run smoke:auth`: autenticação, sessão, troca de senha, logout e proteção
  de origem aprovados.
- `npm run smoke:quick-notes`: privacidade e operações de notas aprovadas.
- `npm run smoke:third-party-access`: fluxo de acessos aprovado.
- `npm run smoke:backups`: backup portátil de projetos aprovado.
- `npm run db:check`: nenhuma inconsistência ou registro órfão encontrado.
- Backup de instância por `VACUUM INTO`: arquivo de 544768 bytes criado e
  aprovado por `PRAGMA integrity_check`.
- `npm audit --omit=dev`: zero vulnerabilidades na árvore instalada em produção.
- `sh -n deploy/entrypoint.sh`: sintaxe aprovada.
- `sh -n scripts/linux/backup-qabase.sh`: sintaxe aprovada.
- `git diff --check`: nenhuma falha de whitespace.

## Limitações registradas

- Docker Engine e o plugin Compose não estão disponíveis no computador de
  desenvolvimento; `docker compose config`, build da imagem e health do
  container precisam ser confirmados no Linux.
- O utilitário OpenSpec não está instalado; os artefatos foram criados conforme
  o schema `spec-driven`, mas a validação estrita pelo CLI permanece indisponível.
- O `npm audit` completo reporta uma vulnerabilidade em `brace-expansion`
  presente apenas na árvore de desenvolvimento. A imagem executa
  `npm prune --omit=dev`, e `npm audit --omit=dev` aprovou a árvore de runtime.

## Checklist para o servidor

```bash
cp deploy/.env.example deploy/.env
docker compose --env-file deploy/.env -f deploy/compose.yaml config
docker compose --env-file deploy/.env -f deploy/compose.yaml build --no-cache
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d
docker compose --env-file deploy/.env -f deploy/compose.yaml ps
curl http://127.0.0.1:8080/api/health
sh scripts/linux/backup-qabase.sh
```

Depois, acessar `http://IP_DO_SERVIDOR:8080` em outro dispositivo e validar
login, salvamento, notas privadas, Telegram e download de backup.
