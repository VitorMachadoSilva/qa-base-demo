import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn
} from 'lucide-react';
import { useState } from 'react';
import { ThemeSwitcher } from '../components/ThemeSwitcher.jsx';
import { api } from '../services/api.js';

export function LoginPage({ onAuthenticated }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await api.login(form);
      onAuthenticated(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-theme">
        <ThemeSwitcher />
      </div>

      <section className="login-workbench" aria-labelledby="login-title">
        <header className="login-brand">
          <span className="login-brand-mark">QB</span>
          <div>
            <span className="eyebrow">Quality workspace</span>
            <strong>QaBase</strong>
          </div>
        </header>

        <div className="login-heading">
          <LockKeyhole size={22} aria-hidden="true" />
          <div>
            <h1 id="login-title">Acessar o QaBase</h1>
            <p>Use uma das contas de demonstração fornecidas para continuar.</p>
          </div>
        </div>

        <form autoComplete="off" className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            Login
            <input
              autoComplete="off"
              autoFocus
              inputMode="email"
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </label>

          <div className="field">
            <label htmlFor="login-password">Senha</label>
            <span className="password-control">
              <input
                autoComplete="new-password"
                id="login-password"
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value
                  }))
                }
              />
              <button
                className="plain-icon password-toggle"
                type="button"
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </div>

          <div className="login-message" aria-live="polite">
            {error && <span role="alert">{error}</span>}
          </div>

          <button
            className="primary-button login-submit"
            disabled={isSubmitting}
            type="submit"
          >
            <LogIn size={17} />
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}

export function SessionLoading() {
  return (
    <main className="auth-screen auth-loading" aria-busy="true">
      <div className="login-brand">
        <span className="login-brand-mark">QB</span>
        <div>
          <span className="eyebrow">Quality workspace</span>
          <strong>QaBase</strong>
        </div>
      </div>
      <span>Restaurando sessão...</span>
    </main>
  );
}
