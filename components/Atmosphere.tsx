import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Group, Mesh, MeshStandardMaterial } from 'three';

const meadow = new MeshStandardMaterial({ color: '#82944e', roughness: 1 });
meadow.onBeforeCompile = shader => {
  shader.vertexShader = 'varying vec3 meadowPosition;\n' + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n meadowPosition = (modelMatrix * vec4(position, 1.0)).xyz;');
  shader.fragmentShader = 'varying vec3 meadowPosition;\n' + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    float meadowPatch = sin(meadowPosition.x * 0.38 + sin(meadowPosition.z * 0.27)) * sin(meadowPosition.z * 0.41);
    float grain = fract(sin(dot(floor(meadowPosition.xz * 22.0), vec2(12.9898, 78.233))) * 43758.5453);
    diffuseColor.rgb *= 0.88 + meadowPatch * 0.16 + grain * 0.16;`);
};

export default function Atmosphere() {
  const scenery = useRef<Group>(null);
  const ground = useRef<Mesh>(null);
  const clouds = useMemo(() => Array.from({ length: 9 }, (_, i) => ({
    x: Math.sin(i * 8.3) * 180, y: 30 + (i % 4) * 9, z: -150 + Math.cos(i * 3.7) * 90,
    scale: 2.5 + (i % 3) * 1.1,
  })), []);
  useFrame(({ camera }) => {
    if (scenery.current) scenery.current.position.set(camera.position.x * 0.96, 0, camera.position.z * 0.96);
    if (ground.current) ground.current.position.set(camera.position.x, -0.035, camera.position.z);
  });
  return <>
    <color attach="background" args={['#bddce0']} />
    <fog attach="fog" args={['#bdd2b2', 32, 78]} />
    <hemisphereLight args={['#d6efff', '#626d2e', 2.1]} />
    <directionalLight position={[35, 45, -40]} color="#fff0c6" intensity={3} />
    <mesh ref={ground} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[600, 600]} />
      <primitive object={meadow} attach="material" />
    </mesh>
    <group ref={scenery}>
      <mesh>
        <sphereGeometry args={[420, 24, 16]} />
        <shaderMaterial side={BackSide} depthWrite={false}
          vertexShader={'varying vec3 skyPosition; void main() { skyPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'}
          fragmentShader={'varying vec3 skyPosition; void main() { float h = max(normalize(skyPosition).y, 0.0); vec3 color = mix(vec3(0.83, 0.88, 0.76), vec3(0.29, 0.63, 0.80), pow(h, 0.55)); gl_FragColor = vec4(color, 1.0); #include <colorspace_fragment> }'.replace('#include <colorspace_fragment>', '\n#include <colorspace_fragment>\n')}
        />
      </mesh>
      <mesh position={[95, 80, -230]}>
        <sphereGeometry args={[13, 24, 16]} />
        <meshBasicMaterial color="#fff4ce" fog={false} toneMapped={false} />
      </mesh>
      {clouds.map((cloud, i) => <group key={i} position={[cloud.x, cloud.y, cloud.z]} scale={cloud.scale}>
        {[0, 1, 2, 3, 4].map(j => <mesh key={j} position={[(j - 2) * 1.5, Math.sin(j * 1.8 + i) * 0.5, Math.cos(j * 2) * 0.4]} scale={[1.65, 0.7 + (j % 3) * 0.25, 1]}>
          <sphereGeometry args={[1, 10, 7]} />
          <meshStandardMaterial color="#fffaf0" emissive="#c5d5e4" emissiveIntensity={0.65} roughness={1} fog={false} />
        </mesh>)}
      </group>)}
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.cos(i / 12 * Math.PI * 2) * 190, -9, Math.sin(i / 12 * Math.PI * 2) * 190]} scale={[65, 14 + i % 3 * 5, 48]}>
        <sphereGeometry args={[1, 20, 10]} />
        <meshStandardMaterial color={i % 2 ? '#9daf8a' : '#899f7e'} roughness={1} fog={false} />
      </mesh>)}
    </group>
  </>;
}


