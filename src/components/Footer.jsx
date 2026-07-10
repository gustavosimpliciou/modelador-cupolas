import { useStore } from '../store/useStore'

export default function Footer() {
  const stats = useStore((s) => s.stats)
  const lampshade = useStore((s) => s.lampshade)
  const activeMesh = useStore((s) => s.activeMesh)

  return (
    <footer style={{
      height: 26, flexShrink: 0,
      display: 'flex', alignItems: 'center',
      background: 'var(--panel)',
      borderTop: '1px solid var(--line)',
      padding: '0 12px',
      gap: 16,
      fontFamily: 'var(--font-mono)', fontSize: 10,
      color: 'var(--text-secondary)',
    }}>
      <FooterItem label="FPS" value={stats.fps} color={stats.fps < 30 ? 'var(--error)' : 'var(--success)'} />
      <Divider />
      <FooterItem label="TRIS" value={stats.polygons} />
      <FooterItem label="FACES" value={stats.faces} />
      <Divider />
      <FooterItem label="PRINT" value={stats.printTime} />
      <FooterItem label="PESO" value={stats.weight} />
      <FooterItem label="VOL" value={stats.volume} />
      <Divider />
      <FooterItem label="PERFIL" value={lampshade.profile.toUpperCase()} />
      {activeMesh && (
        <>
          <Divider />
          <FooterItem label="MALHA" value={activeMesh.name.toUpperCase()} color="var(--accent)" />
        </>
      )}

      <div style={{ flex: 1 }} />

      <span style={{ color: 'var(--text-dim)' }}>
        {lampshade.bottomDiameter}mm × {lampshade.height}mm · {lampshade.fitterType}
      </span>
    </footer>
  )
}

function FooterItem({ label, value, color }) {
  return (
    <span style={{ display: 'flex', gap: 4 }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span style={{ color: color || 'var(--text)' }}>{value}</span>
    </span>
  )
}

function Divider() {
  return <span style={{ color: 'var(--line)' }}>|</span>
}
