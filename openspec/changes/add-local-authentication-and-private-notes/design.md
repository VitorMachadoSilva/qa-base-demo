## Context

O QaBase atualmente inicia diretamente no shell, aceita todas as chamadas da API
sem identidade e armazena QuickNote sem proprietário. O produto continuará
local, mas precisa permitir três pessoas no mesmo servidor, compartilhando o
trabalho de QA e preservando apenas as anotações como memória privada.

O frontend e a API usam origens diferentes no desenvolvimento, enquanto uma
instalação futura poderá servi-los sob a mesma origem. A solução deve funcionar
nos dois contextos, sem armazenar senha ou token de sessão em localStorage.

## Goals / Non-Goals

**Goals:**

- autenticar três contas fixas por login e senha;
- persistir uma sessão revogável por sete dias no mesmo perfil de navegador;
- proteger todas as rotas de negócio no servidor;
- permitir logout e alteração segura da própria senha;
- apresentar uma vez o aviso sobre Minha conta;
- manter os dados operacionais compartilhados;
- tornar cada anotação visível e mutável somente pelo proprietário;
- oferecer recuperação operacional de senha pelo servidor local.

**Non-Goals:**

- cadastro, convite, remoção ou administração de usuários pela interface;
- recuperação por email, Telegram ou provedor externo;
- papéis, permissões ou propriedade dos demais registros;
- auditoria de autoria nos dados compartilhados;
- sincronização em nuvem ou autenticação federada;
- confirmação padronizada de todas as mutações, que será outra mudança.

## Decisions

### Contas fixas e inicialização idempotente

`User` terá email canônico único, nome de exibição, hash de senha, estado ativo e
data de ciência do aviso. O setup criará somente as três contas conhecidas quando
ausentes e nunca substituirá uma senha já modificada. O código e a documentação
guardarão apenas hashes iniciais, nunca as senhas fornecidas.

Alternativa considerada: cadastro e administração pela interface. Foi rejeitada
porque amplia autorização, recuperação e governança sem necessidade atual.

### Senhas com scrypt nativo

As senhas serão derivadas com `crypto.scrypt`, salt aleatório por usuário,
parâmetros versionados no próprio hash e comparação em tempo constante. A
validação aceitará de 12 a 128 caracteres. O uso do recurso nativo evita uma
dependência binária adicional no servidor Windows e mantém um algoritmo lento e
memory-hard apropriado para senhas.

Alternativa considerada: hash rápido com SHA-256. Foi rejeitada por não oferecer
proteção adequada contra tentativa offline. Argon2id também é adequado, mas
introduziria uma dependência nativa apenas para esta instalação.

### Sessões opacas e revogáveis

No login, a API gerará 32 bytes aleatórios, enviará o token somente em cookie
HttpOnly e persistirá no modelo `Session` apenas seu SHA-256. A sessão terá
expiração absoluta de sete dias. O cookie usará SameSite Strict, Path `/`,
Max-Age correspondente e Secure quando a aplicação estiver sob HTTPS.

`GET /api/auth/session` restaurará a identidade. Logout removerá a sessão atual.
Alterar a senha excluirá todas as sessões do usuário e emitirá uma nova para o
navegador atual. Sessões vencidas serão rejeitadas e removidas oportunisticamente.

Alternativas consideradas: JWT em localStorage e sessão em memória. A primeira
expõe o token ao JavaScript e dificulta revogação; a segunda perde todos os
logins ao reiniciar o servidor.

### Proteção central da API

Somente health check e endpoints de login terão acesso anônimo. Um middleware
resolverá a sessão antes dos routers existentes e anexará a identidade a
`req.user`. Requisições mutáveis também validarão a origem configurada. O CORS
aceitará credenciais apenas da origem conhecida. Falhas de login usarão mensagem
genérica e um limitador em memória por combinação de origem e email.

### Dados compartilhados com exceção explícita

Autenticação não adicionará `userId` aos projetos ou demais entidades. Todos os
usuários autenticados continuarão usando os mesmos registros. Somente QuickNote
receberá `ownerId` obrigatório e índices iniciados pelo proprietário.

Toda consulta de nota incluirá `ownerId = req.user.id`. Leitura, alteração e
exclusão de um id pertencente a outra pessoa responderão como não encontrado,
evitando revelar a existência da nota.

### Migração destrutiva e deliberada das notas

A migration apagará QuickNote antes de recriar a tabela com `ownerId` obrigatório.
Não haverá tentativa de inferir o autor de registros legados. A decisão foi
aprovada porque o modelo anterior não continha identidade confiável.

### Shell autenticado e Minha conta

O frontend consultará a sessão antes de montar o shell. Sem sessão, mostrará uma
tela de login focada. Com sessão, manterá a identidade em memória React e enviará
cookies por `credentials: include`.

Minha conta será uma rota global abaixo de Configurações e notificações na rail,
com identidade, alteração de senha e logout. Depois do primeiro login, uma modal
informará que a senha pode ser trocada nessa página; ao dispensá-la, a ciência
será persistida no usuário e não voltará em outro dispositivo.

### Recuperação operacional

Um script local permitirá ao operador redefinir a senha de uma conta fixa. A
nova senha será recebida de modo não persistente, validada e derivada com o mesmo
algoritmo; todas as sessões dessa conta serão revogadas.

## Risks / Trade-offs

- [Servidor exposto por HTTP permite interceptação na rede] → manter uso
  estritamente local no desenvolvimento e exigir HTTPS antes da implantação
  compartilhada.
- [Cookie entre portas no desenvolvimento exige configuração correta] → habilitar
  credentials no fetch e no CORS, restringindo a origem conhecida.
- [Migração elimina notas existentes] → decisão explícita, smoke prévio e
  verificação de contagem após a migration.
- [Conta pode ficar bloqueada sem recuperação web] → fornecer script local de
  redefinição e documentar o procedimento.
- [Limitador em memória reinicia com a API] → aceitável para uma única instância
  local; persistência distribuída está fora do escopo.
- [Uma falha no filtro de notas pode expor dados] → concentrar o escopo do
  proprietário em helpers e cobrir cada operação com testes cruzados.

## Migration Plan

1. Criar migration com User, Session e reconstrução destrutiva de QuickNote.
2. Atualizar Prisma Client, setup idempotente e verificações de integridade.
3. Inicializar as três contas somente se ausentes.
4. Adicionar autenticação e proteger a API.
5. Adaptar QuickNote e seus testes para a identidade autenticada.
6. Adaptar o cliente HTTP, login, shell, Minha conta e aviso.
7. Executar migrations, smoke tests, build e validação visual.

Rollback exige restaurar o banco anterior a partir de backup; as notas removidas
não podem ser reconstruídas. O código pode voltar à versão anterior depois de
restaurar o schema compatível.

## Open Questions

Nenhuma decisão funcional permanece aberta para esta mudança.
