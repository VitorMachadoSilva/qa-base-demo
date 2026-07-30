# QaBase Demo na Vercel e Neon

Esta branch publica uma edicao controlada do QaBase. Ela nao deve ser usada
para substituir a instalacao local da equipe.

## Escopo da demonstracao

A demo inclui:

- projetos e visao geral;
- fichas de validacao;
- repositorio de casos;
- planejamento;
- execucoes;
- anotacoes rapidas;
- conta e alteracao de senha.

A demo nao registra rotas nem exibe navegacao para:

- demandas AD/MF;
- acessos de terceiros;
- Telegram, notificacoes ou agendamentos.

## Isolamento

Nao existe cadastro publico. O operador provisiona 20 contas
`demo01@qabase.com` ate `demo20@qabase.com`.

Cada projeto possui um `ownerId`. Antes de qualquer controlador, a API valida
que projeto, suite, caso, plano, execucao ou ficha pertence ao usuario da
sessao. Anotacoes rapidas continuam filtradas diretamente pelo usuario.

Cada login invalida sessoes anteriores da mesma conta. No primeiro acesso, a
senha temporaria precisa ser substituida antes de abrir outras paginas.

## 1. Criar o banco no Neon

1. Crie um projeto no Neon na regiao mais proxima da Vercel.
2. No painel **Connect**, copie duas URLs:
   - a URL com hostname `-pooler` para `DATABASE_URL`;
   - a URL direta, sem `-pooler`, para `DIRECT_URL`.
3. As duas URLs devem manter `sslmode=require`.

Nunca envie essas URLs por chat nem as grave no Git.

## 2. Preparar o banco e as contas

No computador administrativo, crie `backend/.env` a partir de
`backend/.env.example` e preencha as duas URLs. Depois:

```bash
cd backend
npm install
npm run db:deploy
npm run demo:provision
```

O ultimo comando cria exatamente 20 usuarios e salva as senhas aleatorias em
`private/demo-credentials-<data>.csv`. Essa pasta e ignorada pelo Git. Guarde o
arquivo em local protegido e entregue uma linha diferente para cada pessoa.

Se o provisionamento encontrar qualquer uma dessas contas, ele e interrompido
sem alterar senhas existentes.

## 3. Criar o projeto na Vercel

1. Importe o repositorio na Vercel.
2. Selecione a branch `codex/vercel-neon-demo`.
3. Mantenha a raiz do projeto no diretorio principal do repositorio.
4. Cadastre em **Settings > Environment Variables**:

```text
DATABASE_URL=<URL pooled do Neon>
DIRECT_URL=<URL direta do Neon>
QABASE_SECURE_COOKIES=true
QABASE_TRUST_PROXY=true
```

5. Aplique as variaveis em Production e Preview somente quando ambos puderem
   usar o mesmo conjunto de dados. Para isolamento entre ambientes, use uma
   branch separada do Neon para Preview.
6. Inicie o deploy.

`vercel.json` publica frontend e backend sob a mesma origem. Requisicoes
`/api/*` vao para o Express; as demais vao para o Vite.

## 4. Validar

Depois do deploy:

1. confirme `GET /api/health`;
2. entre com `demo01@qabase.com`;
3. altere a senha temporaria;
4. crie um projeto e uma nota;
5. entre com `demo02@qabase.com` em janela privada;
6. confirme que projeto e nota da conta 01 nao aparecem;
7. tente abrir pela URL um id da conta 01 e confirme resposta 404;
8. confirme que AD/MF, terceiros e Telegram nao aparecem;
9. teste logout e novo login.

## Operacao

- nao compartilhe uma mesma conta entre visitantes;
- desative uma conta alterando `User.active` no Neon;
- use `User.expiresAt` para limitar o periodo da demonstracao;
- nao execute `demo:provision` como etapa automatica de build;
- nao use dados reais, pessoais ou confidenciais na demonstracao;
- monitore armazenamento, conexoes e compute no painel do Neon.
