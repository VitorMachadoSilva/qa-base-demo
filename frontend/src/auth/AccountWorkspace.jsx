import {
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { useState } from 'react';
import { api } from '../services/api.js';

const emptyForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

function PasswordField({ label, name, value, visible, onChange, onToggle }) {
  const fieldId = `account-${name}`;

  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <span className="password-control">
        <input
          autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
          id={fieldId}
          minLength={name === 'currentPassword' ? undefined : 12}
          required
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
        />
        <button
          className="plain-icon password-toggle"
          type="button"
          title={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-label={
            visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`
          }
          onClick={() => onToggle(name)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </div>
  );
}

export function AccountWorkspace({
  user,
  onLogout,
  onNotify,
  onUserChange,
  required = false
}) {
  const [form, setForm] = useState(emptyForm);
  const [visible, setVisible] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      onNotify('A confirmação não corresponde à nova senha.', true);
      return;
    }

    setIsSaving(true);

    try {
      const result = await api.changePassword(form);
      setForm(emptyForm);
      setVisible({});
      onUserChange(result.user);
      onNotify(result.message);
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="account-workspace">
      {required && (
        <div className="account-required-notice" role="status">
          <KeyRound size={18} />
          <div>
            <strong>Primeiro acesso</strong>
            <span>
              Substitua a senha temporária para liberar seu ambiente de demonstração.
            </span>
          </div>
        </div>
      )}
      <header className="account-command">
        <div className="account-avatar" aria-hidden="true">
          {user.name
            .split(' ')
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()}
        </div>
        <div>
          <span className="eyebrow">Conta de demonstração</span>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <button className="ghost-button account-logout" type="button" onClick={onLogout}>
          <LogOut size={17} />
          Sair
        </button>
      </header>

      <div className="account-security-layout">
        <section className="account-security-copy" aria-labelledby="security-title">
          <ShieldCheck size={24} aria-hidden="true" />
          <span className="eyebrow">Segurança</span>
          <h3 id="security-title">Alterar senha</h3>
          <p>
            A nova senha encerra suas outras sessões e mantém este navegador conectado.
          </p>
          <div className="account-identity-line">
            <UserRound size={16} />
            <span>Somente você pode alterar esta conta.</span>
          </div>
        </section>

        <form className="account-password-form" onSubmit={handleSubmit}>
          <PasswordField
            label="Senha atual"
            name="currentPassword"
            value={form.currentPassword}
            visible={Boolean(visible.currentPassword)}
            onChange={updateField}
            onToggle={(name) =>
              setVisible((current) => ({ ...current, [name]: !current[name] }))
            }
          />
          <PasswordField
            label="Nova senha"
            name="newPassword"
            value={form.newPassword}
            visible={Boolean(visible.newPassword)}
            onChange={updateField}
            onToggle={(name) =>
              setVisible((current) => ({ ...current, [name]: !current[name] }))
            }
          />
          <PasswordField
            label="Confirmar nova senha"
            name="confirmPassword"
            value={form.confirmPassword}
            visible={Boolean(visible.confirmPassword)}
            onChange={updateField}
            onToggle={(name) =>
              setVisible((current) => ({ ...current, [name]: !current[name] }))
            }
          />

          <div className="account-password-hint">
            Use entre 12 e 128 caracteres.
          </div>

          <button
            className="primary-button account-password-submit"
            disabled={isSaving}
            type="submit"
          >
            <KeyRound size={17} />
            {isSaving ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </section>
  );
}
