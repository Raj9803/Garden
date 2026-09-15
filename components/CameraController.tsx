import React, { useEffect, useRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Euler } from 'three';

interface CameraControllerProps {
  onCameraMove?: (pos: [number, number, number]) => void;
}

function CameraController({ onCameraMove }: CameraControllerProps) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new Vector3());
  const targetRotation = useRef({ x: 0, y: 0 });
  const mouseDown = useRef(false);
  //phone touch state
  const touchStartX = useRef(0);
const touchStartY = useRef(0);
const isTouching = useRef(false);
  
  // Reuse objects instead of creating new ones every frame
  const direction = useRef(new Vector3());
  const currentRotation = useRef(new Vector3());
  const direction2 = useRef(new Vector3());
  const euler = useRef(new Euler(0, 0, 0, 'YXZ'));

  // Helper to check if a note modal is open
  const isNoteOpen = () => {
    try {
      const { useFieldStore } = require('../store/field');
      return !!useFieldStore.getState().selectedFlower;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Initialize camera position
    camera.position.set(0, 25, 30);
    camera.lookAt(0, 5, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isNoteOpen()) return; // Block WASD if note modal is open
      keys.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

   // MOUSE EVENTS (desktop)
const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 2 || e.button === 0) {
    mouseDown.current = true;
  }
};

const handleMouseUp = () => {
  mouseDown.current = false;
};

const handleMouseMove = (e: MouseEvent) => {
  if (mouseDown.current) {
    targetRotation.current.y -= e.movementX * 0.005;
    targetRotation.current.x -= e.movementY * 0.005;
    targetRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.current.x));
  }
};

// ✅ TOUCH EVENTS (mobile) - ADD THESE:
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    isTouching.current = true;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
};

const handleTouchEnd = () => {
  isTouching.current = false;
};

const handleTouchMove = (e: TouchEvent) => {
  if (isTouching.current && e.touches.length === 1) {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    targetRotation.current.y -= deltaX * 0.005;
    targetRotation.current.x -= deltaY * 0.005;
    targetRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.current.x));

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
};

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
window.addEventListener('mousedown', handleMouseDown);
window.addEventListener('mouseup', handleMouseUp);
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('contextmenu', handleContextMenu);

// ✅ ADD THESE TOUCH LISTENERS:
window.addEventListener('touchstart', handleTouchStart, false);
window.addEventListener('touchend', handleTouchEnd, false);
window.addEventListener('touchmove', handleTouchMove, false);

return () => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('mousedown', handleMouseDown);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('contextmenu', handleContextMenu);
  
  // ✅ ADD THESE:
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchend', handleTouchEnd);
  window.removeEventListener('touchmove', handleTouchMove);
};
  }, [camera]);

  useFrame(() => {
    const speed = 0.3;
    
    // Reuse direction vector
    direction.current.set(0, 0, 0);

    if (keys.current['w'] || keys.current['arrowup']) {
      direction.current.z -= 1;
    }
    if (keys.current['s'] || keys.current['arrowdown']) {
      direction.current.z += 1;
    }
    if (keys.current['a'] || keys.current['arrowleft']) {
      direction.current.x -= 1;
    }
    if (keys.current['d'] || keys.current['arrowright']) {
      direction.current.x += 1;
    }

    if (direction.current.length() > 0) {
      direction.current.normalize();

      // Rotate movement based on camera angle
      const cos = Math.cos(targetRotation.current.y);
      const sin = Math.sin(targetRotation.current.y);
      const x = direction.current.x * cos + direction.current.z * sin;
      const z = direction.current.z * cos - direction.current.x * sin;

      velocity.current.x = x * speed;
      velocity.current.z = z * speed;
    } else {
      velocity.current.x *= 0.9;
      velocity.current.z *= 0.9;
    }

    // Apply velocity
    camera.position.add(velocity.current);

    // Update rotation using reused Euler
    euler.current.set(
      targetRotation.current.x,
      targetRotation.current.y,
      0
    );
    camera.quaternion.setFromEuler(euler.current);

    // Focus on a point ahead
    const focusDistance = 50;
    direction2.current.set(0, 0, -1).applyQuaternion(camera.quaternion);
    const focusPoint = camera.position.clone().add(direction2.current.multiplyScalar(focusDistance));
    camera.lookAt(focusPoint);

    if (onCameraMove) {
      onCameraMove([camera.position.x, camera.position.y, camera.position.z]);
    }
  });

  return null;
}

export default CameraController;
