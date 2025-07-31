import { createContext, useContext, useState } from "react";
import { io } from "socket.io-client";
const apiUrl = import.meta.env.VITE_API_URL;

const SocketContext = createContext();

let socketInstance = null; 

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  const connectSocket = () => {
    if (!socketInstance) {
      socketInstance = io(`${apiUrl}`, { withCredentials: true });
      setSocket(socketInstance);
    }
    return socketInstance;
  };

  const disconnectSocket = () => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      setSocket(null);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connectSocket, disconnectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketProvider;
