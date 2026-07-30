## 1. Runtime de produção

- [x] 1.1 Servir o build do frontend pelo Express em produção sem interceptar rotas da API
- [x] 1.2 Aceitar mutações da mesma origem usando o host real da requisição
- [x] 1.3 Configurar host, banco e encerramento gracioso do processo
- [x] 1.4 Aplicar pragmas SQLite adequados ao uso simultâneo da equipe

## 2. Distribuição Linux

- [x] 2.1 Criar Dockerfile multiestágio com dependências reproduzíveis
- [x] 2.2 Criar entrypoint idempotente para preparar o banco e iniciar a API
- [x] 2.3 Criar Compose com uma réplica, porta configurável, volume e health check
- [x] 2.4 Criar exemplo de configuração sem incluir tokens ou senhas reais
- [x] 2.5 Restringir o contexto Docker e impedir inclusão de banco, env e artefatos locais

## 3. Proteção operacional

- [x] 3.1 Criar backup consistente da instância SQLite em execução
- [x] 3.2 Criar comando Linux com nome por data e retenção configurável
- [x] 3.3 Documentar restauração segura e alerta contra remoção do volume

## 4. Documentação

- [x] 4.1 Documentar pré-requisitos, instalação e primeiro acesso pela rede
- [x] 4.2 Documentar IP fixo/reserva DHCP, firewall e limite de exposição local
- [x] 4.3 Documentar atualização, logs, health check, backup e recuperação
- [x] 4.4 Atualizar o README com o caminho recomendado para Linux

## 5. Verificação

- [x] 5.1 Adicionar teste para origem LAN equivalente ao host da requisição
- [ ] 5.2 Verificar configuração Compose e build da imagem quando Docker estiver disponível
- [x] 5.3 Executar setup, health check, proteção da API e entrega da SPA
- [x] 5.4 Executar smoke tests existentes, integridade do banco e build do frontend
- [x] 5.5 Registrar limitações do ambiente e evidências finais
