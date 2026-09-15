import React, { useState } from 'react';
import { createNote } from '../lib/api';
import { Flower } from '../types';
import { useFieldStore } from '../store/field';
import { v4 as uuidv4 } from 'uuid';

interface WriteModalProps {
  isOpen: boolean;
  flower: Flower | null;
  onClose: () => void;
  onNoteCreated?: () => void;
}

function WriteModal({ isOpen, flower, onClose, onNoteCreated }: WriteModalProps) {
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateFlowerNote = useFieldStore((state) => state.updateFlowerNote);

  const handleSubmit = async () => {
    if (!flower || !noteText.trim()) {
      setError('Please write something before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await createNote({
        flower_id: flower.id,
        note: noteText,
      });

      if (response.success) {
        updateFlowerNote(flower.id, noteText);
        setNoteText('');
        onClose();
        onNoteCreated?.();
      } else {
        setError(response.message || 'Failed to create note');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !flower) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-display mb-2 text-field-stem">Leave Your Thoughts</h2>
        <p className="text-sm text-gray-500 mb-4">Flower ID: {flower.id}</p>

        <textarea
          autoFocus
          placeholder="What's on your mind? Share your thoughts with visitors..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="input-field mb-4 resize-none focus:ring-2 focus:ring-field-stem"
          rows={6}
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            className="btn-secondary flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn-primary flex-1 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSubmitting || !noteText.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Plant Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WriteModal;
