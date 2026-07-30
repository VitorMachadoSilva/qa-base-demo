## Context

O frontend já centraliza cor, espaçamento e estados em tokens CSS do
`Quality Instrument`. O tema claro está implícito em `:root`, enquanto alguns
overlays e superfícies translúcidas ainda usam cores literais. O shell é o ponto
estável em todas as áreas e, portanto, o local adequado para uma preferência
visual global.

A aplicação é local, sem autenticação e sem backend de preferências. O tema
precisa funcionar antes da montagem React, permanecer estável durante navegação
e recarregamento e não alterar o significado dos estados de execução.

## Goals / Non-Goals

**Goals:**

- oferecer modos claro e escuro com identidade visual própria e contraste
  consistente;
- alternar o modo a partir de qualquer workspace sem perder contexto;
- adotar `prefers-color-scheme` quando não existir escolha persistida;
- persistir a escolha em `localStorage`;
- evitar flash do tema incorreto no carregamento;
- preservar o mesmo conjunto de tokens e componentes nos dois modos.

**Non-Goals:**

- editor de paleta ou escolha de cor de destaque;
- tema por projeto;
- sincronização entre dispositivos;
- preferência salva no banco;
- alteração de layout, densidade ou tipografia.

## Decisions

### Tema explícito no elemento raiz

O documento usará `data-theme="light|dark"` no elemento `html`. Os tokens do
modo claro permanecem como base e os do modo escuro são sobrescritos por
`html[data-theme="dark"]`.

Essa abordagem mantém os componentes sem conhecimento do tema e evita classes
específicas espalhadas pela interface. Uma inversão por filtro foi descartada
porque distorce cores semânticas, foco e legibilidade.

### Inicialização anterior ao React

Um script pequeno no `head` lê a chave `qa-manager-theme`. Na ausência de valor
válido, resolve o primeiro tema com `prefers-color-scheme`. Atribuir o atributo
antes do carregamento do bundle evita exibir o tema claro durante a abertura do
modo escuro.

### Alternância binária persistente

O shell terá um botão de ícone com nome acessível que alterna entre claro e
escuro. A primeira visita segue o sistema; depois da ação explícita, o valor é
persistido localmente.

Um menu com três opções foi considerado, mas adicionaria uma decisão recorrente
e uma superfície de interação desnecessária para o escopo pessoal atual.

### Paletas semânticas independentes

O modo escuro será calibrado como `graphite bench`: canvas quase preto neutro,
superfícies com pequena progressão de luminância, texto sem branco puro, linhas
visíveis e o sinal lima como acento operacional. Cores de Passed, Failed,
Blocked, Skipped e Untested terão pares de primeiro plano e fundo próprios para
o fundo escuro.

Overlays, barra translúcida, foco e sombras passam a usar tokens para não manter
resíduos específicos do modo claro.

## Risks / Trade-offs

- [Preferência local indisponível ou corrompida] -> validar valores, capturar
  falhas de armazenamento e voltar à preferência do sistema.
- [Contraste insuficiente em estados semânticos] -> validar telas reais, foco,
  tabelas, formulários e execução nos dois modos.
- [Flash visual antes da montagem] -> aplicar o atributo no `head` com script
  síncrono mínimo.
- [Novas cores literais ignoram o tema] -> substituir as cores estruturais
  existentes por tokens e documentar o uso semântico.

## Migration Plan

1. Introduzir tokens de infraestrutura e a paleta escura sem alterar o tema
   claro atual.
2. Aplicar o tema inicial no documento antes do bundle.
3. Adicionar o controle ao shell e persistência local.
4. Validar build, navegação, recarregamento e viewports representativos.

O rollback remove o controle, o script inicial e as sobrescritas
`data-theme`; nenhum dado de domínio ou migration de banco é afetado.

## Open Questions

Nenhuma para esta entrega.
