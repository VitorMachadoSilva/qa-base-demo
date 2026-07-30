## Why

O QA Manager possui uma linguagem visual própria, mas hoje opera apenas em modo
claro. Um tema escuro cuidadosamente calibrado reduz desconforto em sessões
longas e ambientes com pouca luz, enquanto uma preferência persistente evita
que o usuário precise reajustar a interface a cada acesso.

## What Changes

- Adicionar temas claro e escuro próprios do `Quality Instrument`, ambos
  construídos sobre os mesmos tokens semânticos.
- Disponibilizar um controle compacto e acessível no shell para alternar o tema
  sem interromper o trabalho atual.
- Usar a preferência de cor do sistema no primeiro acesso e persistir escolhas
  posteriores somente no navegador local.
- Aplicar o tema antes da montagem da aplicação para evitar uma mudança visual
  perceptível durante o carregamento.
- Recalibrar superfícies, bordas, foco, overlays e estados de resultado para
  manter contraste e hierarquia nos dois modos.
- Manter fora do escopo temas personalizados por projeto, sincronização em
  nuvem, seleção de paletas e configurações de conta.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `quality-instrument-interface`: passa a exigir temas claro e escuro,
  preferência inicial baseada no sistema, alternância acessível e persistência
  local sem perda de contexto.

## Impact

- Tokens e estilos compartilhados do frontend.
- Shell global e novo controle de tema.
- Inicialização do documento antes da montagem React.
- Testes de build, persistência, contraste visual e responsividade.
- Nenhuma alteração em API, banco de dados ou dependências de produção.
