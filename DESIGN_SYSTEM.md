# Quality Instrument Design System

Status: implementado  
Atualizado em: 27 de julho de 2026

## Visão

O QaBase deve parecer uma ferramenta de inspeção construída para QA, não um
dashboard SaaS genérico. Sua interface combina a precisão de uma bancada
técnica, a rastreabilidade de um livro de registros e a velocidade de um painel
operacional.

O sistema visual recebe o nome **Quality Instrument**.

## Princípios

### 1. O trabalho domina o chrome

Navegação, breadcrumbs e ferramentas de orientação recuam visualmente quando o
usuário chega ao seu destino. O caso, o plano ou o run em uso recebe o maior
contraste.

### 2. Estrutura antes de decoração

Hierarquia nasce de alinhamento, escala, contraste e divisores. Cards flutuantes,
gradientes, sombras e ilustrações não devem compensar uma estrutura fraca.

### 3. Densidade confortável

A interface mostra informação suficiente para comparar e agir sem abrir
detalhes repetidamente. Linhas padrão têm 40 ou 44 px; detalhes de duas linhas
podem usar 56 ou 64 px.

### 4. Cor possui responsabilidade

Cores semânticas descrevem resultado e risco. A cor da marca identifica foco,
seleção e ações, mas não substitui rótulos, ícones ou estrutura.

### 5. QA possui identidade visível

IDs, escopo, build, ambiente, configuração, progresso e evidências são
informações de primeira classe. A interface deve destacar a cadeia:

```text
Projeto -> Plano -> Run -> Caso capturado -> Resultado -> Evidência
```

### 6. Continuidade reduz esforço

Editar, filtrar e inspecionar deve preservar o contexto. Painéis laterais e
divulgação progressiva são preferíveis a navegar para outra página ou abrir
modais para toda ação.

### 7. Rápido no teclado, claro no mouse

Toda ação recorrente deve possuir ordem de foco previsível. Atalhos podem
acelerar a execução, mas nunca serão o único caminho.

## Assinatura visual

### Metáfora

Instrumento de qualidade: grafite estrutural, superfícies frias de trabalho e
uma cor de sinal curta e precisa.

### Geometria

- raio pequeno: 3 px;
- raio padrão: 5 px;
- raio de overlay: 8 px;
- pills apenas para estados compactos;
- bordas de 1 px para estrutura;
- sombras somente em menus, drawers, diálogos e elementos arrastados.

### Tipografia

- interface: IBM Plex Sans;
- IDs, métricas, builds e duração: IBM Plex Mono;
- fallback: `system-ui`, `sans-serif`, `monospace`;
- título de página: 22 px / 28 px, peso 600;
- título de painel: 15 px / 20 px, peso 600;
- corpo: 13 px / 20 px;
- metadado: 11 px / 16 px;
- labels curtos em sentence case;
- letter spacing sempre 0.

### Paleta base

| Token | Valor inicial | Uso |
|---|---|---|
| `canvas` | `#F2F4F3` | Fundo do workspace |
| `surface` | `#FFFFFF` | Superfície de trabalho |
| `surface-subtle` | `#E9ECEA` | Barras e áreas secundárias |
| `graphite` | `#191D1F` | Rail, texto forte e ação primária |
| `graphite-soft` | `#2B3134` | Navegação expandida |
| `text` | `#202528` | Conteúdo |
| `text-muted` | `#687176` | Metadados |
| `line` | `#D5DADD` | Divisores |
| `signal` | `#D7F23A` | Foco, seleção e assinatura |
| `technical` | `#176B87` | Links e navegação contextual |
| `focus` | `#1683FF` | Anel de foco acessível |

`signal` deve aparecer em pequenas áreas e sempre com texto grafite. Não é cor
de fundo dominante.

### Temas

O `Quality Instrument` possui duas expressões da mesma linguagem:

- **Light instrument**: canvas mineral frio, superfícies brancas, grafite
  estrutural e sinal lima;
- **Graphite bench**: canvas quase preto neutro, superfícies carvão em progressão
  curta, texto sem branco puro e o mesmo sinal operacional.

Ambos usam os mesmos tokens semânticos. Componentes não devem consultar o tema
nem declarar cores exclusivas para ele. Superfícies translúcidas, sombras,
scrims, foco e estados também são tokens.

No primeiro acesso, a aplicação acompanha `prefers-color-scheme`. Uma escolha
feita no controle do shell é persistida apenas no navegador local e aplicada no
elemento `html` antes da montagem React para evitar troca perceptível durante o
carregamento.

O seletor usa ícones familiares de sol e lua, nomes acessíveis, estado
`aria-pressed` e foco visível. Tema por projeto, paletas livres e sincronização
de conta não fazem parte do sistema atual.

### Resultados

| Resultado | Cor | Forma adicional |
|---|---|---|
| Passed | verde | check |
| Failed | vermelho | X |
| Blocked | âmbar | pausa ou bloqueio |
| Skipped | violeta | avanço |
| Untested | cinza | círculo vazio |

Resultado nunca depende apenas da cor.

## Camadas

O produto usa apenas quatro níveis:

1. `canvas`: fundo geral;
2. `surface`: trabalho principal;
3. `surface-subtle`: agrupamento e orientação;
4. `overlay`: menu, drawer e diálogo com sombra.

Se um componente precisar de mais camadas, a composição deve ser simplificada.

## Shell

### Desktop

```text
┌──────┬──────────────┬──────────────────────────────────────────────┐
│ rail │ contexto     │ breadcrumb / busca                 executar │
│ 60px │ 220px        ├──────────────────────────────────────────────┤
│      │              │ faixa operacional                           │
│      │              ├──────────────────────────────────────────────┤
│      │              │ canvas de trabalho                          │
│      │              │                                  inspector  │
└──────┴──────────────┴──────────────────────────────────────────────┘
```

