import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PlaneGeometry } from 'three';
import { Fog } from 'three';
import { useFieldStore } from '../store/field';
import { getChunkCoords, getVisibleChunks } from '../lib/generation';
import SunflowerModel from './Sunflower';
import { Flower } from '../types';

// Shared ground geometry - defined at module level (before component)
const groundGeometry = new PlaneGeometry(1000, 1000);

interface FieldProps {
  onFlowerClick: (flowerId: string) => void;
}

function Field({ onFlowerClick }: FieldProps) {
  const { camera } = useThree();
  const chunkLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastChunkKeyRef = useRef<string>('');

  const {
    flowers,
    selectedFlower,
    loadChunk,
    setCameraPos,
    setSelectedFlower,
  } = useFieldStore((state) => ({
    flowers: state.flowers,
    selectedFlower: state.selectedFlower,
    loadChunk: state.loadChunk,
    setCameraPos: state.setCameraPos,
    setSelectedFlower: state.setSelectedFlower,
  }));

  // Debounce chunk loading
  useFrame(() => {
    const cameraChunk = getChunkCoords(camera.position.x, camera.position.z);
    const chunkKey = `${cameraChunk.x}-${cameraChunk.z}`;

    if (chunkKey !== lastChunkKeyRef.current) {
      lastChunkKeyRef.current = chunkKey;

      if (chunkLoadTimeoutRef.current) {
        clearTimeout(chunkLoadTimeoutRef.current);
      }

      chunkLoadTimeoutRef.current = setTimeout(() => {
        const visibleChunks = getVisibleChunks(camera.position.x, camera.position.z);
        visibleChunks.forEach((chunk) => {
          loadChunk(chunk);
        });
      }, 100);
    }

    setCameraPos([camera.position.x, camera.position.y, camera.position.z]);
  });

  // Fog effect
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    scene.fog = new Fog(0x87ceeb, 100, 300);
    return () => {
      if (chunkLoadTimeoutRef.current) clearTimeout(chunkLoadTimeoutRef.current);
    };
  }, [scene]);

  const flowerList = useMemo(() => Array.from(flowers.values()), [flowers]);

  const handleFlowerClick = useCallback(
    (flower: Flower) => {
      setSelectedFlower(flower);
      onFlowerClick(flower.id);
    },
    [setSelectedFlower, onFlowerClick]
  );

  return (
    <>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <primitive object={groundGeometry} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>

      {/* Flowers */}
      {flowerList.map((flower) => (
        <SunflowerModel
          key={flower.id}
          flower={flower}
          scale={selectedFlower?.id === flower.id ? 1.15 : 1}
          onClick={handleFlowerClick}
          isSelected={selectedFlower?.id === flower.id}
        />
      ))}
    </>
  );
}

export default Field;
