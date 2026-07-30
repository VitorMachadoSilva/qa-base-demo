## Context

O frontend atual é uma aplicação React pequena, sem roteador ou biblioteca de
componentes. `App.jsx` controla a navegação por hash; `TestRepository.jsx`,
`PlanningWorkspace.jsx` e `TestRuns.jsx` concentram fluxos extensos; e
`styles.css` reúne todos os estilos em um único arquivo.

A interface é funcional e responsiva, mas deriva sua hierarquia principalmente
de cards brancos, bordas cinza e botões azuis. Isso faz telas distintas parecerem
variações do mesmo dashboard e não cria uma assinatura ligada ao trabalho de
QA. O redesign precisa preservar todos os fluxos e dados já validados, continuar
local-first e evitar uma reescrita estrutural desnecessária.

`DESIGN_SYSTEM.md` registra a direção permanente `Quality Instrument`.

## Goals / Non-Goals

**Goals:**

- Criar uma identidade reconhecível de instrumento de inspeção.
- Melhorar hierarquia, densidade e leitura comparativa.
- Padronizar shell, tokens e componentes recorrentes.
- Tornar Repositório, Histórico e Execução telas de estresse do sistema.
- Preservar contexto durante inspeção e edição.
- Criar composições próprias para desktop, tablet e mobile.
- Atingir navegação por teclado, foco visível, contraste AA e zoom de 200%.
- Migrar incrementalmente sem alterar contratos de domínio.

**Non-Goals:**

- Alterar API, Prisma, SQLite ou regras de negócio.
- Introduzir dark mode ou editor de temas.
- Criar identidade de marca definitiva ou novo logotipo.
- Adicionar gráficos, command palette ou novos recursos funcionais.
- Trocar React, adicionar um framework visual completo ou adotar CSS-in-JS.
- Reescrever todas as telas antes de validar os componentes centrais.

## Decisions

### Tokens semânticos substituem cores e dimensões literais

Tokens CSS serão organizados por função, não por cor:

```text
foundation -> semantic -> component
```

`--color-surface`, `--color-text-muted` e `--color-result-failed` serão
preferidos a nomes como `--gray-100` ou `--red-500`. Espaçamento, tipografia,
raio, elevação, movimento e dimensões do shell também serão tokens.

Alternativa considerada: ajustar diretamente o `styles.css`. Foi descartada
porque manteria dezenas de valores repetidos e impediria validar consistência.

### CSS permanece nativo e é dividido por responsabilidade

O frontend continuará com CSS nativo importado por `main.jsx`. A folha única será
separada gradualmente:

```text
frontend/src/styles/
  tokens.css
  base.css
  components.css
  workspaces.css
  responsive.css
```

Alternativa considerada: Tailwind, CSS Modules ou styled-components. Nenhuma
delas resolve um problema atual que justifique dependência e migração extras.

### Tipografia técnica é empacotada localmente

IBM Plex Sans e IBM Plex Mono serão incluídas no bundle por pacote com versão
fixada ou arquivos locais licenciados. A aplicação não dependerá de Google Fonts
ou outra rede em runtime. Fontes de sistema permanecem como fallback.

Alternativa considerada: manter Inter/system-ui. É legível, mas reforça a
aparência genérica que a mudança pretende superar.

### Shell usa rail global e contexto progressivo

Desktop terá rail global de 60 px, navegação contextual recolhível e barra de
localização de 48 px. O projeto ativo e a seção atual permanecem identificáveis.
A navegação por hash será preservada nesta entrega.

No mobile, destinos do projeto migram para uma barra inferior; seleção de
projeto e ações menos frequentes ficam em uma área adicional.

Alternativa considerada: manter a sidebar de 248 px e apenas mudar cores. Isso
não melhora o uso do espaço nem separa navegação global de contexto do projeto.

### Superfícies contínuas substituem cards repetidos

Coleções usam `DataLedger`: toolbar, cabeçalho e linhas em uma mesma superfície.
Cards ficam restritos a objetos repetidos que realmente precisam de moldura.
Seções de página deixam de flutuar como cartões.

Alternativa considerada: redesenhar os cards individualmente. Foi descartada
porque preservaria o problema estrutural.

