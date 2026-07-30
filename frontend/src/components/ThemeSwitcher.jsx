import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

const storageKey = 'qabase-theme';
const themes = [
  { id: 'light', label: 'Usar modo claro', icon: Sun },
  { id: 'dark', label: 'Usar modo escuro', icon: Moon }
];

function readCurrentTheme() {
  const documentTheme = document.documentElement.dataset.theme;

  if (documentTheme === 'light' || documentTheme === 'dark') {
    return documentTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState(readCurrentTheme);

  function selectTheme(nextTheme) {
    if (nextTheme === theme) {
      return;
    }

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;

    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch {
      // The visual preference still applies for the current session.
    }

    setTheme(nextTheme);
  }

  return (
    <div className="theme-switcher" role="group" aria-label="Tema da interface">
      {themes.map(({ icon: Icon, id, label }) => (
        <button
          className={theme === id ? 'active' : ''}
          key={id}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={theme === id}
          onClick={() => selectTheme(id)}
        >
          <Icon size={15} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
