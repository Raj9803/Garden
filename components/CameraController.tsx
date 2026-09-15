import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Euler, Vector3 } from 'three';
import { useFieldStore } from '../store/field';

export default function CameraController() {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const look = useRef({ x: -0.09, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const direction = useRef(new Vector3());
  const rotation = useRef(new Euler(0, 0, 0, 'YXZ'));
  useEffect(() => {
    camera.position.set(22, 4.6, 32);
    const canvas = gl.domElement;
    const down = (e: KeyboardEvent) => {
      if (useFieldStore.getState().selectedFlower) return;
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault(); keys.current.add(e.key.toLowerCase());
      }
    };
    const up = (e: KeyboardEvent) => { keys.current.delete(e.key.toLowerCase()); };
    const pointerDown = (e: PointerEvent) => {
      if (useFieldStore.getState().selectedFlower) return;
      drag.current = { x: e.clientX, y: e.clientY };
    };
    const pointerMove = (e: PointerEvent) => {
      if (!drag.current || useFieldStore.getState().selectedFlower) return;
      look.current.y -= (e.clientX - drag.current.x) * 0.003;
      look.current.x = Math.max(-0.65, Math.min(0.8, look.current.x - (e.clientY - drag.current.y) * 0.003));
      drag.current = { x: e.clientX, y: e.clientY };
    };
    const release = () => { drag.current = null; };
    const reset = () => { release(); keys.current.clear(); };
    const context = (e: Event) => e.preventDefault();
    const travel = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.active) keys.current.add(detail.key); else keys.current.delete(detail.key);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', reset);
    window.addEventListener('garden-move', travel);
    canvas.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', reset);
    canvas.addEventListener('contextmenu', context);
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up);
      window.removeEventListener('blur', reset); window.removeEventListener('garden-move', travel);
      canvas.removeEventListener('pointerdown', pointerDown); window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', reset);
      canvas.removeEventListener('contextmenu', context);
    };
  }, [camera, gl]);
  useFrame((_, delta) => {
    if (useFieldStore.getState().selectedFlower) { keys.current.clear(); drag.current = null; return; }
    const k = keys.current;
    direction.current.set(Number(k.has('d') || k.has('arrowright')) - Number(k.has('a') || k.has('arrowleft')), 0,
      Number(k.has('s') || k.has('arrowdown')) - Number(k.has('w') || k.has('arrowup')));
    direction.current.normalize().applyAxisAngle(camera.up, look.current.y);
    camera.position.addScaledVector(direction.current, Math.min(delta, 0.05) * 7);
    rotation.current.set(look.current.x, look.current.y, 0);
    camera.quaternion.setFromEuler(rotation.current);
  });
  return null;
}
