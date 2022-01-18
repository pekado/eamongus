/* import React from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useLoader } from '@react-three/fiber';
import model from './duck.glb';
const Model = () => {
  const geom = useLoader(GLTFLoader, model);
  return (
    <group rotation={[Math.PI / 2, 0, 0]} position={[0, 2, 0]}>
      <primitive object={geom.scene}></primitive>
    </group>
  );
};

export default Model; */
