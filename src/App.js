import React, {useEffect, useState} from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Stage1 from './pages/Stage-1';
import Stage2 from './pages/Stage-2';
import Form from './Form';

export default function App() {
  const [user, setUser] = useState({});

  useEffect(() => {
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  return (
    <>
      {!user.username && <Form setUser={setUser} />}
      <BrowserRouter>
        <Routes>
          <Route path='stage1' element={<Stage1 />} />
          <Route path='stage2' element={<Stage2 />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
