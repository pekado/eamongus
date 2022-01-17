import React, { useState } from 'react';

const Form = ({ setUser }) => {
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
  });
  const [status, setStatus] = useState({
    error: false,
    loading: false,
  });

  const handleInput = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    setStatus({
      loading: true,
      error: false,
    });
    if (userInfo.username && userInfo.email) {
      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
    } else {
      setStatus({
        loading: false,
        error: true,
      });
    }
  };
  return (
    <div className='min-w-screen h-screen animated fadeIn faster  fixed  left-0 top-0 flex justify-center items-center inset-0 z-50 outline-none focus:outline-none bg-no-repeat bg-center bg-cover'>
      <div className='absolute bg-black opacity-80 inset-0 z-0'></div>
      <div className='w-56 text-center max-w-lg p-5 relative mx-auto my-auto rounded-xl shadow-lg  bg-white '>
        <form onSubmit={handleCreate}>
          <h1>You don't have a username yet, add one!</h1>
          <input
            className='block border-2 rounded my-4 w-full p-2'
            placeholder='Name'
            type='text'
            name='username'
            onChange={(e) => handleInput(e)}
          />
          <input
            className='block border-2 rounded my-4 w-full p-2'
            placeholder='Email'
            type='email'
            name='email'
            onChange={(e) => handleInput(e)}
          />
          {!status.loading ? (
            <button
              className='mx-auto block bg-gray-500 rounded w-24 text-white'
              type='submit'
            >
              Create
            </button>
          ) : (
            <p>...loading</p>
          )}
          {status.error && (
            <h2 className='text-red-700 py-2'>Fill the form please</h2>
          )}
        </form>
      </div>
    </div>
  );
};

export default Form;
