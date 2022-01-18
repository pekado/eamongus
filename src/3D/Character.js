import React from 'react';

const Character = () => {
  return (
    <mesh>
      <sphereGeometry />
      <meshBasicMaterial color={'green'} wireframe />
    </mesh>
  );
};

export default Character;
