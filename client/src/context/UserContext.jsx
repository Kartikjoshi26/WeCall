import { createContext, useContext, useState } from "react";
export const UserContext = createContext(null);

const UserProvider = ({ children }) => {
  const [myname, setMyName] = useState(null);
  const [remoteName, setRemoteName] = useState(null);
  const [list, setlist] = useState([]);
  const [hangUp, sethangUp] = useState(false);

  return (
    <UserContext.Provider
      value={{
        hangUp,
        sethangUp,
        list,
        setlist,
        myname,
        setMyName,
        remoteName,
        setRemoteName,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserProvider;
