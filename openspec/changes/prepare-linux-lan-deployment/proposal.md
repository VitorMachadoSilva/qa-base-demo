## Why

O QaBase deixará de ser usado somente no computador de desenvolvimento e passará
a operar continuamente em um computador Linux acessível por outros dispositivos
da mesma rede. A execução atual depende de dois servidores de desenvolvimento,
portas separadas e inicializadores do Windows, o que aumenta o risco de versões
divergentes, origem HTTP bloqueada, perda do banco e indisponibilidade após uma
reinicialização.

## What Changes

- Adiciona uma distribuição Linux reproduzível com Docker Compose.
- Compila o frontend e o serve pelo mesmo processo e endereço da API.
- Expõe somente uma porta configurável para a rede local.
- Mantém o SQLite, seus arquivos auxiliares e os backups em volumes persistentes.
- Configura SQLite para o pequeno volume de acessos simultâneos esperado pelo
  QaBase, com WAL, espera por bloqueio e integridade referencial.
- Adiciona health check, reinicialização automática e encerramento gracioso.
- Adiciona configuração de produção sem segredos versionados.
- Adiciona backup consistente da instância e documentação de implantação,
  atualização, restauração e diagnóstico.
- Preserva o fluxo de desenvolvimento atual no Windows.

## Capabilities

### New Capabilities

- `linux-lan-deployment`: distribuição, persistência e operação do QaBase como
  serviço Linux acessível na rede local.

### Modified Capabilities

Nenhuma capacidade funcional de gestão de qualidade será alterada.

## Impact

A mudança afeta a inicialização do backend, a entrega estática do frontend,
validação de origem das mutações, configuração SQLite, scripts operacionais,
artefatos Docker e documentação. Não altera o schema funcional nem migra dados
automaticamente de outra instância.
