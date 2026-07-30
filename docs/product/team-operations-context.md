# QaBase: contexto de operações da equipe

## Status

Contexto funcional aprovado para orientar propostas OpenSpec futuras. Este
documento não representa funcionalidades já implementadas.

## Objetivo da evolução

Expandir o QaBase de uma ferramenta local de gestão de testes para um centro
operacional de qualidade que também acompanhe demandas de produção recebidas
pelo suporte, acessos temporários de terceiros e notificações da equipe.

As áreas operacionais devem permanecer separadas do repositório de casos, mas
podem criar vínculos com projetos, fichas de validação, planos, execuções e
milestones.

## Produtos usados como referência de domínio

Os softwares testados possuem características semelhantes ao Intelbras SIM
Next e SIM Play. Os cenários combinam funcionalidades como:

- conexão e reconexão de dispositivos;
- vídeo ao vivo e reprodução;
- alarmes e eventos;
- gravação local;
- contas e permissões;
- áudio;
- inteligências de vídeo;
- diferentes condições de rede, stream, sistema operacional e firmware.

O QaBase continuará genérico. Essas características serão representadas por
componentes, tags e dimensões configuráveis, sem campos exclusivos para
softwares de monitoramento.

## Cenários que combinam funcionalidades

### Regra de separação

- Um caso representa um objetivo verificável quando suas etapas não fazem
  sentido isoladamente.
- Funcionalidades com resultados independentes devem ser casos separados.
- Casos que dependem de uma sequência compartilhada devem ser combinados em um
  plano ou fluxo, preservando o resultado individual de cada caso.

### Evolução recomendada para planos

O plano deverá suportar:

- seções ou blocos de fluxo;
- casos ordenados dentro de cada seção;
- dependências entre casos;
- instruções de transição;
- resultado individual por caso durante a execução;
- snapshot da estrutura usada na execução.

Casos poderão ser associados a múltiplos componentes sem perder sua suíte
principal.

## Demandas de produção

AD e MF representam problemas encontrados por usuários em produção, sem solução
disponível no primeiro nível de suporte. Cada demanda pertence a exatamente um
projeto.

### Dados comuns

- tipo: AD ou MF;
- código e link de origem;
- projeto;
- título e descrição;
- contato do suporte;
- um responsável de QA;
- estado do processo;
- data de registro;
- observações e histórico;
- vínculo opcional com ficha de validação, execução e milestone;
- data e motivo de encerramento.

O contato do suporte é apenas uma referência para comunicação externa. Ele não
é um usuário autenticado do QaBase.

### MF: Mal Funcionamento

- É registrado formalmente pelo suporte nível 2.
- O SLA começa na data desse registro.
- O prazo para uma solução paliativa é de 20 dias corridos.
- O MF encerra quando a solução paliativa é entregue.
- Um MF pode originar ou ser vinculado a uma AD para acompanhar a correção
  definitiva.

### AD: Análise de Defeito

- Possui criticidade baixa, média ou alta.
- Registra a quantidade de usuários afetados, sem armazenar cada ocorrência.
- A criticidade considera impacto e quantidade afetada.
- Encerra somente quando a versão com a correção chega à produção.
- Pode ser vinculada ao milestone ou à versão que contém a solução.

## Acessos temporários de terceiros

Os sistemas iniciais são:

- Microsoft Teams;
- GitLab;
- VPN;
- Jira;
- Confluence.

Um terceiro pode possuir vários acessos com aprovações e expirações
independentes.

Cada acesso deverá registrar:

- terceiro, empresa e função;
- sistema e perfil concedido;
- responsável interno;
- chamado de criação ou renovação;
- data de aprovação;
- data de expiração;
- estado;
- histórico de criação, renovação, revogação e expiração.

A validade começa na aprovação do chamado. O padrão inicial é de três
meses-calendário, por exemplo, de 27/07/2026 a 27/10/2026. O período será
configurável.

O QaBase não armazenará senhas, tokens, IPs ou credenciais dos sistemas
controlados.

## Notificações pelo Telegram

O primeiro canal externo será um bot do Telegram publicando em um grupo privado.
O bot será somente emissor e manterá o modo de privacidade ativado.

### Configurações

- ativação do canal;
- token do bot armazenado somente no servidor;
- identificador do grupo;
- envio de mensagem de teste;
- fuso e horário de processamento;
- frequência do relatório de AD e MF;
- antecedências para acessos;
- tipos de evento habilitados;
- histórico e estado das entregas.

### Regras

- AD e MF serão enviados como relatório consolidado em frequência configurável.
- Acessos terão antecedências configuráveis; 7 e 2 dias são os valores
  inicialmente sugeridos.
- Os avisos serão enviados para um grupo fixo, não para destinatários calculados
  por demanda.
- Mensagens sem prazo serão apresentadas em seção própria.

### Segurança e privacidade

As mensagens devem conter apenas informações operacionais mínimas:

- identificador;
- projeto;
- criticidade ou estado;
- prazo;
- quantidade afetada;
- responsável;
- link interno do QaBase quando disponível.

Não devem ser enviados dados de clientes, credenciais, IPs, números de série,
logs ou detalhes técnicos sensíveis.

### Confiabilidade

O QaBase deverá manter uma fila de notificações com:

- chave de idempotência para impedir duplicidade;
- número de tentativas;
- data da próxima tentativa;
- resultado e erro da entrega;
- data de envio;
- histórico consultável.

O domínio interno usará uma abstração de canal para permitir futuras
integrações sem acoplar as regras de negócio ao Telegram.

## Configurações globais

Uma página global de configurações deverá reunir:

- prazos e SLA;
- validade dos acessos;
- frequência e antecedência dos avisos;
- horário e fuso;
- canal do Telegram;
- catálogo de sistemas;
- teste e histórico de notificações;
- parâmetros de segurança.

## Uso compartilhado futuro

O destino esperado é hospedar o QaBase em um Desktop Servidor para acesso
simultâneo da equipe.

Evoluções futuras previstas:

- banco adequado para concorrência e backups centralizados;
- login individual;
- sessões seguras;
- perfis de acesso;
- auditoria por usuário;
- vínculo entre responsável de QA e usuário autenticado.

Contatos do suporte e terceiros continuarão separados das contas que acessam o
QaBase.

## Sequência recomendada de mudanças

1. Evoluir planos para cenários compostos.
2. Adicionar gestão de AD e MF.
3. Adicionar gestão de acessos de terceiros.
4. Adicionar configurações e notificações pelo Telegram.
5. Preparar implantação compartilhada, autenticação e auditoria.

Cada etapa deverá possuir proposta, design, especificação, tarefas e validação
OpenSpec próprios.
