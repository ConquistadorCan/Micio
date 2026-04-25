export function LoadingPage() {
  return (
    <div className="dark h-full hero-bg hero-grid flex items-center justify-center">
      <div className="animate-fade-in flex flex-col items-center gap-6">
        <span
          style={{
            color: 'var(--primary)',
            textShadow: 'var(--shadow-glow)',
            fontWeight: 700,
            fontSize: '2.2rem',
            letterSpacing: '-0.04em',
          }}
        >
          Micio
        </span>
        <div className="typing-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}
