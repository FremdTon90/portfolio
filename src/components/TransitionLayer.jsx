import './TransitionLayer.css'

export default function TransitionLayer({ transitionState }) {
  const { active, from, to, mode, direction } = transitionState

  return (
    <div
      className={`transition-layer${active ? ' is-active' : ''}${
        direction === 'backward' ? ' is-backward' : ' is-forward'
      }`}
      aria-hidden="true"
    >
      <div className="transition-layer__backdrop" />
      <div className="transition-layer__frame" />
      <div className="transition-layer__status-card">
        <span className="transition-layer__eyebrow">Scroll Director</span>
        <strong className="transition-layer__headline">
          {mode === 'exitIntent' ? 'Transition armed' : 'Navigation stabilized'}
        </strong>
        <span className="transition-layer__route">
          {(from ?? 'hero').toUpperCase()} → {(to ?? 'hero').toUpperCase()}
        </span>
        <span className="transition-layer__direction">
          {direction === 'backward' ? 'Direction: upward return' : 'Direction: forward advance'}
        </span>
      </div>
    </div>
  )
}