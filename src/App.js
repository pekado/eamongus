import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import './App.css';
import Form from './Form';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import Ground from './3D/Ground';
import { Physics } from '@react-three/cannon';
import Vehicle from './3D/Vehicle';

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
      <Canvas dpr={[1, 1.5]} shadows camera={{ position: [0, 5, 15], fov: 50 }}>
        <fog attach='fog' args={['#171720', 10, 50]} />
        <color attach='background' args={['#171720']} />
        <ambientLight intensity={0.1} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.5}
          intensity={1}
          castShadow
          penumbra={1}
        />
        {/*         <Character /> */}
        <Physics>
          <Ground />
          <Vehicle
            position={[0, 2, 0]}
            rotation={[0, -Math.PI / 4, 0]}
            angularVelocity={[0, 0.5, 0]}
            wheelRadius={0.3}
          />
        </Physics>
        <Suspense fallback={null}>
          <Environment preset='night' />
        </Suspense>
        <OrbitControls />
        <Stars />
      </Canvas>
    </div>
  );
};

export default App;
