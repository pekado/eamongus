import React, {useState} from 'react';
import Modal from './components/Modal';

const Form = ({setUser}) => {
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
  });
  const [status, setStatus] = useState({
    error: false,
    loading: false,
  });

  const handleInput = (e) => {
    setUserInfo({...userInfo, [e.target.name]: e.target.value});
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
    <Modal>
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
    </Modal>
  );
};

export default Form;
