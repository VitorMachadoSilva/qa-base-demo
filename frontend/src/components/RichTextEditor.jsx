import {
  Bold,
  Eraser,
  Highlighter,
  List,
  ListOrdered
} from 'lucide-react';
import { useEffect, useRef } from 'react';

const allowedTags = new Set([
  'B',
  'BR',
  'DIV',
  'EM',
  'I',
  'LI',
  'MARK',
  'OL',
  'P',
  'SPAN',
  'STRONG',
  'U',
  'UL'
]);

function plainTextToHtml(value) {
  const holder = document.createElement('div');
  holder.textContent = value || '';
  return holder.innerHTML.replace(/\r?\n/g, '<br>');
}

export function sanitizeRichText(value) {
  if (!value) return '';
  const source = /<\/?[a-z][\s\S]*>/i.test(value)
    ? value
    : plainTextToHtml(value);
  const parsed = new DOMParser().parseFromString(`<div>${source}</div>`, 'text/html');
  const root = parsed.body.firstElementChild;

  function clean(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || '');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    if (!allowedTags.has(node.tagName)) {
      const fragment = document.createDocumentFragment();
      [...node.childNodes].forEach((child) => {
        const cleaned = clean(child);
        if (cleaned) fragment.appendChild(cleaned);
      });
      return fragment;
    }

    const element = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === 'SPAN') {
      const background = node.style.backgroundColor;
      if (
        background === 'rgb(255, 242, 168)' ||
        background === 'rgb(255, 243, 163)'
      ) {
        element.style.backgroundColor = background;
      }
    }
    [...node.childNodes].forEach((child) => {
      const cleaned = clean(child);
      if (cleaned) element.appendChild(cleaned);
    });
    return element;
  }

  const output = document.createElement('div');
  [...root.childNodes].forEach((child) => {
    const cleaned = clean(child);
    if (cleaned) output.appendChild(cleaned);
  });
  return output.innerHTML;
}

export function richTextToPlainText(value) {
  if (!value) return '';
  const holder = document.createElement('div');
  holder.innerHTML = sanitizeRichText(value);
  return holder.textContent?.trim() || '';
}

export function RichTextEditor({
  ariaLabel,
  className = '',
  fieldClassName = '',
  label,
  minHeight = 96,
  onChange,
  placeholder,
  value
}) {
  const editorRef = useRef(null);
  const lastEmittedRef = useRef(value || '');

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    const sanitized = sanitizeRichText(value || '');
    if (editor.innerHTML !== sanitized) editor.innerHTML = sanitized;
    lastEmittedRef.current = value || '';
  }, [value]);

  function emitChange() {
    const sanitized = sanitizeRichText(editorRef.current?.innerHTML || '');
    lastEmittedRef.current = sanitized;
    onChange(sanitized);
  }

  function runCommand(command, commandValue = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  const editor = (
    <div className={`rich-text-editor ${className}`}>
      <div className="rich-text-toolbar" aria-label="Formatação de texto">
        <ToolbarButton
          icon={Bold}
          label="Negrito"
          onClick={() => runCommand('bold')}
        />
        <ToolbarButton
          icon={Highlighter}
          label="Marca-texto"
          onClick={() => runCommand('hiliteColor', '#fff2a8')}
        />
        <ToolbarButton
          icon={List}
          label="Lista com marcadores"
          onClick={() => runCommand('insertUnorderedList')}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Lista numerada"
          onClick={() => runCommand('insertOrderedList')}
        />
        <ToolbarButton
          icon={Eraser}
          label="Limpar formatação"
          onClick={() => runCommand('removeFormat')}
        />
      </div>
      <div
        aria-label={ariaLabel || label}
        aria-multiline="true"
        className="rich-text-input"
        contentEditable
        data-placeholder={placeholder}
        ref={editorRef}
        role="textbox"
        style={{ minHeight }}
        suppressContentEditableWarning
        onBlur={() => {
          const sanitized = sanitizeRichText(editorRef.current?.innerHTML || '');
          if (editorRef.current) editorRef.current.innerHTML = sanitized;
          if (sanitized !== lastEmittedRef.current) onChange(sanitized);
        }}
        onInput={emitChange}
      />
    </div>
  );

  return label ? (
    <label className={`field rich-text-field ${fieldClassName}`}>
      {label}
      {editor}
    </label>
  ) : (
    editor
  );
}

function ToolbarButton({ icon: Icon, label, onClick }) {
  return (
    <button
      aria-label={label}
      className="rich-text-tool"
      type="button"
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Icon size={15} />
    </button>
  );
}

export function FormattedText({ className = '', value }) {
  return (
    <div
      className={`formatted-text ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(value || '') }}
    />
  );
}
