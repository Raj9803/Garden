import React, {
  useMemo,
  useRef,
  memo
} from 'react';

import {
  useFrame
} from '@react-three/fiber';

import {
  Group,
  CylinderGeometry,
  SphereGeometry,
  PlaneGeometry,
  RingGeometry
} from 'three';

import {
  Flower
} from '../types';

// Shared geometries - reuse across all flowers
const stemGeometry = new CylinderGeometry(0.1, 0.15, 2, 8);
const petalGeometry = new PlaneGeometry(0.3, 0.6);
const headGeometry = new SphereGeometry(0.5, 16, 16);
const selectionRingGeometry = new RingGeometry(0.8, 1, 32);

interface SunflowerProps {
  flower: Flower;
  onClick: (
    flower: Flower
  ) => void;

  isSelected: boolean;

  scale?: number;
}

function SunflowerModel({
  flower,
  onClick,
  isSelected,
  scale = 1
}: SunflowerProps) {

  const groupRef =
    useRef<Group>(
      null
    );

  const swayOffset =
    useMemo(
      () =>
        Math.random() *
        Math.PI *
        2,
      [flower.id]
    );

  useFrame((state) => {

    if (
      groupRef.current
    ) {

      groupRef.current.rotation.z =
        Math.sin(
          state.clock.elapsedTime +
          swayOffset
        ) * 0.01;

    }

  });

  return (

<group
  ref={groupRef}
  scale={scale}

  position={[
    flower.position[0],
    flower.position[1],
    flower.position[2]
  ]}

  onClick={(e) => {
    e.stopPropagation();

    onClick(
      flower
    );
  }}
>

<mesh
position={[
0,
-0.5,
0
]}
>
<primitive object={stemGeometry} />

<meshStandardMaterial
color={
flower.occupied
? "#3d6b4f"
: "#4a7c59"
}
/>

</mesh>

<mesh
position={[
0,
0.8,
0
]}
>

<primitive object={headGeometry} />

<meshStandardMaterial
color="#8B6F47"
/>

</mesh>

<group
position={[
0,
0.9,
0
]}
rotation={[
0,
0,
flower.rotation
]}
>

{
Array.from({
length:12
}).map(
(_,i)=>{

const angle=
(i/12)*
Math.PI*
2;

return(

<mesh
key={i}

position={[
Math.cos(
angle
)*0.7,

0,

Math.sin(
angle
)*0.7
]}
>

<primitive object={petalGeometry} />

<meshStandardMaterial
color={
isSelected
? "#FFE54C"
: "#FFD700"
}

side={2}
/>

</mesh>

);

})
}

</group>

{
isSelected && (

<mesh
position={[
0,
-0.5,
0
]}
>

<primitive object={selectionRingGeometry} />

<meshBasicMaterial
color="#FFE54C"
wireframe
/>

</mesh>

)
}

</group>

);

}

export default memo(SunflowerModel);