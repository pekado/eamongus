'use strict';
import {useEffect, useState, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import '../App.css';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import Stats from 'stats.js';
import equal from 'fast-deep-equal';
import {GUI} from 'dat.gui';
import {MeshBVH, MeshBVHVisualizer} from 'three-mesh-bvh';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import Modal from '../components/Modal';

const Stage1 = () => {
  const mountRef = useRef(null);
  const [isModal, setIsModal] = useState(false);
  const [openCheckpoint, setOpenCheckpoint] = useState({});
  let checkpoints = [
    {
      url: 'https://uselessfacts.jsph.pl/random.json',
      number: 0,
    },
    {
      url: 'https://uselessfacts.jsph.pl/random.json',
      number: 1,
    },
  ];

  const params = {
    firstPerson: false,
    displayCollider: false,
    displayBVH: false,
    visualizeDepth: 10,
    gravity: -30,
    playerSpeed: 10,
    physicsSteps: 5,
    reset: reset,
  };

  let renderer,
    camera,
    scene,
    clock,
    gui,
    stats,
    playerPositionClone,
    cubeA,
    cubeB,
    cubeC;
  let environment, collider, visualizer, player, controls;
  let playerIsOnGround = false;
  let fwdPressed = false,
    bkdPressed = false,
    lftPressed = false,
    rgtPressed = false;
  let playerVelocity = new THREE.Vector3();
  let upVector = new THREE.Vector3(0, 1, 0);
  let tempVector = new THREE.Vector3();
  let tempVector2 = new THREE.Vector3();
  let tempBox = new THREE.Box3();
  let tempMat = new THREE.Matrix4();
  let tempSegment = new THREE.Line3();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
  const navigate = useNavigate();

  function init() {
    const bgColor = 0x263238 / 2;

    // renderer setup
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(bgColor, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    mountRef.current.appendChild(renderer.domElement);

    // scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(bgColor, 20, 70);

    // lights
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1.5, 1).multiplyScalar(50);
    light.shadow.mapSize.setScalar(2048);
    light.shadow.bias = -1e-4;
    light.shadow.normalBias = 0.05;
    light.castShadow = true;

    const shadowCam = light.shadow.camera;
    shadowCam.bottom = shadowCam.left = -30;
    shadowCam.top = 30;
    shadowCam.right = 45;

    scene.add(light);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 0.4));

    // camera setup
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      50
    );
    camera.position.set(10, 10, -10);
    camera.far = 100;
    camera.updateProjectionMatrix();
    window.camera = camera;

    clock = new THREE.Clock();

    controls = new OrbitControls(camera, renderer.domElement);

    // stats setup
    stats = new Stats();
    document.body.appendChild(stats.dom);

    loadColliderEnvironment();

    //cubes

    cubeA = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({color: 'blue'})
    );
    cubeB = new THREE.Mesh(geometry, material);
    cubeC = new THREE.Mesh(geometry, material);
    cubeA.position.set(-3, 1, 1);
    cubeB.position.set(15, 6, -3);
    cubeC.position.set(20, 6, -3);

    //create a group and add the two cubes
    //These cubes can now be rotated / scaled etc as a group
    const group = new THREE.Group();
    group.add(cubeA);
    group.add(cubeB);
    group.add(cubeC);

    scene.add(group);

    // character
    player = new THREE.Mesh(
      new RoundedBoxGeometry(1.0, 2.0, 1.0, 10, 0.5),
      new THREE.MeshStandardMaterial()
    );
    player.geometry.translate(0, -0.5, 0);
    player.capsuleInfo = {
      radius: 0.5,
      segment: new THREE.Line3(
        new THREE.Vector3(),
        new THREE.Vector3(0, -1.0, 0.0)
      ),
    };
    player.castShadow = true;
    player.receiveShadow = true;
    player.material.shadowSide = 2;
    scene.add(player);
    reset();

    // dat.gui
    gui = new GUI();
    gui.add(params, 'firstPerson').onChange((v) => {
      if (!v) {
        camera.position
          .sub(controls.target)
          .normalize()
          .multiplyScalar(10)
          .add(controls.target);
      }
    });

    const visFolder = gui.addFolder('Visualization');
    visFolder.add(params, 'displayCollider');
    visFolder.add(params, 'displayBVH');
    visFolder.add(params, 'visualizeDepth', 1, 20, 1).onChange((v) => {
      visualizer.depth = v;
      visualizer.update();
    });
    visFolder.open();

    const physicsFolder = gui.addFolder('Player');
    physicsFolder.add(params, 'physicsSteps', 0, 30, 1);
    physicsFolder.add(params, 'gravity', -100, 100, 0.01).onChange((v) => {
      params.gravity = parseFloat(v);
    });
    physicsFolder.add(params, 'playerSpeed', 1, 20);
    physicsFolder.open();

    gui.add(params, 'reset');
    gui.open();

    window.addEventListener(
      'resize',
      function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      false
    );

    window.addEventListener('keydown', function (e) {
      switch (e.code) {
        case 'KeyW':
          fwdPressed = true;
          break;
        case 'KeyS':
          bkdPressed = true;
          break;
        case 'KeyD':
          rgtPressed = true;
          break;
        case 'KeyA':
          lftPressed = true;
          break;
        case 'Space':
          if (playerIsOnGround) {
            playerVelocity.y = 10.0;
          }

          break;
      }
    });

    window.addEventListener('keyup', function (e) {
      switch (e.code) {
        case 'KeyW':
          fwdPressed = false;
          break;
        case 'KeyS':
          bkdPressed = false;
          break;
        case 'KeyD':
          rgtPressed = false;
          break;
        case 'KeyA':
          lftPressed = false;
          break;
      }
    });
  }

  function loadColliderEnvironment() {
    new GLTFLoader().load('./rooms_new.glb', (res) => {
      environment = res.scene;
      environment.scale.setScalar(2);

      const pointLight = new THREE.PointLight(0xffffff);
      pointLight.distance = 7;
      pointLight.position.set(0, 50, 0);
      environment.add(pointLight);

      const porchLight = new THREE.PointLight(0xffffff);
      porchLight.distance = 15;
      porchLight.intensity = 5;
      porchLight.position.set(0, 100, 135);
      porchLight.shadow.normalBias = 1e-2;
      porchLight.shadow.bias = -1e-3;
      porchLight.shadow.mapSize.setScalar(1024);
      porchLight.castShadow = true;

      environment.add(porchLight);

      // collect all geometries to merge
      const geometries = [];
      environment.updateMatrixWorld(true);
      environment.traverse((c) => {
        if (c.geometry) {
          const cloned = c.geometry.clone();
          cloned.applyMatrix4(c.matrixWorld);
          for (const key in cloned.attributes) {
            if (key !== 'position') {
              cloned.deleteAttribute(key);
            }
          }

          geometries.push(cloned);
        }
      });

      // create the merged geometry
      const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
        geometries,
        false
      );
      mergedGeometry.boundsTree = new MeshBVH(mergedGeometry);

      collider = new THREE.Mesh(mergedGeometry);
      collider.material.wireframe = true;
      collider.material.opacity = 0.5;
      collider.material.transparent = true;

      visualizer = new MeshBVHVisualizer(collider, params.visualizeDepth);
      scene.add(visualizer);
      scene.add(collider);
      scene.add(environment);

      environment.traverse((c) => {
        if (c.material) {
          c.castShadow = true;
          c.receiveShadow = true;
          c.material.shadowSide = 2;
        }
      });
    });
  }

  function reset() {
    playerVelocity.set(0, 0, 0);
    player.position.set(12, 20, -9);
    camera.position.sub(controls.target);
    controls.target.copy(player.position);
    camera.position.add(player.position);
    controls.update();
  }

  //modal logic
  async function showModal(checkpoint) {
    if (isModal) return;
    if (!checkpoint) return;
    setIsModal(true);
    setOpenCheckpoint(checkpoint);
  }

  function hideModal() {
    setOpenCheckpoint({});
    setIsModal(false);
  }

  function updatePlayer(delta) {
    playerPositionClone = {
      x: Math.floor(player.position.x),
      y: Math.floor(player.position.y),
      z: Math.floor(player.position.z),
    };
    //open modal based in position (checkpoints)
    if (!checkpoints.length) {
      cubeA.material = material;
      equal(playerPositionClone, {x: -3, y: 1, z: 1}) && navigateTo('/stage2');
    }

    if (equal(playerPositionClone, {x: 15, y: 7, z: -4})) {
      const currentCheckpoint = checkpoints.find(
        (checkpoint) => checkpoint.number === 0
      );
      showModal(currentCheckpoint);
      checkpoints = checkpoints.filter((checkpoint) => checkpoint.number !== 0);
      cubeB.material = new THREE.MeshBasicMaterial({color: 'red'});
    }
    if (equal(playerPositionClone, {x: 20, y: 7, z: -4})) {
      const currentCheckpoint = checkpoints.find(
        (checkpoint) => checkpoint.number === 1
      );
      showModal(currentCheckpoint);
      checkpoints = checkpoints.filter((checkpoint) => checkpoint.number !== 1);
      cubeC.material = new THREE.MeshBasicMaterial({color: 'red'});
    }

    playerVelocity.y += playerIsOnGround ? 0 : delta * params.gravity;
    player.position.addScaledVector(playerVelocity, delta);
    // move the player
    const angle = controls.getAzimuthalAngle();

    if (fwdPressed) {
      tempVector.set(0, 0, -1).applyAxisAngle(upVector, angle);
      player.position.addScaledVector(tempVector, params.playerSpeed * delta);
    }

    if (bkdPressed) {
      tempVector.set(0, 0, 1).applyAxisAngle(upVector, angle);
      player.position.addScaledVector(tempVector, params.playerSpeed * delta);
    }

    if (lftPressed) {
      tempVector.set(-1, 0, 0).applyAxisAngle(upVector, angle);
      player.position.addScaledVector(tempVector, params.playerSpeed * delta);
    }

    if (rgtPressed) {
      tempVector.set(1, 0, 0).applyAxisAngle(upVector, angle);
      player.position.addScaledVector(tempVector, params.playerSpeed * delta);
    }

    player.updateMatrixWorld();
    // adjust player position based on collisions
    const capsuleInfo = player.capsuleInfo;
    tempBox.makeEmpty();
    tempMat.copy(collider.matrixWorld).invert();
    tempSegment.copy(capsuleInfo.segment);

    // get the position of the capsule in the local space of the collider
    tempSegment.start.applyMatrix4(player.matrixWorld).applyMatrix4(tempMat);
    tempSegment.end.applyMatrix4(player.matrixWorld).applyMatrix4(tempMat);

    // get the axis aligned bounding box of the capsule
    tempBox.expandByPoint(tempSegment.start);
    tempBox.expandByPoint(tempSegment.end);

    tempBox.min.addScalar(-capsuleInfo.radius);
    tempBox.max.addScalar(capsuleInfo.radius);

    collider.geometry.boundsTree.shapecast({
      intersectsBounds: (box) => box.intersectsBox(tempBox),

      intersectsTriangle: (tri) => {
        // check if the triangle is intersecting the capsule and adjust the
        // capsule position if it is.
        const triPoint = tempVector;
        const capsulePoint = tempVector2;

        const distance = tri.closestPointToSegment(
          tempSegment,
          triPoint,
          capsulePoint
        );
        if (distance < capsuleInfo.radius) {
          const depth = capsuleInfo.radius - distance;
          const direction = capsulePoint.sub(triPoint).normalize();

          tempSegment.start.addScaledVector(direction, depth);
          tempSegment.end.addScaledVector(direction, depth);
        }
      },
    });

    // get the adjusted position of the capsule collider in world space after checking
    // triangle collisions and moving it. capsuleInfo.segment.start is assumed to be
    // the origin of the player model.
    const newPosition = tempVector;
    newPosition.copy(tempSegment.start).applyMatrix4(collider.matrixWorld);

    // check how much the collider was moved
    const deltaVector = tempVector2;
    deltaVector.subVectors(newPosition, player.position);

    // if the player was primarily adjusted vertically we assume it's on something we should consider ground
    playerIsOnGround =
      deltaVector.y > Math.abs(delta * playerVelocity.y * 0.25);

    const offset = Math.max(0.0, deltaVector.length() - 1e-5);
    deltaVector.normalize().multiplyScalar(offset);

    // adjust the player model
    player.position.add(deltaVector);

    if (!playerIsOnGround) {
      deltaVector.normalize();
      playerVelocity.addScaledVector(
        deltaVector,
        -deltaVector.dot(playerVelocity)
      );
    } else {
      playerVelocity.set(0, 0, 0);
    }

    // adjust the camera
    camera.position.sub(controls.target);
    controls.target.copy(player.position);
    camera.position.add(player.position);

    // if the player has fallen too far below the level reset their position to the start
    if (player.position.y < -25) {
      reset();
    }
  }
  function navigateTo(url) {
    gui.close();
    navigate(url);
  }

  function render() {
    stats.update();
    requestAnimationFrame(render);

    const delta = Math.min(clock.getDelta(), 0.1);
    if (params.firstPerson) {
      controls.maxPolarAngle = Math.PI;
      controls.minDistance = 1e-4;
      controls.maxDistance = 1e-4;
    } else {
      controls.maxPolarAngle = Math.PI / 2;
      controls.minDistance = 1;
      controls.maxDistance = 20;
    }

    if (collider) {
      collider.visible = params.displayCollider;
      visualizer.visible = params.displayBVH;

      const physicsSteps = params.physicsSteps;
      for (let i = 0; i < physicsSteps; i++) {
        updatePlayer(delta / physicsSteps);
      }
    }

    controls.update();

    renderer.render(scene, camera);
  }
  useEffect(() => {
    init();
    render();
  }, []);

  return (
    <>
      <Modal url={openCheckpoint.url} isModal={isModal}>
        <button
          className='bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded m-6'
          onClick={hideModal}
        >
          Close
        </button>
      </Modal>
      <div className='App h-full overflow-hidden'>
        <div ref={mountRef}></div>
      </div>
    </>
  );
};

export default Stage1;
