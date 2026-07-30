import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  CommandBar,
  DataLedger,
  OperationalStrip,
  StatePanel,
  StatusMark
} from './components/QualityPrimitives.jsx';

export function DesignSystemFixture() {
  const [caseCount, setCaseCount] = useState(20);
  const stressCases = Array.from({ length: caseCount }, (_, index) => ({
    id: index + 1,
    title: `Cenário de validação ${String(index + 1).padStart(3, '0')}`
  }));

  return (
    <section className="fixture-workspace">
      <CommandBar
        primary={
          <button className="primary-button" type="button">
            <Plus size={17} />
            Nova evidência
          </button>
        }
      >
        <button className="ghost-button" type="button">
          Ação secundária
        </button>
        <button className="ghost-button" type="button" disabled>
          Indisponível
        </button>
      </CommandBar>

      <OperationalStrip label="Estados de resultado">
        <StatusMark label="Passou" state="passed" />
        <StatusMark label="Falhou" state="failed" />
        <StatusMark label="Bloqueado" state="blocked" />
        <StatusMark label="Ignorado" state="skipped" />
        <StatusMark label="Não testado" state="untested" />
      </OperationalStrip>

      <DataLedger label="Exemplo de coleção">
        <div className="fixture-ledger-head">
          <span>ID</span>
          <span>Registro</span>
          <span>Estado</span>
        </div>
        <div className="fixture-ledger-row">
          <code>TC-1042</code>
          <strong>Confirmar pagamento por Pix</strong>
          <StatusMark label="Passou" state="passed" />
        </div>
      </DataLedger>

      <div className="fixture-state-grid">
        <StatePanel kind="loading" title="Carregando registros" />
        <StatePanel
          title="Nenhum registro"
          description="Crie o primeiro item para iniciar esta coleção."
          action={<button className="ghost-button">Criar item</button>}
        />
        <StatePanel
          kind="error"
          title="Não foi possível carregar"
          description="Os dados atuais continuam preservados."
          action={<button className="ghost-button">Tentar novamente</button>}
        />
        <div className="state-panel state-readonly">
          <strong>Execução concluída</strong>
          <span>Os resultados estão disponíveis somente para leitura.</span>
          <input aria-label="Campo somente leitura" readOnly value="Evidência preservada" />
        </div>
      </div>

      <section className="fixture-scale">
        <CommandBar>
          <strong>Escala do ledger</strong>
          <div className="fixture-scale-options" aria-label="Quantidade de casos">
            {[0, 1, 20, 200].map((count) => (
              <button
                aria-pressed={caseCount === count}
                className={caseCount === count ? 'active' : ''}
                key={count}
                type="button"
                onClick={() => setCaseCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </CommandBar>
        {stressCases.length === 0 ? (
          <StatePanel
            title="Nenhum caso nesta suíte"
            description="A geometria permanece estável mesmo sem registros."
          />
        ) : (
          <DataLedger className="fixture-stress-ledger" label={`${caseCount} casos de teste`}>
            <div className="fixture-stress-head">
              <span>ID</span>
              <span>Caso de teste</span>
              <span>Prioridade</span>
            </div>
            {stressCases.map((testCase) => (
              <div className="fixture-stress-row" key={testCase.id}>
                <code>TC-{testCase.id}</code>
                <strong>{testCase.title}</strong>
                <span className="badge priority-medium">Média</span>
              </div>
            ))}
          </DataLedger>
        )}
      </section>
    </section>
  );
}
