# Backlog e progresso

Atualizado em 28 de julho de 2026.

## Entregas concluídas

- [x] Base React, Express, Prisma e SQLite
- [x] CRUD de projetos
- [x] Suítes hierárquicas e casos com passos estruturados
- [x] Busca, filtros e metadados do repositório
- [x] Runs, execução guiada, resultados e conclusão
- [x] Dashboard e estados vazios
- [x] Snapshots históricos dos casos
- [x] Planos de teste reutilizáveis
- [x] Milestones e progresso agregado
- [x] Ambientes, grupos e opções de configuração
- [x] Runs por plano ou escopo avulso
- [x] Snapshots do contexto de planejamento
- [x] Filtros contextuais no histórico
- [x] Validação de desktop e celular
- [x] Identidade visível QaBase com migração da preferência de tema
- [x] Fichas de validação organizadas por pastas livres
- [x] Critérios, checklist executável, notas e link do card
- [x] Promoção de teste da ficha para caso reutilizável
- [x] Validação responsiva em desktop, tablet e celular
- [x] Catálogo de componentes e associação múltipla por caso
- [x] Planos compostos com seções e ocorrências repetidas
- [x] Dependência anterior e instruções de transição por ocorrência
- [x] Execução guiada por seção com evidência, defeito e executor
- [x] Fila operacional de AD e MF recebidos da produção
- [x] Prazo civil de 20 dias, criticidade e quantidade afetada
- [x] Linha do tempo, notas, vínculos, encerramento e reabertura de demandas
- [x] Validação AD/MF em desktop, tablet, celular e 200 registros
- [x] Gestão global de acessos de terceiros
- [x] Ciclos trimestrais, renovação, encerramento e histórico de acessos
- [x] Filtros, estados de vencimento e anotações de terceiros
- [x] Exclusão permanente protegida para terceiros encerrados
- [x] Validação de terceiros em desktop, tablet, celular e 200 registros
- [x] Anotações rápidas privadas por usuário com pastas automáticas por dia
- [x] Busca global, fixação, sete cores, edição e exclusão de notas
- [x] Validação de notas em desktop, tablet, celular e 200 registros
- [x] Login local com três contas fixas e sessão persistente de sete dias
- [x] Minha conta, alteração de senha, logout e aviso inicial
- [x] Isolamento completo de anotações rápidas entre usuários
- [x] Modais próprios para confirmações, renomeações e exclusões
- [x] Confirmação tipada para exclusão completa de projeto
- [x] Backup portátil, íntegro e restaurável por projeto

## OpenSpec

- [x] Inicializar OpenSpec para Codex
- [x] Pesquisar plataformas de referência em fontes oficiais
- [x] Arquivar `evolve-test-management-core`
- [x] Criar proposta, design, specs e tarefas de `add-test-planning-context`
- [x] Implementar dados, APIs, execução e interface
- [x] Validar `add-test-planning-context` em modo estrito
- [x] Sincronizar specs e arquivar a mudança concluída
- [x] Definir a linguagem visual permanente `Quality Instrument`
- [x] Criar proposta, design, requisitos e tarefas do redesign
- [x] Implementar `establish-quality-instrument-design-system`
- [x] Validar, sincronizar e arquivar o redesign
- [x] Especificar e implementar temas Light instrument e Graphite bench
- [x] Validar alternância, persistência, contraste e responsividade dos temas
- [ ] Sincronizar e arquivar `add-quality-instrument-themes`
- [x] Especificar e implementar `add-validation-brief-workspace`
- [x] Validar `add-validation-brief-workspace` em modo estrito
- [ ] Sincronizar e arquivar `add-validation-brief-workspace`
- [x] Especificar e implementar `evolve-composite-test-plans`
- [x] Validar migração, API, build e interface de planos compostos
- [ ] Sincronizar e arquivar `evolve-composite-test-plans`
- [x] Especificar e implementar `add-production-demand-workspace`
- [x] Validar banco, API, build, responsividade e ciclo de vida AD/MF
- [ ] Revisar, sincronizar e arquivar `add-production-demand-workspace`
- [x] Especificar e implementar `add-third-party-access-management`
- [x] Validar banco, API, build, responsividade e carga de terceiros
- [ ] Revisar, sincronizar e arquivar `add-third-party-access-management`
- [x] Especificar e implementar `add-quick-notes-workspace`
- [x] Validar API, fuso, busca, responsividade, temas e carga de notas
- [x] Revisar, sincronizar e arquivar `add-quick-notes-workspace`

## Próximas mudanças candidatas

- [ ] Backup automático diário e rotativo da instância SQLite completa
- [ ] Importação e exportação CSV
- [ ] Anexos e evidências binárias locais
- [ ] Defeitos vinculados a resultados
- [ ] Comparação e tendências entre runs
- [ ] Atalhos de teclado na execução
- [ ] Integração com resultados automatizados
- [ ] Passos compartilhados e parâmetros reutilizáveis
- [ ] Relatório de rastreabilidade entre fichas, casos e runs
- [x] Concluir conexão e teste real das notificações Telegram

## Centro de notificações concluído

- [x] Modelos, migration, setup e integridade
- [x] Transporte Telegram seguro e descoberta de grupo
- [x] Relatórios AD/MF e acessos de terceiros
- [x] Agendador, catch-up, partes, retries e reenvio
- [x] API e workspace global responsivo
- [x] Smoke dedicado, regressão completa e build
- [x] Carregar token local e reiniciar API
- [x] Confirmar grupo e aprovar teste real
- [x] Registrar evidência final e validar OpenSpec
- [x] Sincronizar specs e arquivar OpenSpec após revisão da entrega
- [x] Criar `add-local-authentication-and-private-notes`
- [x] Implementar autenticação, Minha conta e notas privadas
- [ ] Validar a entrega com o usuário
- [ ] Sincronizar specs e arquivar após aprovação explícita

## Decisões permanentes

- Stack: React, Node/Express, Prisma e SQLite.
- Produto local com autenticação própria e sem provedor externo.
- Dados são compartilhados, exceto Anotações rápidas, que pertencem ao usuário.
- JavaScript no estágio atual.
- Snapshots protegem todo histórico de fontes mutáveis.
- OpenSpec é a fonte de verdade para mudanças funcionais relevantes.
- Benchmark orienta prioridades sem importar complexidade corporativa.
