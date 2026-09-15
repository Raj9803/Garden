import React from 'react';

export default function Instructions({ isVisible, onToggle }: { isVisible: boolean; onToggle: () => void }) {
  const move = (key: string, active: boolean) => window.dispatchEvent(new CustomEvent('garden-move', { detail: { key, active } }));
  return <>
    <header className="garden-title">
      <span className="garden-eyebrow">A LITTLE SPACE TO BREATHE</span>
      <h1>The Sunflower Field<span>.</span></h1>
      <p>A thousand little suns. A place for your thoughts.</p>
    </header>
    <button className="garden-help" onClick={onToggle} aria-label="Toggle garden instructions" aria-expanded={isVisible} aria-controls="garden-guide">?</button>
    {isVisible && <section className="garden-guide" id="garden-guide" aria-label="Garden instructions">
      <div className="garden-guide-heading">
        <span className="garden-eyebrow">TAKE YOUR TIME</span>
        <button className="garden-minimize" onClick={onToggle} aria-label="Minimize garden instructions" title="Minimize instructions">−</button>
      </div>
      <p>Wander a little.<br /><em>Leave something behind.</em></p>
      <div className="garden-controls"><span><kbd>W A S D</kbd> to wander</span><span>Drag to look around</span><span>Tap a sunflower to leave a note</span><span>A little yellow tulip marks a saved note</span></div>
    </section>}
    <div className="garden-footer"><span className="garden-dot" /> An endless garden, one thought at a time.</div>
    <nav className="garden-touch" aria-label="Move through the garden">
      {([['a', '←', 'Move left'], ['w', '↑', 'Move forward'], ['s', '↓', 'Move backward'], ['d', '→', 'Move right']] as const).map(([key, label, title]) => <button key={key} aria-label={title}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); move(key, true); }}
        onPointerUp={() => move(key, false)} onPointerCancel={() => move(key, false)} onLostPointerCapture={() => move(key, false)}>{label}</button>)}
    </nav>
  </>;
}
