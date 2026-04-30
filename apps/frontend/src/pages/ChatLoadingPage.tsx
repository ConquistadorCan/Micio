function SkeletonLine({ width, height = 10 }: { width: number | string; height?: number }) {
  return (
    <span
      className="animate-pulse"
      style={{
        display: 'block',
        width,
        height,
        borderRadius: 999,
        background: 'color-mix(in oklab, var(--muted-foreground) 18%, transparent)',
      }}
    />
  )
}

function SkeletonConversation({ active = false }: { active?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 'calc(var(--radius) * 0.6)',
        background: active ? 'var(--sidebar-accent)' : 'transparent',
      }}
    >
      <span
        className="animate-pulse"
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          flexShrink: 0,
          background: 'linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--accent) 70%, var(--primary)))',
          opacity: 0.55,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <SkeletonLine width={active ? '58%' : '46%'} height={11} />
          <SkeletonLine width={34} height={8} />
        </div>
        <div style={{ marginTop: 9 }}>
          <SkeletonLine width={active ? '82%' : '68%'} height={9} />
        </div>
      </div>
    </div>
  )
}

function SkeletonMessage({ align = 'left', width = '44%' }: { align?: 'left' | 'right'; width?: string }) {
  const isRight = align === 'right'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isRight ? 'flex-end' : 'flex-start',
        marginTop: 14,
      }}
    >
      <span
        className="animate-pulse"
        style={{
          display: 'block',
          width,
          maxWidth: 520,
          height: 44,
          borderRadius: 'calc(var(--radius) * 0.7)',
          borderTopLeftRadius: isRight ? 'calc(var(--radius) * 0.7)' : 6,
          borderTopRightRadius: isRight ? 6 : 'calc(var(--radius) * 0.7)',
          background: isRight ? 'var(--primary)' : 'var(--secondary)',
          opacity: isRight ? 0.56 : 0.72,
        }}
      />
    </div>
  )
}

export function ChatLoadingPage() {
  return (
    <div
      className="dark animate-fade-in"
      aria-busy="true"
      aria-label="Loading conversations"
      style={{
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        background: 'var(--sidebar-deep)',
        color: 'var(--foreground)',
        overflow: 'hidden',
      }}
    >
      <aside style={{ background: 'var(--sidebar)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--sidebar-border)', minWidth: 0 }}>
        <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: 0 }}>Micio</span>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>chat</span>
          </div>
          <span
            className="animate-pulse"
            style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--secondary)', display: 'block' }}
          />
        </div>

        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ height: 42, borderRadius: 'calc(var(--radius) * 0.6)', background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <SkeletonLine width="54%" height={9} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, padding: '0 20px', height: 41, alignItems: 'center', borderBottom: '1px solid var(--sidebar-border)' }}>
          <SkeletonLine width={30} height={10} />
          <SkeletonLine width={52} height={10} />
          <SkeletonLine width={48} height={10} />
        </div>

        <div style={{ flex: 1, overflow: 'hidden', padding: '8px 12px' }}>
          <SkeletonConversation active />
          <SkeletonConversation />
          <SkeletonConversation />
          <SkeletonConversation />
          <SkeletonConversation />
        </div>

        <div style={{ padding: 10, borderTop: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="animate-pulse" style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--secondary)', display: 'block' }} />
          <div style={{ flex: 1 }}>
            <SkeletonLine width="44%" height={10} />
          </div>
          <span className="animate-pulse" style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--secondary)', display: 'block' }} />
        </div>
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column', background: 'var(--background)', minWidth: 0, minHeight: 0 }}>
        <div style={{ height: 68, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span className="animate-pulse" style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--secondary)', display: 'block' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SkeletonLine width={150} height={12} />
            <div style={{ marginTop: 8 }}>
              <SkeletonLine width={92} height={9} />
            </div>
          </div>
          <span className="animate-pulse" style={{ width: 38, height: 38, borderRadius: 14, background: 'var(--secondary)', display: 'block' }} />
        </div>

        <div style={{ flex: 1, overflow: 'hidden', padding: '18px 24px 8px', minHeight: 0 }}>
          <SkeletonMessage width="38%" />
          <SkeletonMessage align="right" width="48%" />
          <SkeletonMessage width="56%" />
          <SkeletonMessage align="right" width="32%" />
          <SkeletonMessage width="44%" />
        </div>

        <div style={{ padding: '12px 24px 20px', flexShrink: 0 }}>
          <div style={{ height: 54, borderRadius: 'calc(var(--radius) * 0.8)', background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <SkeletonLine width="30%" height={10} />
          </div>
        </div>
      </main>
    </div>
  )
}
