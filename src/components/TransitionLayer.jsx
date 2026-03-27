import './TransitionLayer.css'

export default function TransitionLayer({ transitionState }) {
  const {
    active,
    phase,
    direction,
    progress,
  } = transitionState

  return (
    <div
      className={[
        'transition-layer',
        active ? 'is-active' : '',
        phase === 'arming' ? 'is-arming' : '',
        phase === 'playback' ? 'is-playback' : '',
        direction === 'backward' ? 'is-backward' : 'is-forward',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
      style={{
        '--transition-progress': progress,
      }}
    >
      <div className="transition-layer__backdrop" />
      <div className="transition-layer__vignette" />
      <div className="transition-layer__frame">
        <span className="transition-layer__edge transition-layer__edge--top" />
        <span className="transition-layer__edge transition-layer__edge--right" />
        <span className="transition-layer__edge transition-layer__edge--bottom" />
        <span className="transition-layer__edge transition-layer__edge--left" />
      </div>
      <div className="transition-layer__charge transition-layer__charge--primary" />
      <div className="transition-layer__charge transition-layer__charge--secondary" />
      <div className="transition-layer__scan" />
      <div className="transition-layer__flash" />
    </div>
  )
}