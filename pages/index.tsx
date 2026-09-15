import React, { useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import Atmosphere from '../components/Atmosphere';
import Field from '../components/Field';
import NoteModal from '../components/NoteModal';
import CameraController from '../components/CameraController';
import Instructions from '../components/Instructions';
import { useFieldStore } from '../store/field';
import { saveNote } from '../lib/api';

export default function Home() {
  const [showInstructions, setShowInstructions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  useEffect(() => {
    try { setShowInstructions(localStorage.getItem('garden-guide-minimized') !== 'true'); } catch { /* Storage may be disabled. */ }
  }, []);
  const toggleInstructions = useCallback(() => {
    setShowInstructions(previous => {
      const next = !previous;
      try { localStorage.setItem('garden-guide-minimized', String(!next)); } catch { /* Keep the control usable without storage. */ }
      return next;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        toggleInstructions();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleInstructions]);

  const { selectedFlower, setSelectedFlower, getFlower, updateFlowerNote } = useFieldStore((state) => ({
    selectedFlower: state.selectedFlower,
    setSelectedFlower: state.setSelectedFlower,
    getFlower: state.getFlower,
    updateFlowerNote: state.updateFlowerNote,
  }));

  const [noteInput, setNoteInput] = useState('');

  // Sync noteInput with selected flower's existing note
  useEffect(() => {
    if (selectedFlower) {
      setNoteInput(selectedFlower.note || '');
      setSaveError(null);
    }
  }, [selectedFlower?.id]);

  const handleFlowerClick = useCallback((flowerId: string) => {
    const flower = getFlower(flowerId);
    if (flower) {
      setSelectedFlower(flower);
    }
  }, [getFlower, setSelectedFlower]);

  // Save note to API AND update local state
  const handleUpdateNote = useCallback(async () => {
    if (!selectedFlower || !noteInput.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await saveNote(selectedFlower.id, noteInput.trim());
      if (response.success) {
        updateFlowerNote(selectedFlower.id, noteInput.trim());
        setSelectedFlower(null);
      } else {
        setSaveError(response.message || 'Failed to save note. Please try again.');
      }
    } catch (err) {
      setSaveError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedFlower, noteInput, updateFlowerNote, setSelectedFlower]);

  const handleCloseModal = useCallback(() => {
    setSelectedFlower(null);
    setSaveError(null);
  }, [setSelectedFlower]);

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        inset: 0,
      }}
    >
      <Canvas dpr={[1, 1.5]} camera={{ position: [22, 4.6, 32], fov: 58, near: 0.1, far: 500 }} gl={{ antialias: true, powerPreference: 'low-power' }} style={{ width: '100%', height: '100%', touchAction: 'none' }}>
        <Atmosphere />
        <CameraController />
        <Field onFlowerClick={handleFlowerClick} />
      </Canvas>

      {selectedFlower && (
        <NoteModal
          key={selectedFlower.id}
          value={noteInput}
          onChange={setNoteInput}
          onUpdate={handleUpdateNote}
          onClose={handleCloseModal}
          isSaving={isSaving}
          saveError={saveError}
        />
      )}

      <Instructions isVisible={showInstructions} onToggle={toggleInstructions} />
    </main>
  );
}
