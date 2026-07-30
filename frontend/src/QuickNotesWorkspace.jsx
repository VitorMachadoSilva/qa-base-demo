import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Pin,
  PinOff,
  Plus,
  Search,
  StickyNote,
  Trash2,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useConfirmation } from './components/ConfirmationDialog.jsx';
import { Inspector, StatePanel } from './components/QualityPrimitives.jsx';
import {
  FormattedText,
  RichTextEditor,
  richTextToPlainText
} from './components/RichTextEditor.jsx';
import { api } from './services/api.js';

const colors = [
  { id: 'Paper', label: 'Papel' },
  { id: 'Lemon', label: 'Limão' },
  { id: 'Mint', label: 'Menta' },
  { id: 'Sky', label: 'Céu' },
  { id: 'Lilac', label: 'Lilás' },
  { id: 'Rose', label: 'Rosa' },
  { id: 'Coral', label: 'Coral' }
];

const emptyComposer = {
  title: '',
  content: '',
  color: 'Lemon',
  pinned: false
};

function formatDay(day, today) {
  if (!day) return 'Hoje';
  if (day === today) return 'Hoje';

  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  const yesterday = new Date(`${today}T00:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);

  if (day === dateKey(yesterday)) return 'Ontem';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
  }).format(date);
}

function dateKey(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatTime(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function notePayload(note) {
  return {
    title: note.title || null,
    content: note.content,
    color: note.color,
    pinned: note.pinned
  };
}

export function QuickNotesWorkspace({ onNotify }) {
  const { confirmAction } = useConfirmation();
  const [daySummary, setDaySummary] = useState(null);
  const [activeDay, setActiveDay] = useState(null);
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [composer, setComposer] = useState(emptyComposer);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const pinnedNotes = useMemo(
    () => notes.filter((note) => note.pinned),
    [notes]
  );
  const regularNotes = useMemo(
    () => notes.filter((note) => !note.pinned),
    [notes]
  );

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!activeDay || !daySummary) return undefined;
    const timer = window.setTimeout(loadNotes, query ? 220 : 0);
    return () => window.clearTimeout(timer);
  }, [activeDay, query, daySummary?.today]);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') setSelectedNote(null);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  async function execute(action) {
    try {
      return await action();
    } catch (error) {
      onNotify(error.message, true);
      return null;
    }
  }

  async function initialize() {
    setIsLoading(true);
    const summary = await execute(() => api.listQuickNoteDays());
    if (summary) {
      setDaySummary(summary);
      setActiveDay(summary.today);
    }
    setIsLoading(false);
  }

  async function loadNotes() {
    setIsLoading(true);
    const data = await execute(() =>
      api.listQuickNotes(query ? { q: query } : activeDay === 'All' ? {} : { day: activeDay })
    );
    if (data) setNotes(data);
    setIsLoading(false);
  }

  async function refresh(preferredDay = activeDay, searchQuery = query) {
    const summary = await execute(() => api.listQuickNoteDays());
    if (!summary) return;
    setDaySummary(summary);
    if (!searchQuery) setActiveDay(preferredDay || summary.today);
    const data = await execute(() =>
      api.listQuickNotes(
        searchQuery
          ? { q: searchQuery }
          : preferredDay === 'All'
            ? {}
            : { day: preferredDay || summary.today }
      )
    );
    if (data) setNotes(data);
  }

  async function createNote(event) {
    event.preventDefault();
    if (!richTextToPlainText(composer.content)) {
      onNotify('Escreva o conteúdo da anotação.', true);
      return;
    }
    setIsSaving(true);
    const created = await execute(() => api.createQuickNote(notePayload(composer)));
    if (created) {
      setComposer(emptyComposer);
      setQuery('');
      await refresh(created.createdDay, '');
      onNotify('Anotação salva.');
    }
    setIsSaving(false);
  }

  async function togglePin(note) {
    const updated = await execute(() =>
      api.updateQuickNote(note.id, notePayload({ ...note, pinned: !note.pinned }))
    );
    if (updated) {
      await refresh();
      if (selectedNote?.id === note.id) setSelectedNote(updated);
    }
  }

  async function openNote(note) {
    const detail = await execute(() => api.getQuickNote(note.id));
    if (detail) setSelectedNote(detail);
  }

  async function saveNote(form) {
    if (!richTextToPlainText(form.content)) {
      onNotify('A anotação não pode ficar vazia.', true);
      return false;
    }
    const updated = await execute(() =>
      api.updateQuickNote(selectedNote.id, notePayload(form))
    );
    if (!updated) return false;
    setSelectedNote(null);
    await refresh();
    onNotify('Anotação atualizada.');
    return true;
  }

  async function deleteNote(note) {
    const confirmed = await confirmAction({
      title: 'Excluir esta anotação?',
      message: 'A anotação será removida permanentemente e não poderá ser recuperada.',
      confirmLabel: 'Excluir anotação',
      danger: true
    });
    if (!confirmed) return;
    const deleted = await execute(async () => {
      await api.deleteQuickNote(note.id);
      return true;
    });
    if (!deleted) return;
    setSelectedNote(null);
    await refresh();
    onNotify('Anotação excluída.');
  }

  const scopeTitle = query
    ? `Resultados para “${query}”`
    : activeDay === 'All'
      ? 'Todas as anotações'
      : formatDay(activeDay || daySummary?.today, daySummary?.today);

  return (
    <>
      <section className="quick-notes-workspace">
        <header className="quick-notes-command">
          <div>
            <span className="eyebrow">Memória de trabalho</span>
            <h2>Anotações rápidas</h2>
            <p>Capture agora. Organize automaticamente pelo dia.</p>
          </div>
          <label className="search-box quick-notes-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar em todos os dias"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                className="plain-icon"
                type="button"
                title="Limpar busca"
                onClick={() => setQuery('')}
              >
                <X size={15} />
              </button>
            )}
          </label>
        </header>

        <div className="quick-notes-layout">
          <aside className="quick-day-nav" aria-label="Pastas por dia">
            <div className="quick-day-heading">
              <CalendarDays size={17} />
              <span>Pastas por dia</span>
            </div>
            <button
              className={activeDay === 'All' && !query ? 'active' : ''}
              type="button"
              onClick={() => {
                setQuery('');
                setActiveDay('All');
              }}
            >
              <FileText size={16} />
              <span>Todas</span>
              <strong>{daySummary?.total ?? 0}</strong>
            </button>
            {daySummary?.days.map((item) => (
              <button
                className={activeDay === item.day && !query ? 'active' : ''}
                key={item.day}
                type="button"
                onClick={() => {
                  setQuery('');
                  setActiveDay(item.day);
                }}
              >
                <Clock3 size={16} />
                <span>
                  {formatDay(item.day, daySummary.today)}
                  <small>{item.day}</small>
                </span>
                <strong>{item.count}</strong>
              </button>
            ))}
          </aside>

          <main className="quick-notes-main">
            <form className={`quick-composer note-${composer.color.toLowerCase()}`} onSubmit={createNote}>
              <div className="quick-composer-fields">
                <input
                  aria-label="Título da anotação"
                  maxLength={120}
                  placeholder="Título opcional"
                  value={composer.title}
                  onChange={(event) =>
                    setComposer((current) => ({ ...current, title: event.target.value }))
                  }
                />
                <RichTextEditor
                  ariaLabel="Texto da anotação"
                  minHeight={112}
                  placeholder="Escreva uma anotação rápida..."
                  value={composer.content}
                  onChange={(content) =>
                    setComposer((current) => ({ ...current, content }))
                  }
                />
              </div>
              <div className="quick-composer-actions">
                <ColorPicker
                  selected={composer.color}
                  onChange={(color) => setComposer((current) => ({ ...current, color }))}
                />
                <button
                  className={`plain-icon quick-pin-button ${composer.pinned ? 'active' : ''}`}
                  type="button"
                  title={composer.pinned ? 'Desafixar nova nota' : 'Fixar nova nota'}
                  onClick={() =>
                    setComposer((current) => ({ ...current, pinned: !current.pinned }))
                  }
                >
                  <Pin size={16} />
                </button>
                <button className="primary-button" disabled={isSaving} type="submit">
                  <Plus size={17} />
                  {isSaving ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </form>

            <div className="quick-notes-scope">
              <div>
                <span className="eyebrow">{query ? 'Busca global' : 'Pasta ativa'}</span>
                <h3>{scopeTitle}</h3>
              </div>
              <span>{notes.length} {notes.length === 1 ? 'anotação' : 'anotações'}</span>
            </div>

            {isLoading ? (
              <StatePanel kind="loading" title="Carregando anotações" />
            ) : notes.length === 0 ? (
              <StatePanel
                title={query ? 'Nenhuma anotação encontrada' : 'Esta pasta está vazia'}
                description={
                  query
                    ? 'Tente outro termo ou limpe a busca.'
                    : 'A próxima anotação criada hoje aparecerá aqui.'
                }
              />
            ) : (
              <div className="quick-notes-sections">
                {pinnedNotes.length > 0 && (
                  <NoteSection
                    icon={<Pin size={14} />}
                    label="Fixadas"
                    notes={pinnedNotes}
                    onOpen={openNote}
                    onTogglePin={togglePin}
                  />
                )}
                {regularNotes.length > 0 && (
                  <NoteSection
                    label={pinnedNotes.length > 0 ? 'Outras' : null}
                    notes={regularNotes}
                    onOpen={openNote}
                    onTogglePin={togglePin}
                  />
                )}
              </div>
            )}
          </main>
        </div>
      </section>

      {selectedNote && (
        <Inspector
          className={`quick-note-inspector note-${selectedNote.color.toLowerCase()}`}
          modal
          onClose={() => setSelectedNote(null)}
          title="Editar anotação"
        >
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onCancel={() => setSelectedNote(null)}
            onDelete={() => deleteNote(selectedNote)}
            onPreviewColor={(color) =>
              setSelectedNote((current) =>
                current ? { ...current, color } : current
              )
            }
            onSave={saveNote}
          />
        </Inspector>
      )}
    </>
  );
}

function ColorPicker({ onChange, selected }) {
  return (
    <div className="quick-color-picker" aria-label="Cor da anotação">
      {colors.map((color) => (
        <button
          aria-label={color.label}
          aria-pressed={selected === color.id}
          className={`quick-color-swatch swatch-${color.id.toLowerCase()} ${
            selected === color.id ? 'active' : ''
          }`}
          key={color.id}
          type="button"
          title={color.label}
          onClick={() => onChange(color.id)}
        >
          {selected === color.id && <Check size={12} />}
        </button>
      ))}
    </div>
  );
}

function NoteSection({ icon, label, notes, onOpen, onTogglePin }) {
  return (
    <section className="quick-note-section">
      {label && <h4>{icon}{label}</h4>}
      <div className="quick-note-grid">
        {notes.map((note) => (
          <article className={`quick-note-card note-${note.color.toLowerCase()}`} key={note.id}>
            <button
              className="quick-note-open"
              type="button"
              onClick={() => onOpen(note)}
            >
              <span>
                {note.title && <strong>{note.title}</strong>}
                <FormattedText value={note.content} />
              </span>
              <footer>
                <time>{formatTime(note.updatedAt)}</time>
                <ChevronRight size={15} />
              </footer>
            </button>
            <button
              className={`plain-icon quick-card-pin ${note.pinned ? 'active' : ''}`}
              type="button"
              title={note.pinned ? 'Desafixar' : 'Fixar'}
              aria-label={note.pinned ? 'Desafixar anotação' : 'Fixar anotação'}
              onClick={() => onTogglePin(note)}
            >
              {note.pinned ? <PinOff size={15} /> : <Pin size={15} />}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function NoteEditor({
  note,
  onCancel,
  onDelete,
  onPreviewColor,
  onSave
}) {
  const [form, setForm] = useState(notePayload(note));
  const [isSaving, setIsSaving] = useState(false);

  return (
    <form
      className="quick-note-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSaving(true);
        await onSave(form);
        setIsSaving(false);
      }}
    >
      <div className="quick-editor-meta">
        <span>Criada em {formatDay(note.createdDay, dateKey(new Date()))}</span>
        <span>{note.createdDay}</span>
      </div>
      <label className="field">
        Título
        <input
          maxLength={120}
          placeholder="Título opcional"
          value={form.title || ''}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
        />
      </label>
      <RichTextEditor
        label="Anotação"
        minHeight={270}
        value={form.content}
        onChange={(content) =>
          setForm((current) => ({ ...current, content }))
        }
      />
      <div className="quick-editor-options">
        <ColorPicker
          selected={form.color}
          onChange={(color) => {
            setForm((current) => ({ ...current, color }));
            onPreviewColor(color);
          }}
        />
        <label className="quick-pin-toggle">
          <input
            checked={form.pinned}
            type="checkbox"
            onChange={(event) =>
              setForm((current) => ({ ...current, pinned: event.target.checked }))
            }
          />
          <Pin size={15} />
          Fixada
        </label>
      </div>
      <div className="modal-actions quick-editor-actions">
        <button className="ghost-button danger" type="button" onClick={onDelete}>
          <Trash2 size={16} />
          Excluir
        </button>
        <span />
        <button className="ghost-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" disabled={isSaving} type="submit">
          <Check size={16} />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
