import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ApiError, useApi } from '@/services/api'
import { UserPublic } from '@micio/shared'
import { decodeJwt } from '@/utils/jwt'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const { authFetch } = useApi()
  const navigate = useNavigate()

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/register'
      const body = mode === 'login' ? { email, password } : { nickname, email, password }
      const { accessToken } = await authFetch<{ accessToken: string }>(url, 'POST', body)
      const user = decodeJwt<UserPublic>(accessToken)
      login(accessToken, user)
      navigate('/chat')
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message)
      } else {
        setError(mode === 'login' ? 'Invalid email or password.' : 'Could not create account. Try a different nickname or email.')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <div
      className="dark animate-fade-in"
      style={{ height: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.1fr', background: 'var(--background)' }}
    >
      {/* LEFT — form */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '48px 64px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em' }}>Micio</span>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>— chat</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 440, width: '100%', margin: '0 auto' }}>
          <div className="animate-slide-up">
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--muted-foreground)', marginBottom: 14, textTransform: 'uppercase' }}>
              {mode === 'login' ? '— Welcome back' : '— Create account'}
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.035em', marginBottom: 12 }}>
              {mode === 'login' ? <>Pick up<br />where you left off.</> : <>Your conversations,<br />your circle.</>}
            </h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 15, lineHeight: 1.55, marginBottom: 32 }}>
              {mode === 'login'
                ? 'Sign in to keep talking with the people who matter most.'
                : 'A calm, private home for close friend chats. No ads, no noise.'}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <AuthField label="Nickname">
                <input
                  className="micio-input micio-input-lg"
                  placeholder="yournickname"
                  value={nickname}
                  onChange={e => setNickname(e.target.value.replace(/\s/g, ''))}
                  autoComplete="username"
                />
              </AuthField>
            )}
            <AuthField label="Email">
              <input
                className="micio-input micio-input-lg"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </AuthField>
            <AuthField label="Password" trailing={
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }>
              <input
                className="micio-input micio-input-lg"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: 48 }}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </AuthField>

            {error && (
              <div style={{ fontSize: 13, color: 'var(--destructive)', padding: '10px 14px', background: 'oklch(0.71 0.17 22 / 0.1)', borderRadius: 10 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ height: 56, fontSize: 15, marginTop: 8, borderRadius: 'calc(var(--radius) * 0.8)' }}
              disabled={loading}
            >
              {loading
                ? <span className="typing-dots"><span /><span /><span /></span>
                : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={18} /></>}
            </button>
          </form>

          <div style={{ marginTop: 32, fontSize: 14, color: 'var(--muted-foreground)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already on Micio? '}
            <button
              onClick={switchMode}
              style={{ color: 'var(--foreground)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
          <span className="mono">v0.9.2 · micio.chat</span>
        </div>
      </div>

      {/* RIGHT — hero */}
      <div className="hero-bg" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div className="hero-grid" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
        <AuthPreviewStack />
        <div style={{ position: 'absolute', left: 48, bottom: 48, right: 48, zIndex: 3 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'oklch(0.85 0.08 280)', marginBottom: 10, textTransform: 'uppercase' }}>
            Micio · for close friends
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.35, maxWidth: 460 }}>
            Small, quiet, yours. A chat app that stops asking for your attention the moment the conversation ends.
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthField({ label, children, trailing }: { label: string; children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: 6, paddingLeft: 4 }}>
        <label className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>{label}</label>
      </div>
      <div style={{ position: 'relative' }}>
        {children}
        {trailing}
      </div>
    </div>
  )
}

function AuthPreviewStack() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: 540 }}>
      <div style={{
        position: 'absolute', top: '8%', left: '8%', width: 320, padding: 16,
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
        transform: 'rotate(-3deg)',
        animation: 'slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 999, background: 'linear-gradient(135deg, oklch(0.65 0.22 292), oklch(0.55 0.24 280))' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>@elif</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>10:04 AM</div>
          </div>
        </div>
        <div style={{ padding: 10, background: 'var(--secondary)', borderRadius: 14, borderTopLeftRadius: 4, fontSize: 13, lineHeight: 1.5 }}>
          ramen tomorrow at 7? i'll book
        </div>
      </div>

      <div style={{
        position: 'absolute', top: '32%', right: '4%', width: 300, padding: 14,
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
        transform: 'rotate(4deg)',
        animation: 'slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted-foreground)' }}>WEEKEND CREW</div>
        </div>
        <div style={{ display: 'flex' }}>
          {(['EL', 'KE', 'ZE', 'BA'] as const).map((initials, idx) => (
            <div key={initials} style={{
              width: 30, height: 30, borderRadius: 999,
              background: `linear-gradient(135deg, oklch(${0.65 + idx * 0.03} 0.20 ${280 + idx * 20}), oklch(${0.55 + idx * 0.02} 0.22 ${270 + idx * 20}))`,
              border: '2px solid var(--card)', fontSize: 10, fontWeight: 700, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: idx === 0 ? 0 : -8,
            }}>{initials}</div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: '22%', left: '12%',
        padding: '12px 16px', maxWidth: 280,
        background: 'var(--primary)', color: 'white',
        borderRadius: 'var(--radius-lg)', borderTopRightRadius: 6,
        boxShadow: 'var(--shadow-glow), var(--shadow-lg)',
        transform: 'rotate(-1deg)',
        animation: 'slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both',
        fontSize: 14, lineHeight: 1.45, fontWeight: 500,
      }}>
        yes!! let's do it. should i invite kerem too?
      </div>

      <div style={{
        position: 'absolute', bottom: '10%', right: '16%',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', borderTopLeftRadius: 6,
        boxShadow: 'var(--shadow-md)',
        animation: 'slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both',
      }}>
        <div style={{ width: 22, height: 22, borderRadius: 999, background: 'linear-gradient(135deg, oklch(0.74 0.17 50), oklch(0.63 0.20 30))', fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ME</div>
        <span style={{ fontSize: 13, color: 'var(--foreground)', fontWeight: 500 }}>@mertk: sure, i'm in</span>
      </div>
    </div>
  )
}