### Inspector é o padrão para detalhe contextual

Leitura e edição de casos, planos e registros compactos deverão convergir para
um inspector lateral quando a tela de origem precisar permanecer visível.
Confirmações destrutivas continuam em diálogo; formulários extensos usam tela
completa no mobile.

Alternativa considerada: modal para toda edição. Modais interrompem comparação,
escondem a seleção e não escalam bem para formulários extensos.

### Execução recebe composição própria

A tela de execução não reutilizará a composição de listas administrativas.
Fila, caso, contexto e resultado formarão um workspace de foco. O dock de
resultado permanece estável enquanto o usuário avança entre casos.

Alternativa considerada: apenas aplicar novos tokens ao layout atual. Isso não
resolveria a ergonomia da tarefa mais frequente e importante do produto.

### Componentes são extraídos por comportamento comprovado

Serão criados componentes compartilhados para `AppShell`, `CommandBar`,
`OperationalStrip`, `DataLedger`, `StatusMark`, `Inspector` e `Overlay`.
Extrações ocorrerão junto da primeira tela real que usa cada padrão, evitando
uma biblioteca abstrata sem evidência.

Alternativa considerada: construir todo o design system isoladamente antes das
telas. Foi descartada porque componentes operacionais precisam ser testados
contra dados e estados reais.

### Rollout segue telas de estresse

Ordem:

1. tokens, base e shell;
2. Repositório;
3. Histórico;
4. Execução;
5. Planejamento;
6. Visão Geral e Projetos;
7. estados, acessibilidade e responsividade globais.

Cada fatia termina com screenshot comparativo e teste dos fluxos existentes.

## Risks / Trade-offs

- [Redesign quebrar fluxos já aprovados] -> Preservar props, chamadas de API e
  estados; executar smoke e fluxo visual após cada tela de estresse.
- [Nova densidade prejudicar legibilidade] -> Oferecer apenas densidade
  confortável nesta entrega e testar zoom de 200%.
- [Signal lime perder contraste] -> Usar somente com texto grafite e validar
  contraste; nunca empregar como texto fino sobre branco.
- [Inspector aumentar complexidade de estado] -> Manter seleção no componente
  proprietário e criar um contrato simples de abertura e fechamento.
- [Refatoração do CSS gerar regressões amplas] -> Migrar seletores por tela e
  remover estilos antigos somente após confirmação visual.
- [Fonte aumentar o bundle] -> Carregar apenas pesos 400, 500 e 600 e os
  subconjuntos necessários.
- [Mobile virar uma versão reduzida demais] -> Validar os fluxos completos de
  criação, edição e execução em 390 x 844, não apenas screenshots estáticos.
- [Identidade ficar temática ou chamativa] -> Limitar a cor `signal` a foco,
  seleção e pequenos marcadores; conteúdo permanece neutro.

## Migration Plan

1. Capturar baseline das telas atuais em desktop e mobile.
2. Adicionar tokens e fontes sem mudar a composição.
3. Criar o novo shell mantendo navegação hash e callbacks existentes.
4. Migrar uma tela de estresse por vez, preservando contratos dos componentes.
5. Remover estilos antigos apenas quando nenhum seletor depender deles.
6. Migrar as telas restantes.
7. Validar build, smoke da API, fluxos E2E, contraste, teclado, zoom e redução de
   movimento.
8. Atualizar documentação e registrar screenshots finais.

Rollback: cada fatia deve permanecer isolada por arquivos e componentes. Se uma
tela falhar, restaurar sua composição anterior sem remover tokens e componentes
já validados pelas outras telas.

## Open Questions

- A navegação contextual deve iniciar expandida ou lembrar a última preferência
  local do usuário? A primeira implementação pode iniciar expandida e medir o
  espaço real antes de persistir preferência.
- A fonte será empacotada por dependência ou como assets locais? A decisão final
  depende do tamanho do bundle e da licença registrada no momento da aplicação.
- Projetos deve continuar como destino global permanente ou migrar para o
  seletor no rail? O stress test do shell deve comparar as duas opções sem
  alterar o fluxo de seleção.
