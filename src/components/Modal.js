import React from 'react';

function Modal({children}) {
  return (
    <div className='min-w-screen h-screen animated fadeIn faster  fixed  left-0 top-0 flex justify-center items-center inset-0 z-50 outline-none focus:outline-none bg-no-repeat bg-center bg-cover'>
      <div className='absolute bg-black opacity-80 inset-0 z-0'></div>
      <div className='w-56 text-center max-w-lg p-5 relative mx-auto my-auto rounded-xl shadow-lg  bg-white '>
        {children}
      </div>
    </div>
  );
}

export default Modal;
