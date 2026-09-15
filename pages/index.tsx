import React, { useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Sky } from '@react-three/drei';
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setShowInstructions((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      <Canvas style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 20, 10]} intensity={2} />
        <PerspectiveCamera makeDefault position={[0, 12, 25]} fov={75} />
        <Sky />
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

      <Instructions isVisible={showInstructions} />
    </main>
  );
}
