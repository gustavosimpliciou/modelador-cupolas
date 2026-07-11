import { useStore } from '../store/useStore'
import { useT } from '../i18n/useT'

export default function Footer() {
  const stats = useStore((s) => s.stats)
  const lampshade = useStore((s) => s.lampshade)
  const activeMesh = useStore((s) => s.activeMesh)
  const t = useT()

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
      <FooterItem label={t('footer.fps')} value={stats.fps} color={stats.fps < 30 ? 'var(--error)' : 'var(--success)'} />
      <Divider />
      <FooterItem label={t('footer.tris')} value={stats.polygons} />
      <FooterItem label={t('footer.faces')} value={stats.faces} />
      <Divider />
      <FooterItem label={t('footer.print')} value={stats.printTime} />
      <FooterItem label={t('footer.weight')} value={stats.weight} />
      <FooterItem label={t('footer.vol')} value={stats.volume} />
      <Divider />
      <FooterItem label={t('footer.profile')} value={lampshade.profile.toUpperCase()} />
      {activeMesh && (
        <>
          <Divider />
          <FooterItem label={t('footer.mesh')} value={activeMesh.name.toUpperCase()} color="var(--accent)" />
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
