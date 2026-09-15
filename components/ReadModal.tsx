import React from 'react';

interface ReadModalProps {
  isOpen: boolean;
  note: string;
  flowerId: string;
  onClose: () => void;
}

function ReadModal({ isOpen, note, flowerId, onClose }: ReadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-display mb-4 text-field-stem">Someone's Thoughts</h2>
        <p className="text-sm text-gray-500 mb-4">Flower ID: {flowerId}</p>

        <div className="bg-amber-50 rounded-lg p-4 mb-6 min-h-[150px]">
          <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{note}</p>
        </div>

        <div className="flex gap-3">
          <button className="btn-primary flex-1" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReadModal;
