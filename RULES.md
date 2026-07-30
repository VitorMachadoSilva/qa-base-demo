# RULES.md — Convenções e Regras do Projeto

Estas são regras que a IA (ou você) deve seguir ao gerar ou editar código neste projeto. Não quebrar sem um motivo explícito.

## Convenções gerais
1. **Idioma no código**: nomes de variáveis, funções e arquivos em inglês. Comentários podem ser em português.
2. **Nomenclatura**:
   - Componentes React: `PascalCase` (ex: `TestCaseTable.jsx`)
   - Funções e variáveis: `camelCase`
   - Arquivos de rotas/controllers no backend: `camelCase` (ex: `testCases.js`)
   - Tabelas do banco: `PascalCase` singular (ex: `TestCase`, `Project`) — padrão Prisma
3. **Sem uso de `any` implícito** caso o projeto evolua para TypeScript no futuro.
4. **Sem bibliotecas desnecessárias**: antes de instalar uma nova dependência, verificar se já não é possível resolver com o que já está no projeto (evitar inchar o `node_modules` para um projeto local pequeno).

## Backend (Node/Express)
- Estrutura em camadas: `routes` → `controllers` → `db` (sem lógica de negócio direto nas rotas)
- Toda rota deve validar o body da requisição antes de tocar no banco (usar `zod` ou validação manual simples)
- Erros devem retornar JSON no formato:
  ```json
  { "error": "Mensagem clara do que deu errado" }
  ```
- Nunca deixar `console.log` esquecido em código de produção — usar apenas durante debug e remover depois
- Toda query ao banco via Prisma Client, nunca SQL cru concatenado (evitar SQL injection, mesmo sendo local)

## Frontend (React)
- Componentes funcionais com hooks — nada de class components
- Chamadas à API centralizadas em `src/services/api.js`, nunca `fetch` espalhado dentro de componentes
- Estado global simples: usar Context API se necessário; **não** adicionar Redux/Zustand a menos que o projeto cresça muito (é um projeto pessoal, manter simples)
- Nomear handlers de eventos como `handleX` (ex: `handleSubmit`, `handleDeleteCase`)
- Evitar lógica de negócio dentro de JSX — extrair para funções auxiliares

## Banco de dados
- Toda alteração de schema deve passar por uma migration do Prisma (`npx prisma migrate dev --name descricao_da_mudanca`)
- Nunca editar `database.db` manualmente fora de migrations
- Nomes de colunas em `camelCase` (padrão Prisma mapeia automaticamente)

## Git (se for versionar, mesmo sendo local)
- Commits pequenos e descritivos (ex: `feat: adiciona CRUD de test cases`, `fix: corrige status não atualizando no run`)
- `.gitignore` deve incluir: `node_modules/`, `database.db`, `.env`, `dist/`

## Ao pedir para a IA gerar código neste projeto
- Sempre referenciar qual arquivo de contexto é relevante (ex: "seguindo o ARCHITECTURE.md, crie a rota de...")
- Pedir por partes: 1 endpoint ou 1 componente por vez, não o projeto inteiro de uma vez
- Sempre pedir para a IA explicar brevemente o que foi feito, não só entregar o código
- Se a IA sugerir uma biblioteca nova, questionar se é realmente necessária antes de aceitar

## Testes do próprio projeto (meta, eu sei)
- Não é obrigatório ter testes automatizados no MVP (ironia à parte, o foco é entregar rápido)
- Se decidir adicionar depois: Jest para backend, React Testing Library para frontend
