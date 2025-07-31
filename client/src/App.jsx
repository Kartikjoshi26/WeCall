import { useState, useEffect } from "react";
import { UserContext } from "./context/UserContext";
import SocketProvider from "./context/SocketProvider";
import UserProvider from "./context/UserContext";
import { PeerProvider } from "./context/Peer";

import { Routes, Route, useNavigate } from "react-router-dom";

import "./App.css";
import User from "./components/User";
import Room from "./components/Room";
import UserLogin from "./components/UserLogin";
import Signup from "./components/Signup";

function App() {
  return (
    <>
      <UserProvider>
        <SocketProvider>
          <PeerProvider>
            <Routes>
              <Route path="/" element={<Signup />} />
              <Route path="/User" element={<User />}></Route>
              <Route path="/UserLogin" element={<UserLogin />}></Route>
              <Route path="/Room/:ID" element={<Room />}></Route>
            </Routes>
          </PeerProvider>
        </SocketProvider>
      </UserProvider>
    </>
  );
}

export default App;
