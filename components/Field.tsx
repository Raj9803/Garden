import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFieldStore } from '../store/field';
import { getChunkCoords, getVisibleChunks } from '../lib/generation';
import Sunflowers from './Sunflower';

export default function Field({ onFlowerClick }: { onFlowerClick: (id: string) => void }) {
  const lastChunk = useRef('');
  const flowers = useFieldStore(s => s.flowers);
  const selectedFlower = useFieldStore(s => s.selectedFlower);
  const flowerList = useMemo(() => Array.from(flowers.values()), [flowers]);
  useFrame(({ camera }) => {
    const chunk = getChunkCoords(camera.position.x, camera.position.z);
    const key = `${chunk.x}:${chunk.z}`;
    if (key !== lastChunk.current) {
      lastChunk.current = key;
      const visible = getVisibleChunks(camera.position.x, camera.position.z, 1);
      useFieldStore.getState().retainChunks(visible);
      visible.forEach(c => { void useFieldStore.getState().loadChunk(c); });
    }
  });
  return <Sunflowers flowers={flowerList} selectedId={selectedFlower?.id} onClick={flower => onFlowerClick(flower.id)} />;
}
