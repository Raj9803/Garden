import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { BufferGeometry, Color, CylinderGeometry, Float32BufferAttribute, InstancedMesh, MeshStandardMaterial, Object3D, OctahedronGeometry, PlaneGeometry, ShaderMaterial, SphereGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Flower } from '../types';

// One colored mesh shared by every flower: no textures or individual petal draw calls.
function makeFlower(tulip = false) {
  const parts: BufferGeometry[] = [];
  function part(geometry: BufferGeometry, color: string, position: number[], scale: number[], rotation = 0) {
    geometry.scale(scale[0], scale[1], scale[2]);
    geometry.rotateZ(rotation);
    geometry.translate(position[0], position[1], position[2]);
    const c = new Color(color);
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) { colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b; }
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geometry.deleteAttribute('uv');
    parts.push(geometry.index ? geometry.toNonIndexed() : geometry.clone());
    geometry.dispose();
  }
  if (tulip) {
    // 0.46 units tall: about 14% of the sunflower, tucked beside its stem.
    part(new CylinderGeometry(0.012, 0.018, 0.29, 5), '#568139', [0, 0.145, 0], [1, 1, 1]);
    part(new SphereGeometry(1, 6, 4), '#719a43', [-0.045, 0.12, 0], [0.025, 0.11, 0.016], 0.4);
    part(new SphereGeometry(1, 6, 4), '#497831', [0.045, 0.16, 0], [0.03, 0.13, 0.018], -0.45);
    part(new SphereGeometry(1, 8, 5), '#eeb527', [0, 0.325, 0], [0.065, 0.075, 0.065]);
    for (let i = 0; i < 6; i++) {
      const angle = i / 6 * Math.PI * 2;
      part(new SphereGeometry(1, 6, 5), i % 2 ? '#ffdf47' : '#ffc629',
        [Math.cos(angle) * 0.042, 0.365, Math.sin(angle) * 0.042], [0.045, 0.095, 0.045]);
    }
    const merged = mergeGeometries(parts);
    parts.forEach(p => p.dispose());
    return merged.translate(0.62, 0, 0.28);
  }
  for (let i = 0; i < 7; i++) {
    part(new SphereGeometry(1, 4, 2), i % 2 ? '#82994c' : '#597a39', [Math.sin(i * 2.4) * 0.45, 0.18, Math.cos(i * 2.4) * 0.45], [0.035, 0.32, 0.025], Math.sin(i) * 0.5);
  }
  part(new CylinderGeometry(0.035, 0.065, 2.5, 5), '#517733', [0, 1.25, 0], [1, 1, 1]);
  for (let i = 0; i < 3; i++) {
    const side = i % 2 ? -1 : 1;
    part(new SphereGeometry(1, 6, 4), i % 2 ? '#446c2e' : '#739442', [side * 0.25, 0.65 + i * 0.46, 0], [0.17, 0.48, 0.055], -side * 0.95);
  }
  part(new SphereGeometry(1, 10, 6), '#536c2b', [0, 2.5, -0.08], [0.39, 0.39, 0.17]);
  for (let i = 0; i < 26; i++) {
    const angle = (i % 13) / 13 * Math.PI * 2 + (i >= 13 ? 0.24 : 0);
    const radius = i < 13 ? 0.51 : 0.44;
    part(new SphereGeometry(1, 6, 4), i < 13 ? '#edaa24' : '#ffcf38', [Math.sin(angle) * radius, 2.5 + Math.cos(angle) * radius, i < 13 ? -0.055 : 0.015], [0.115, i < 13 ? 0.34 : 0.29, 0.065], -angle);
  }
  part(new SphereGeometry(1, 12, 8), '#61391e', [0, 2.5, 0.065], [0.32, 0.32, 0.15]);
  for (let i = 0; i < 45; i++) {
    const r = Math.sqrt(i / 45) * 0.29;
    const a = i * 2.399963;
    part(new OctahedronGeometry(0.025), i % 3 ? '#a47437' : '#382618', [Math.cos(a) * r, 2.5 + Math.sin(a) * r, 0.09 + Math.sqrt(1 - r * r / 0.1024) * 0.14], [1, 1, 0.65]);
  }
  const merged = mergeGeometries(parts);
  parts.forEach(p => p.dispose());
  return merged;
}
const geometry = makeFlower();
const tulipGeometry = makeFlower(true);
const tulipMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
const shadowGeometry = new PlaneGeometry(2.8, 2.8).rotateX(-Math.PI / 2).translate(0, 0.012, 0);
const shadowMaterial = new ShaderMaterial({
  transparent: true, depthWrite: false,
  vertexShader: `varying vec2 shadowUv; varying float shadowDistance;
    void main() { shadowUv = uv; vec4 view = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      shadowDistance = length(view.xyz); gl_Position = projectionMatrix * view; }`,
  fragmentShader: `varying vec2 shadowUv; varying float shadowDistance;
    void main() { float opacity = pow(1.0 - smoothstep(0.0, 0.5, distance(shadowUv, vec2(0.5))), 2.0);
      gl_FragColor = vec4(0.13, 0.20, 0.08, opacity * 0.32 * (1.0 - smoothstep(32.0, 78.0, shadowDistance))); }`,
});
const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.84 });
const wind = { value: 0 };
material.onBeforeCompile = shader => {
  shader.uniforms.gardenTime = wind;
  shader.vertexShader = 'uniform float gardenTime;\n' + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float phase = instanceMatrix[3].x * 0.4 + instanceMatrix[3].z * 0.23;
    transformed.x += sin(gardenTime * 1.15 + phase) * 0.035 * position.y * position.y;`);
};

export default function Sunflowers({ flowers, selectedId, onClick }: { flowers: Flower[]; selectedId?: string; onClick: (flower: Flower) => void }) {
  const ref = useRef<InstancedMesh>(null);
  const shadows = useRef<InstancedMesh>(null);
  const tulips = useRef<InstancedMesh>(null);
  const notedFlowers = useMemo(() => flowers.filter(flower => flower.occupied), [flowers]);
  const reducedMotion = useRef(false);
  useLayoutEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { reducedMotion.current = query.matches; };
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    if (!ref.current) return;
    flowers.forEach((flower, i) => {
      dummy.position.set(...flower.position);
      dummy.rotation.set(0, Math.sin(flower.rotation) * 0.55, 0);
      dummy.scale.setScalar(flower.scale * (flower.id === selectedId ? 1.08 : 1));
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
      shadows.current?.setMatrixAt(i, dummy.matrix);
      ref.current!.setColorAt(i, new Color(flower.occupied ? '#fff1bb' : '#ffffff'));
    });
    ref.current.count = flowers.length;
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
    if (shadows.current) {
      shadows.current.count = flowers.length;
      shadows.current.instanceMatrix.needsUpdate = true;
      shadows.current.computeBoundingSphere();
    }
  }, [flowers, selectedId, dummy]);
  useLayoutEffect(() => {
    if (!tulips.current) return;
    notedFlowers.forEach((flower, i) => {
      dummy.position.set(...flower.position);
      dummy.rotation.set(0, Math.sin(flower.rotation) * 0.55, 0);
      dummy.scale.setScalar(flower.scale);
      dummy.updateMatrix();
      tulips.current!.setMatrixAt(i, dummy.matrix);
    });
    tulips.current.count = notedFlowers.length;
    tulips.current.instanceMatrix.needsUpdate = true;
    tulips.current.computeBoundingSphere();
  }, [notedFlowers, dummy]);
  useFrame(({ clock }) => { wind.value = reducedMotion.current ? 0 : clock.elapsedTime; });
  const click = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5 || event.instanceId === undefined) return;
    event.stopPropagation();
    onClick(flowers[event.instanceId]);
  };
  return <>
    <instancedMesh ref={ref} args={[geometry, material, 1000]} onClick={click} dispose={null} />
    <instancedMesh ref={shadows} args={[shadowGeometry, shadowMaterial, 1000]} dispose={null} />
    <instancedMesh name="saved-note-tulips" ref={tulips} args={[tulipGeometry, tulipMaterial, 1000]} dispose={null}
      onClick={event => {
        if (event.delta > 5 || event.instanceId === undefined) return;
        event.stopPropagation();
        onClick(notedFlowers[event.instanceId]);
      }} />
  </>;
}