- rail global: 60 px, grafite;
- navegação contextual: 220 px, recolhível;
- barra de localização: 48 px;
- faixa operacional opcional: métricas e contexto;
- inspector: 320 a 380 px, opcional e não modal;
- canvas usa toda a largura restante.

### Tablet

- rail permanece com ícones;
- contexto abre como drawer;
- inspector sobrepõe o canvas;
- tabelas mantêm colunas essenciais e escondem detalhes progressivamente.

### Mobile

- navegação inferior com quatro destinos e menu adicional;
- título e ação primária permanecem no topo;
- listas viram linhas chave-valor, não cards empilhados;
- formulários longos usam tela completa;
- resultado da execução fica em um dock inferior;
- filtros abrem em drawer;
- nenhuma página pode gerar overflow horizontal.

## Componentes

### Command bar

Combina título, busca, filtros, densidade e ação principal. Uma tela possui no
máximo uma ação primária visível.

### Operational strip

Faixa compacta para progresso, contagem, contexto e risco. Seus itens são
acionáveis quando levam a um subconjunto dos dados.

### Data ledger

Lista ou tabela contínua, sem contêineres decorativos por linha.

- header e linhas compartilham a mesma densidade;
- primeira coluna identifica o objeto;
- métricas numéricas alinham à direita;
- ações secundárias aparecem no hover e no foco;
- seleção em lote substitui a toolbar por ações de lote;
- detalhes podem abrir no inspector.

### Status mark

Ícone, texto e cor. Pills são permitidas apenas quando o estado precisa ser
comparado rapidamente em uma linha.

### Inspector

Painel lateral para leitura e edição contextual. Deve preservar seleção, filtro
e posição da lista ao fechar.

### Overlay

Menus para opções, drawer para fluxos contextuais e diálogo somente para:

- confirmação destrutiva;
- decisão curta que bloqueia o fluxo;
- criação compacta sem contexto suficiente para inspector.

### Empty state

Explica o estado em uma frase e apresenta uma ação possível. Não usa ilustração
decorativa nem texto promocional.

## Telas de estresse

### Repositório

Deve provar árvore hierárquica, filtros, seleção, densidade, edição no inspector
e ações em lote sem perder contexto.

### Histórico

Deve provar leitura rápida de origem, contexto, progresso, falhas e estado do
run em uma única linha adaptável.

### Execução

É a tela-assinatura do sistema:

```text
[03/18] TC-042 Checkout Pix       [Passou] [Falhou] [Bloqueou]
────────────────────────────────────────────────────────────────
FILA        PASSOS E EVIDÊNCIAS                  CONTEXTO
TC-041      01 Selecionar Pix                    Release 2.0
TC-042  >      QR Code deve aparecer             Homologação
TC-043      02 Confirmar pagamento               Chrome
────────────────────────────────────────────────────────────────
resultado observado                              salvar e próximo
```

- fila, caso e contexto coexistem no desktop;
- dock de resultado permanece acessível;
- foco inicial vai ao caso pendente;
- salvar e avançar não desloca a estrutura;
- estados concluídos ficam visualmente estáveis e somente para leitura.

## Movimento

- feedback local: 100 a 140 ms;
- drawer e mudança de painel: 160 a 220 ms;
- easing discreto, sem bounce;
- não animar métricas, tabelas ou elementos apenas por decoração;
- respeitar `prefers-reduced-motion`.

## Acessibilidade

- contraste WCAG AA;
- foco visível com `focus`;
- alvo mínimo de 36 px no desktop e 44 px no mobile;
- navegação completa por teclado;
- ordem DOM acompanha a ordem visual;
- labels explícitos em inputs;
- tooltips para botões somente com ícone;
- estado comunicado por texto ou ícone além da cor;
- zoom a 200% sem perda de operação.

## Padrões proibidos

- gradientes de marca;
- orbs, blobs e fundos decorativos;
- hero ou copy de marketing dentro do produto;
- cards dentro de cards;
- todas as seções como cards flutuantes;
- títulos exagerados em painéis compactos;
- grandes áreas vazias para parecer premium;
- múltiplos botões primários competindo;
- badges para todo metadado;
- arredondamento em formato cápsula sem função;
- animação sem consequência operacional;
- cor roxa como assinatura genérica de IA;
- esconder ações essenciais apenas no hover.

## Governança

Cada mudança de frontend deve responder:

1. Qual tarefa do usuário recebe maior contraste?
2. O que pode recuar ou desaparecer?
3. A informação pertence à linha, ao inspector ou a um overlay?
4. A tela funciona com 0, 1, 20 e 200 registros?
5. O fluxo funciona em 390 x 844 e em desktop?
6. O estado continua compreensível sem cor?

Novos padrões devem ser documentados aqui antes de se multiplicarem no código.

## Implementação de referência

- tokens: `frontend/src/styles/tokens.css`;
- base e acessibilidade: `frontend/src/styles/base.css`;
- shell e componentes: `frontend/src/styles/components.css`;
- telas operacionais: `frontend/src/styles/workspaces.css`;
- reflow responsivo: `frontend/src/styles/responsive.css`;
- shell: `frontend/src/components/AppShell.jsx`;
- controle de tema: `frontend/src/components/ThemeSwitcher.jsx`;
- componentes operacionais: `frontend/src/components/QualityPrimitives.jsx`;
- fixture de estados e escala: `frontend/src/DesignSystemFixture.jsx`.

As fontes IBM Plex Sans e IBM Plex Mono usam versões fixadas e são empacotadas
no bundle. A rota local `#design-system` é uma superfície técnica isolada para
validar estados e ledgers de 0, 1, 20 e 200 registros.
