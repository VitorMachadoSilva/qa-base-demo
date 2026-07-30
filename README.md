# QaBase

Ferramenta local para organizar testes de software, inspirada em Qase/TestRail,
mas simples, gratuita e focada no trabalho diário de QA.

> Esta branch contem a edicao controlada de demonstracao para Vercel e Neon.
> Ela usa 20 contas previamente provisionadas e dados isolados por usuario.
> Consulte [`docs/VERCEL_NEON_DEMO.md`](docs/VERCEL_NEON_DEMO.md).

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Banco: SQLite
- ORM: Prisma

## Como rodar

Instale as dependencias em cada pasta:

```bash
cd backend
npm install
npm run setup-db
npm run dev
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

URLs locais:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001/api`
- SQLite: `backend/prisma/dev.db`

### Inicialização rápida no Windows

Na raiz do projeto, execute `Iniciar-QaBase.bat` com dois cliques. O arquivo
prepara dependências e banco quando necessário, inicia API e interface sem
duplicar serviços já ativos e abre o QaBase no navegador.

Para desligar os dois serviços, execute `Encerrar-QaBase.bat`.

### Servidor Linux na rede local

A distribuição recomendada para uso compartilhado utiliza Docker Compose, uma
única porta para interface e API, banco SQLite persistente, health check,
reinicialização automática e backup consistente.

O procedimento completo está em `docs/LINUX_SERVER.md`. O início resumido é:

```bash
cp deploy/.env.example deploy/.env
# Preencha TELEGRAM_BOT_TOKEN em deploy/.env
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --build
```

Depois, acesse `http://IP_DO_SERVIDOR:8080` a partir de outro dispositivo da
mesma rede. Não publique essa porta diretamente na internet.

## Fluxos implementados

- Listar projetos
- Criar projeto
- Editar projeto
- Excluir projeto
- Exportar e restaurar backups completos de projetos
- Navegar pelo workspace do projeto
- Organizar fichas de validação em pastas livres
- Registrar objetivo, escopo, link do card, critérios, checklist e notas
- Promover testes úteis da ficha para casos reutilizáveis
- Criar, editar e excluir suítes e casos de teste
- Planejar com planos, milestones, ambientes e configurações
- Executar runs com snapshots e histórico confiável
- Entrar com uma das contas locais autorizadas
- Alterar a própria senha e encerrar a sessão em Minha conta
- Manter Anotações rápidas privadas para cada usuário
- Alternar entre temas claro e escuro

## Backup de projetos

Na pagina Projetos, use o icone de download da linha para gerar um arquivo
`.qabase`. Para restaura-lo, escolha **Importar backup**, revise a previa e
confirme o nome do novo projeto.

O processo nunca substitui projetos existentes. Os arquivos possuem verificacao
de integridade, mas nao sao criptografados; mantenha-os em armazenamento
protegido e, de preferencia, em mais de um dispositivo.

## Especificações e pesquisa

- `BENCHMARK.md`: comparação de padrões de Qase, TestRail, PractiTest e Zephyr
- `openspec/config.yaml`: contexto permanente do produto para IA
- `openspec/changes/add-validation-brief-workspace/`: proposta, requisitos,
  desenho técnico, tarefas e evidências da evolução atual

## Observacao sobre Prisma

O schema Prisma esta valido e o Prisma Client foi gerado. Neste ambiente, `prisma migrate dev` retornou um erro vazio do schema engine, entao o banco inicial tambem pode ser criado com:

```bash
cd backend
npm run setup-db
```

A migration SQL equivalente fica em `backend/prisma/migrations/20260721190000_init/migration.sql`.

## Autenticação local

O setup cria somente as contas fixas definidas pelo produto e preserva senhas
que já tenham sido alteradas. Não há cadastro ou recuperação pela interface.
Para uma redefinição operacional, informe a nova senha apenas pela variável
`QABASE_RESET_PASSWORD` e execute:

```bash
cd backend
npm run user:reset-password -- usuario@qabase.com
```

Em uma implantação compartilhada, publique frontend e API por HTTPS e configure
`QABASE_SECURE_COOKIES=true`.
