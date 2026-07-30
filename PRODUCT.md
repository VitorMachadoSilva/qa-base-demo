# QaBase

## Visão do produto

Ferramenta local e gratuita de gestão de testes, inspirada em Qase e TestRail,
adaptável a qualquer aplicação ou software e orientada ao trabalho diário de uma
pessoa de QA.

## Problema

Planilhas e notas soltas dificultam reutilizar cenários, organizar regressões,
registrar onde uma versão foi testada e preservar evidências quando casos mudam.

## Público

Uso pessoal por analistas e engenheiros de QA. O produto não exige login,
permissões, colaboração em equipe ou infraestrutura na nuvem.

## Capacidades atuais

1. Projetos como fronteira de dados.
2. Suítes hierárquicas e casos com passos ordenados.
3. Metadados de prioridade, tipo, severidade e automação.
4. Planos reutilizáveis com seções, escopo ordenado e casos repetíveis.
5. Milestones para sprint, versão ou entrega.
6. Ambientes e configurações de execução.
7. Runs por plano ou seleção avulsa.
8. Resultado por caso: passou, falhou, bloqueado, ignorado ou não testado.
9. Snapshots que preservam o histórico após mudanças nas fontes.
10. Dashboard, progresso e filtros de histórico.
11. Fichas de validação organizadas em pastas definidas pelo usuário.
12. Objetivo, escopo, link HTTP(S) do card, critérios de aceite e notas tipadas.
13. Checklist executável com resultado esperado, observado e estado.
14. Promoção de um teste da ficha para caso reutilizável no repositório.
15. Componentes transversais para classificar e filtrar casos entre suítes.
16. Instruções de transição e uma dependência anterior por ocorrência do plano.
17. Execução guiada por seção, com bloqueio e contexto do pré-requisito.
18. Evidência textual, defeito vinculado e executor independentes por ocorrência.
19. Fila de ADs e MFs recebidos da produção, isolada por projeto.
20. Prazo automático de 20 dias corridos para MF e data opcional para AD.
21. Criticidade e quantidade afetada para priorização de AD.
22. Contato de suporte, responsável de QA, origem e vínculos de qualidade.
23. Linha do tempo de mudanças e anotações com encerramento e reabertura formais.
24. Cadastro global de terceiros, empresa, função, contato e responsável interno.
25. Ciclos de acesso a Teams, GitLab, VPN, Jira e Confluence.
26. Prazo máximo de três meses desde a aprovação, renovação e encerramento com histórico.
27. Fila operacional de acessos ativos, a vencer em sete dias, vencidos e encerrados.
28. Área individual de anotações rápidas, independente de projetos.
29. Pastas automáticas e imutáveis pelo dia de criação.
30. Busca em todos os dias, fixação e sete cores adaptadas aos dois temas.
31. Cartões de leitura rápida com edição completa em painel lateral.
32. Autenticação local com contas fixas e sessão persistente de sete dias.
33. Área Minha conta para alterar a própria senha e encerrar a sessão.
34. Operação local sem conta externa ou sincronização.
35. Diálogos próprios para confirmações, renomeações e ações destrutivas.
36. Verificação pelo nome exato antes da exclusão completa de um projeto.

## Princípios

- local primeiro;
- baixo atrito para uso recorrente;
- histórico confiável;
- isolamento por projeto;
- complexidade proporcional a uma ferramenta pessoal;
- especificações observáveis antes de mudanças relevantes.

## Fora do escopo atual

- cadastro aberto, equipes, papéis e permissões;
- credenciais de ambiente;
- matriz automática de configurações;
- sincronização com Jira, GitHub Issues ou outros rastreadores;
- anexos, importação, exportação e relatórios externos;
- ingestão de resultados automatizados.
- notificações Telegram e políticas configuráveis de lembrete;
- sincronização bidirecional com Jira ou plataformas de suporte.

## Glossário

| Termo | Definição |
|---|---|
| Projeto | Produto ou aplicação que isola repositório, planejamento e histórico |
| Suíte | Agrupamento hierárquico de casos |
| Caso | Cenário com passos, resultados esperados e metadados |
| Componente | Classificação transversal de casos, independente da suíte |
| Plano | Composição reutilizável de seções e ocorrências de casos atuais |
| Ocorrência | Uso específico de um caso em uma posição do plano ou run |
| Dependência | Pré-requisito anterior que orienta a liberação de uma ocorrência |
| Milestone | Sprint, versão ou entrega associada a runs |
| Ambiente | Alvo reutilizável, como local ou homologação |
| Configuração | Opção de uma dimensão, como Chrome em Navegador |
| Run | Execução pontual de um plano ou seleção avulsa |
| Snapshot | Cópia histórica imutável do dado usado no run |
| Ficha de validação | Espaço de trabalho focado em uma card, bug ou melhoria |
| Critério | Condição de aceite marcável dentro da ficha |
| Teste da ficha | Verificação executável que pode virar um caso reutilizável |
| Demanda de produção | Registro operacional de AD ou MF recebido do suporte |
| MF | Mal Funcionamento com paliativa prevista em até 20 dias corridos |
| AD | Análise de Defeito encerrada após disponibilização da correção em produção |
| Contato do suporte | Pessoa de referência para comunicação externa, sem vínculo de usuário |
| Terceiro | Pessoa externa com acessos temporários gerenciados globalmente |
| Ciclo de acesso | Período entre aprovação e vencimento ou encerramento dos acessos |
| Anotação rápida | Registro privado do usuário autenticado, agrupado automaticamente pelo dia em que foi criado |
| Pasta diária | Agrupamento virtual e imutável de anotações com o mesmo dia civil de criação |
| Sessão local | Acesso autenticado persistente por sete dias no mesmo perfil de navegador |
| Centro de notificações | Área global de canal, agendas e histórico operacional |
| Entrega | Um relatório lógico, teste de canal ou reenvio registrado |
| Parte | Fragmento de uma entrega limitado ao tamanho seguro do Telegram |
| Tentativa | Uma chamada ao Telegram com resultado e próximo retry auditáveis |
