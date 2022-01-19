import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import './App.css';
import Form from './Form';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import Ground from './3D/Ground';
import { Physics } from '@react-three/cannon';
import Vehicle from './3D/Vehicle';
/* import Character from "./3D/Character"; */
import { usePlane } from '@react-three/cannon';
const Plane = ({ color, ...props }) => {
  const [ref] = usePlane(() => ({ ...props }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeBufferGeometry attach='geometry' args={[1000, 1000]} />
      <meshPhongMaterial attach='material' color={color} />
    </mesh>
  );
};

const App = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  return (
    <div className='App h-full overflow-hidden'>
      {!user.username && <Form setUser={setUser} />}
      <h2 className='absolute z-10 text-3xl p-3'>{user.username}</h2>
      <Canvas
        concurrent
        shadowMap
        sRGB
        gl={{ alpha: false }}
        camera={{ position: [0, -12, 16] }}
      >
        <fog attach='fog' args={['#171720', 10, 50]} />
        <color attach='background' args={['#171720']} />
        <ambientLight intensity={0.6} />
        <spotLight
          position={[10, 20, 50]}
          angle={2}
          intensity={1}
          castShadow
          penumbra={1}
        />
        <Physics gravity={[0, 0, -30]}>
          <Plane color={'red'} position={[10, 0, 0]} rotation={[0, -1, 0]} />
          <Plane color={'red'} position={[0, 10, 0]} rotation={[1, 0, 0]} />
          <Plane color={'red'} position={[0, -10, 0]} rotation={[-1, 0, 0]} />
          <Plane color={'red'} position={[-10, 0, 0]} rotation={[0, 1, 0]} />
          <Vehicle
            position={[0, 0, 5]}
            rotation={[Math.PI / 2, 0, 0]}
            angularVelocity={[0, 0.5, 0]}
            wheelRadius={0.3}
          />
          <Plane color={'black'} />
        </Physics>
        <Suspense fallback={null}>
          <Environment preset='night' />
          {/*      <Character />  */}
        </Suspense>
        {/*         <OrbitControls /> */}
        <Stars />
      </Canvas>
    </div>
  );
};

export default App;
