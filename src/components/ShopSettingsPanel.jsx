import { useEffect, useState } from 'react';
import { getShopSettings, updateShopSettings, sendEmailTest, getEmailLogs } from '../services/shopSettingsService';
import { useLanguage } from '../context/LanguageContext';

const BOOL_KEYS = [
  'orders_accepting',
  'pos_orders_accepting',
  'email_notify_new_order',
  'email_notify_status_confirmed',
  'email_notify_status_preparing',
  'email_notify_status_ready',
  'email_notify_status_completed',
  'email_notify_status_cancelled',
  'pos_auto_print',
];

export default function ShopSettingsPanel() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [s, l] = await Promise.all([getShopSettings(), getEmailLogs()]);
    setSettings(s);
    setLogs(Array.isArray(l) ? l : []);
  };

  useEffect(() => {
    load().catch((e) => setMsg(e.response?.data?.error || t('error')));
  }, []);

  if (!settings) {
    return <div style={{ fontFamily: "'DM Sans', sans-serif" }}>{t('loading')}</div>;
  }

  const setKey = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const toggle = (key) => {
    const next = String(settings[key]).toLowerCase() === 'true' ? 'false' : 'true';
    setKey(key, next);
  };

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await updateShopSettings(settings);
      setSettings(res.settings);
      setMsg(t('shopSettingsSaved'));
    } catch (e) {
      setMsg(e.response?.data?.error || t('error'));
    } finally {
      setSaving(false);
    }
  };

  const testEmail = async () => {
    try {
      const res = await sendEmailTest(settings.email_notify_to);
      setMsg(res.ok ? t('emailTestOk') : res.error || t('emailTestFail'));
      const l = await getEmailLogs();
      setLogs(Array.isArray(l) ? l : []);
    } catch (e) {
      setMsg(e.response?.data?.error || t('emailTestFail'));
    }
  };

  const field = {
    width: '100%',
    maxWidth: 480,
    padding: '0.75rem 1rem',
    border: '1.5px solid rgba(58,46,37,.2)',
    background: '#F7F5F2',
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: '0.75rem',
  };

  const label = {
    display: 'block',
    marginBottom: '0.35rem',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.85rem',
    color: '#3A2E25',
  };

  const sectionTitle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.5rem',
    color: '#3A2E25',
    margin: '1.5rem 0 0.75rem',
  };

  return (
    <div>
      <h3 style={sectionTitle}>{t('shopOrdersBlockTitle')}</h3>
      <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={String(settings.orders_accepting).toLowerCase() === 'true'}
          onChange={() => toggle('orders_accepting')}
        />
        {t('shopAcceptOrders')}
      </label>
      <label style={label}>{t('shopClosedMessage')}</label>
      <textarea
        style={{ ...field, minHeight: 80 }}
        value={settings.orders_closed_message || ''}
        onChange={(e) => setKey('orders_closed_message', e.target.value)}
      />
      <label style={label}>{t('shopReopenAt')}</label>
      <input
        type="datetime-local"
        style={field}
        value={
          settings.orders_reopen_at
            ? String(settings.orders_reopen_at).slice(0, 16)
            : ''
        }
        onChange={(e) => setKey('orders_reopen_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
      />

      <h3 style={sectionTitle}>{t('shopPosOrdersTitle')}</h3>
      <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={String(settings.pos_orders_accepting).toLowerCase() === 'true'}
          onChange={() => toggle('pos_orders_accepting')}
        />
        {t('shopAcceptPosOrders')}
      </label>

      <h3 style={sectionTitle}>{t('shopEmailTitle')}</h3>
      <label style={label}>{t('shopEmailNotifyTo')}</label>
      <input
        type="email"
        style={field}
        value={settings.email_notify_to || ''}
        onChange={(e) => setKey('email_notify_to', e.target.value)}
      />
      {BOOL_KEYS.filter((k) => k.startsWith('email_')).map((key) => (
        <label key={key} style={{ ...label, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={String(settings[key]).toLowerCase() === 'true'}
            onChange={() => toggle(key)}
          />
          {t(`shop_${key}`) || key}
        </label>
      ))}
      <button
        type="button"
        onClick={testEmail}
        style={{
          marginRight: 8,
          background: 'transparent',
          border: '1px solid rgba(58,46,37,.3)',
          color: '#3A2E25',
          padding: '0.65rem 1rem',
          fontFamily: "'DM Sans', sans-serif",
          cursor: 'pointer',
        }}
      >
        {t('shopEmailTest')}
      </button>

      <h3 style={sectionTitle}>{t('shopPrintTitle')}</h3>
      <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={String(settings.pos_auto_print).toLowerCase() === 'true'}
          onChange={() => toggle('pos_auto_print')}
        />
        {t('shopAutoPrint')}
      </label>
      <label style={label}>{t('shopAutoPrintTrigger')}</label>
      <select
        style={field}
        value={settings.pos_auto_print_trigger || 'paid'}
        onChange={(e) => setKey('pos_auto_print_trigger', e.target.value)}
      >
        <option value="created">{t('shopPrintTriggerCreated')}</option>
        <option value="confirmed">{t('shopPrintTriggerConfirmed')}</option>
        <option value="paid">{t('shopPrintTriggerPaid')}</option>
      </select>
      <label style={label}>{t('shopPrintCopies')}</label>
      <input
        type="number"
        min={1}
        max={5}
        style={field}
        value={settings.pos_auto_print_copies || '1'}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          const clamped = Math.min(5, Math.max(1, Math.round(n)));
          setKey('pos_auto_print_copies', String(clamped));
        }}
      />
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', opacity: 0.65, marginBottom: '0.75rem' }}>
        Les copies sont empilées dans une seule boîte de dialogue d’impression (pas d’impression silencieuse).
      </p>
      <label style={label}>{t('shopTicketWidth')}</label>
      <select
        style={field}
        value={settings.pos_ticket_width_mm || '80'}
        onChange={(e) => setKey('pos_ticket_width_mm', e.target.value)}
      >
        <option value="58">58 mm</option>
        <option value="80">80 mm</option>
      </select>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', opacity: 0.7, maxWidth: 520 }}>
        {t('shopPrintHint')}
      </p>
      <button
        type="button"
        onClick={() => window.print()}
        style={{
          marginBottom: '1rem',
          background: 'transparent',
          border: '1px solid rgba(58,46,37,.3)',
          color: '#3A2E25',
          padding: '0.65rem 1rem',
          fontFamily: "'DM Sans', sans-serif",
          cursor: 'pointer',
        }}
      >
        {t('shopPrintTest')}
      </button>

      <h3 style={sectionTitle}>{t('shopCgvTitle')}</h3>
      <label style={label}>{t('shopCgvVersion')}</label>
      <input
        style={field}
        value={settings.cgv_version || '1.0'}
        onChange={(e) => setKey('cgv_version', e.target.value)}
      />

      <div style={{ marginTop: '1.25rem' }}>
        <button
          type="button"
          disabled={saving}
          onClick={save}
          style={{
            background: '#3A2E25',
            color: '#F7F5F2',
            border: 'none',
            padding: '0.85rem 1.4rem',
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          {saving ? t('posSaving') : t('save')}
        </button>
      </div>
      {msg && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", marginTop: '0.75rem', color: '#3A2E25' }}>{msg}</p>
      )}

      <h3 style={sectionTitle}>{t('shopEmailLogs')}</h3>
      <div style={{ maxHeight: 280, overflow: 'auto', border: '1px solid rgba(58,46,37,.12)' }}>
        {logs.length === 0 && (
          <p style={{ padding: '1rem', fontFamily: "'DM Sans', sans-serif", opacity: 0.6 }}>{t('shopNoEmailLogs')}</p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(58,46,37,.08)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.82rem',
            }}
          >
            <strong>{log.status}</strong> · {log.toEmail} · {log.subject}
            <div style={{ opacity: 0.65 }}>
              {new Date(log.createdAt).toLocaleString()}
              {log.error ? ` — ${log.error}` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
