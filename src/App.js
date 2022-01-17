import { useEffect } from 'react';
import { useState } from 'react/cjs/react.development';
/* import Character from './3D/Character'; */
import THREE from './3D/three';
import './App.css';
import Form from './Form';

const App = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  const scene = new THREE.Scene();
  const playerCar = Car();
  scene.add(playerCar);

  //lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position(100, -300, 400);
  scene.add(dirLight);

  //camera
  const aspectRatio = window.innerWidth / window.innerHeight;
  const cameraWidth = 150;
  const cameraHeight = cameraWidth / cameraHeight;

  const camera = new THREE.OrthographicCamera(
    cameraWidth / -2, //left
    cameraWidth / 2, //right
    cameraHeight / 2, //top
    cameraHeight / -2, //bottom
    0, //near plane
    100 //bottom
  );
  camera.position.set(200, -200, 300);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);
  //render
  const renderer = new THREE.WebGL1Renderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.render(scene, camera);

  document.body.append(renderer.domElement);

  return (
    <>
      <div className='App'>{!user.username && <Form setUser={setUser} />}</div>
    </>
  );
};

export default App;
