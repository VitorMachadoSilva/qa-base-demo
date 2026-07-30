## Why

O QaBase precisa reconhecer cada integrante da equipe antes de evoluir para uso
compartilhado em um servidor local. A autenticação também permite preservar o
caráter pessoal de Anotações rápidas sem fragmentar projetos, casos, execuções e
demais áreas colaborativas.

## What Changes

- Adiciona login local obrigatório para três contas fixas do QaBase.
- Adiciona sessões persistentes por sete dias, logout e proteção de todas as
  rotas operacionais da API.
- Adiciona a página global Minha conta para consultar a identidade conectada e
  alterar a própria senha mediante confirmação da senha atual.
- Exibe uma única vez por usuário um aviso de que a senha pode ser alterada em
  Minha conta.
- **BREAKING**: remove todas as anotações rápidas existentes durante a migração
  e torna obrigatório o proprietário de cada nova nota.
- Isola listagem, busca, pastas diárias, leitura, criação, edição e exclusão de
  anotações pelo usuário autenticado.
- Mantém projetos, planejamento, repositório, execuções, validações, AD/MF,
  acessos de terceiros e configurações de notificações compartilhados entre
  todos os usuários autenticados.
- Adiciona um procedimento local de manutenção para redefinir senhas sem criar
  cadastro, recuperação de senha ou administração de usuários na interface.
- Mantém fora desta mudança permissões e papéis, auditoria por autor nos dados
  compartilhados, provedores externos, autoatendimento de cadastro e a
  padronização global dos diálogos de confirmação.

## Capabilities

### New Capabilities

- `local-user-authentication`: contas fixas, login, sessões persistentes,
  proteção da API, logout, alteração e redefinição local de senha.

### Modified Capabilities

- `quick-notes`: anotações passam a pertencer exclusivamente ao usuário
  autenticado e os dados anteriores são removidos na migração.
- `quality-instrument-interface`: o shell passa a ter barreira de login,
  identidade da sessão, destino Minha conta e aviso inicial de segurança.

## Impact

A mudança afeta o schema e as migrations Prisma, inicialização do banco,
middlewares e rotas Express, validação Zod, cliente HTTP do frontend, roteamento
e shell React, workspace de notas, documentação e smoke tests. Será necessária
uma biblioteca de hash de senha e configuração de cookies/CORS para
credenciais. Em uma futura exposição pela rede, o servidor deverá operar sob
HTTPS para proteger credenciais e cookies.
