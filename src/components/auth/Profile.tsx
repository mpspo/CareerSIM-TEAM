import { useState, useEffect } from 'react';
import { supabase } from '../../clients/SupabaseClient';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      setProfile({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        created_at: user.created_at,
      });

      setFullName(user.user_metadata?.full_name || '');
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Fehler beim Laden des Profils');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (updateError) throw updateError;

      setSuccess('Profil erfolgreich aktualisiert!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Profils');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess('Passwort erfolgreich geändert!');
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Ändern des Passworts');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p style={{ textAlign: 'center' }}>Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#1f2937' }}>Profil</h1>
        <p style={{ margin: 0, color: '#6b7280' }}>Verwalte deine Account-Einstellungen</p>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {success && (
        <div
          style={{
            background: '#d1fae5',
            color: '#065f46',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            border: '1px solid #a7f3d0',
          }}
        >
          {success}
        </div>
      )}

      {/* Profile Information */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', color: '#1f2937' }}>
          Profil-Informationen
        </h2>

        <form onSubmit={handleUpdateProfile}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              E-Mail
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                background: '#f9fafb',
                cursor: 'not-allowed',
              }}
            />
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>
              Die E-Mail-Adresse kann nicht geändert werden
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Vollständiger Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
              }}
            />
          </div>

          <button type="submit" className="auth-button primary" disabled={saving}>
            {saving ? 'Wird gespeichert...' : 'Profil aktualisieren'}
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#1f2937' }}>
          Passwort ändern
        </h2>

        {!showPasswordChange ? (
          <button
            onClick={() => setShowPasswordChange(true)}
            className="auth-button"
            style={{ background: '#f3f4f6', color: '#374151' }}
          >
            Passwort ändern
          </button>
        ) : (
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="auth-button primary" disabled={saving}>
                {saving ? 'Wird gespeichert...' : 'Passwort ändern'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordChange(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                className="auth-button"
                style={{ background: '#f3f4f6', color: '#374151' }}
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Info */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#1f2937' }}>
          Account-Informationen
        </h2>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
          <strong>Account-ID:</strong> {profile.id}
        </p>
        <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
          <strong>Erstellt am:</strong> {new Date(profile.created_at).toLocaleDateString('de-DE')}
        </p>
      </div>

      {/* Logout */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#1f2937' }}>
          Abmelden
        </h2>
        <button
          onClick={handleLogout}
          className="auth-button"
          style={{ background: '#dc2626', color: 'white' }}
        >
          Ausloggen
        </button>
      </div>
    </div>
  );
}
