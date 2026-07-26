import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Smartphone, Mail } from 'lucide-react';
import { Button } from './ui/Button';

export default function AdminSettings() {
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const [serviceAccount, setServiceAccount] = useState('');
  const [vapidKey, setVapidKey] = useState('');
  const [isFcmSaving, setIsFcmSaving] = useState(false);
  const [fcmMessage, setFcmMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isFcmConfigured, setIsFcmConfigured] = useState(false);
  
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseServiceRoleKey, setSupabaseServiceRoleKey] = useState('');
  const [isSupabaseSaving, setIsSupabaseSaving] = useState(false);
  const [supabaseMessage, setSupabaseMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [isEmailSaving, setIsEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isEmailConfigured, setIsEmailConfigured] = useState(false);

  useEffect(() => {
    fetchTwilioSettings();
    fetchFcmSettings();
    fetchSupabaseSettings();
    fetchEmailSettings();
  }, []);

  const fetchTwilioSettings = async () => {
    try {
      const response = await fetch('/api/settings/twilio');
      if (response.ok) {
        const data = await response.json();
        setAccountSid(data.accountSid || '');
        setPhoneNumber(data.phoneNumber || '');
        setIsConfigured(data.isConfigured);
      }
    } catch (error) {
      console.error('Failed to fetch Twilio settings:', error);
    }
  };

  const fetchFcmSettings = async () => {
    try {
      const response = await fetch('/api/settings/fcm');
      if (response.ok) {
        const data = await response.json();
        setVapidKey(data.vapidKey || '');
        setIsFcmConfigured(data.isConfigured);
      }
    } catch (error) {
      console.error('Failed to fetch FCM settings:', error);
    }
  };

  const fetchSupabaseSettings = async () => {
    try {
      const response = await fetch('/api/settings/supabase');
      if (response.ok) {
        const data = await response.json();
        setSupabaseUrl(data.url || '');
        setSupabaseAnonKey(data.anonKey || '');
        setSupabaseServiceRoleKey(data.serviceRoleKey || '');
        setIsSupabaseConfigured(data.isConfigured);
      }
    } catch (error) {
      console.error('Failed to fetch Supabase settings:', error);
    }
  };

  const fetchEmailSettings = async () => {
    try {
      const response = await fetch('/api/settings/email');
      if (response.ok) {
        const data = await response.json();
        setSmtpHost(data.smtpHost || '');
        setSmtpPort(data.smtpPort || '587');
        setSmtpUser(data.smtpUser || '');
        setEmailFrom(data.emailFrom || '');
        setIsEmailConfigured(data.isConfigured);
      }
    } catch (error) {
      console.error('Failed to fetch Email settings:', error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailSaving(true);
    setEmailMessage(null);

    try {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpHost, smtpPort, smtpUser, smtpPass, emailFrom })
      });

      if (response.ok) {
        setEmailMessage({ type: 'success', text: 'Email SMTP settings saved successfully.' });
        setIsEmailConfigured(true);
        setSmtpPass('');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setEmailMessage({ type: 'error', text: 'Failed to save Email settings. Please try again.' });
    } finally {
      setIsEmailSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/twilio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountSid, authToken, phoneNumber }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Twilio settings saved successfully.' });
        setIsConfigured(true);
        setAuthToken(''); // Clear token from state for security
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save Twilio settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFcmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFcmSaving(true);
    setFcmMessage(null);

    try {
      const response = await fetch('/api/settings/fcm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceAccount, vapidKey }),
      });

      if (response.ok) {
        setFcmMessage({ type: 'success', text: 'FCM settings saved successfully.' });
        setIsFcmConfigured(true);
        setServiceAccount(''); // Clear for security
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setFcmMessage({ type: 'error', text: 'Failed to save FCM settings. Please try again.' });
    } finally {
      setIsFcmSaving(false);
    }
  };

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSupabaseSaving(true);
    setSupabaseMessage(null);

    try {
      const response = await fetch('/api/settings/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: supabaseUrl, 
          anonKey: supabaseAnonKey, 
          serviceRoleKey: supabaseServiceRoleKey 
        }),
      });

      if (response.ok) {
        setSupabaseMessage({ type: 'success', text: 'Supabase settings saved successfully.' });
        setIsSupabaseConfigured(true);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setSupabaseMessage({ type: 'error', text: 'Failed to save Supabase settings. Please try again.' });
    } finally {
      setIsSupabaseSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Platform Settings</h2>
        <p className="text-gray-500 mt-1">Manage external integrations and platform configuration.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900">Firebase Cloud Messaging (FCM)</h3>
            <p className="text-sm text-gray-500">Configure Firebase Admin to send push notifications.</p>
          </div>
          {isFcmConfigured && (
            <div className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <CheckCircle className="w-3 h-3" /> Configured
            </div>
          )}
        </div>

        <form onSubmit={handleFcmSubmit} className="p-8 space-y-6">
          {fcmMessage && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 ${
              fcmMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {fcmMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p className="text-sm font-medium">{fcmMessage.text}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Service Account JSON
              </label>
              <textarea
                required={!isFcmConfigured}
                value={serviceAccount}
                onChange={(e) => setServiceAccount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-mono h-32 resize-y"
                placeholder={isFcmConfigured ? "••••••••••••••••••••••••••••••••\n(Already configured. Paste new JSON to update)" : '{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}'}
              />
              <p className="mt-2 text-xs text-gray-500">
                Generate this in Firebase Console &gt; Project Settings &gt; Service Accounts &gt; Generate new private key.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                VAPID Key (Web Push Certificate)
              </label>
              <input
                type="text"
                value={vapidKey}
                onChange={(e) => setVapidKey(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                placeholder="BXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              />
              <p className="mt-2 text-xs text-gray-500">
                Generate this in Firebase Console &gt; Project Settings &gt; Cloud Messaging &gt; Web configuration &gt; Generate key pair.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isFcmSaving}
              variant="primary"
              className="px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
              notificationMessage="FCM settings saved successfully"
            >
              <Save className="w-4 h-4" />
              {isFcmSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900">Supabase Configuration</h3>
            <p className="text-sm text-gray-500">Connect your platform to Supabase for data storage.</p>
          </div>
          {isSupabaseConfigured && (
            <div className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <CheckCircle className="w-3 h-3" /> Configured
            </div>
          )}
        </div>

        <form onSubmit={handleSupabaseSubmit} className="p-8 space-y-6">
          {supabaseMessage && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 ${
              supabaseMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {supabaseMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p className="text-sm font-medium">{supabaseMessage.text}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Supabase URL
              </label>
              <input
                type="text"
                required
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                placeholder="https://your-project.supabase.co"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Anon Key
              </label>
              <input
                type="password"
                required={!isSupabaseConfigured}
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                placeholder={isSupabaseConfigured ? "••••••••••••••••••••••••••••••••" : "Enter Anon Key"}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Service Role Key (Optional)
              </label>
              <input
                type="password"
                value={supabaseServiceRoleKey}
                onChange={(e) => setSupabaseServiceRoleKey(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                placeholder={isSupabaseConfigured ? "••••••••••••••••••••••••••••••••" : "Enter Service Role Key"}
              />
              <p className="mt-1 text-xs text-gray-400">Used for administrative tasks on the backend.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSupabaseSaving}
              variant="primary"
              className="px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
              notificationMessage="Supabase settings saved successfully"
            >
              <Save className="w-4 h-4" />
              {isSupabaseSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900">Twilio SMS Gateway</h3>
            <p className="text-sm text-gray-500">Configure Twilio to send SMS alerts to users.</p>
          </div>
          {isConfigured && (
            <div className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <CheckCircle className="w-3 h-3" /> Configured
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {message && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Account SID
              </label>
              <input
                type="text"
                required
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Auth Token
              </label>
              <input
                type="password"
                required={!isConfigured}
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                placeholder={isConfigured ? "••••••••••••••••••••••••••••••••" : "Enter Auth Token"}
              />
              {isConfigured && (
                <p className="mt-1 text-xs text-gray-400">Leave blank to keep the existing token.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Twilio Phone Number
              </label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              variant="primary"
              className="px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
              notificationMessage="Settings saved successfully"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900">Email SMTP Alerts Gateway</h3>
            <p className="text-sm text-gray-500">Configure SMTP settings to send price change emails for favorite stations.</p>
          </div>
          {isEmailConfigured && (
            <div className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <CheckCircle className="w-3 h-3" /> Configured
            </div>
          )}
        </div>

        <form onSubmit={handleEmailSubmit} className="p-8 space-y-6">
          {emailMessage && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 ${
              emailMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {emailMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p className="text-sm font-medium">{emailMessage.text}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  placeholder="smtp.gmail.com or mail.domain.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  SMTP Port
                </label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  placeholder="587"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  SMTP Username / Email
                </label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  placeholder="alerts@salonefuelmonitor.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  SMTP Password / App Key
                </label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  placeholder={isEmailConfigured ? "••••••••••••••••••••••••" : "Enter Password"}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Sender Email Address (From)
              </label>
              <input
                type="email"
                value={emailFrom}
                onChange={(e) => setEmailFrom(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                placeholder="notifications@salonefuelmonitor.com"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isEmailSaving}
              variant="primary"
              className="px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
              notificationMessage="Email settings saved successfully"
            >
              <Save className="w-4 h-4" />
              {isEmailSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
