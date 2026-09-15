import React from 'react';

interface InstructionsProps {
  isVisible: boolean;
}

function Instructions({ isVisible }: InstructionsProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-6 left-6 bg-white bg-opacity-90 rounded-lg shadow-lg p-4 max-w-xs backdrop-blur-sm animate-fade-in z-40">
      <h3 className="font-display text-lg text-field-stem mb-2">The Field</h3>
      <ul className="text-xs text-gray-700 space-y-1">
        <li><span className="font-semibold">WASD / Arrows</span> - Move around</li>
        <li><span className="font-semibold">Right Click + Drag</span> - Look around</li>
        <li><span className="font-semibold">Click Sunflower</span> - Read / Write note</li>
        <li><span className="font-semibold">H</span> - Hide instructions</li>
      </ul>
    </div>
  );
}

export default Instructions;
