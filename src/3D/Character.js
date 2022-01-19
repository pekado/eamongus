import React, {Suspense} from 'react';
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const Character = () => {
    const gltf = useLoader(GLTFLoader, '/scene.gltf')
    return (
        <primitive object={gltf.scene} scale={0.4}/>

    )
};

export default Character;
