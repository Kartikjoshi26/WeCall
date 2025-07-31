import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { UserIcon } from "@heroicons/react/solid";
import IncomingCallModal from "../components/IncomingCallModal";
import SearchBar from "../components/SearchBar";
import { useSocket } from "../context/SocketProvider";
import { usePeer } from "../context/Peer";
import { useUser } from "../context/UserContext";
const apiUrl = import.meta.env.VITE_API_URL;

const User = () => {
  const [user, setuser] = useState([]);
  const [users, setUsers] = useState([]);
  const [socketid, setsocketid] = useState("");
  const [toggle, settoggle] = useState(false);
  const [error, setError] = useState("");
  const [isAdded, setIsAdded] = useState(false);
  const [recentlyRemovedEmail, setRecentlyRemovedEmail] = useState(null);
  const [UserInContacts, setUserInContacts] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAns,
    sendStream,
    addIceCandidate,
    updatestream,
    setRoomId,
    setRemoteId,
  } = usePeer();
  const { socket, connectSocket, disconnectSocket } = useSocket();
  const { list, setlist, remoteName, setMyName, setRemoteName } = useUser();

  const navigate = useNavigate();

  const Socket = useRef(null);
  const usersRef = useRef([]);
  const listref = useRef([]);

  useEffect(() => {
    Socket.current = connectSocket();

    Socket.current.on("idExchange", (id) => {
      setsocketid(id);
    });

    Socket.current.on("active-users", (list) => {
      setlist(list);
    });

    Socket.current.on(
      "incoming-call",
      ({ callerEmail, callerName, roomId }) => {
        setIncomingCall({ callerEmail, callerName, roomId });
        setRemoteName(callerName); 
        const isInContacts = usersRef.current.some(
          (user) => user.email === callerEmail
        );
        setUserInContacts(isInContacts); 
        settoggle(false);
      }
    );

    Socket.current.on("miss-call", handleMissCall);

    return () => {
      Socket.current.off("incoming-call");
      Socket.current.off("idExchange");
      Socket.current.off("active-users");
      Socket.current.off("miss-call");
    };
  }, [socket]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/users`, {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            alert("Session expired. Please log in again.");
            navigate("/UserLogin"); 
          }
          setError(data.message || "Failed to fetch users");
          throw new Error("Failed to fetch users");
        }

        setUsers(data.message_data.contacts);
        setuser(data.message_data.userName);
        setMyName(data.message_data.userName.name); 
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUsers();
  }, [isAdded]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    listref.current = list;
  }, [list]);

  const handleCall = useCallback(
    async (userName, calleeEmail) => {
      try {
        if (!list.includes(calleeEmail)) {
          alert("User is not available, try again after sometime");
          settoggle(false);
        } else {
          settoggle(true);
          setRemoteName(userName); 
          const roomId = uuidv4();
          setRoomId(roomId);
          setRemoteId(calleeEmail);

          // Get user media stream first
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });

          updatestream(stream);
          sendStream(stream);

          // Send call request
          Socket.current.emit("call-request", {
            from: user.email,
            to: calleeEmail,
            callerName: user.name,
            roomId,
          });

          navigate(`/Room/${roomId}`);
        }
      } catch (error) {
        settoggle(false);
      }
    },
    [user, list, setRoomId, setRemoteId, updatestream, sendStream]
  );

  const handleLogOut = () => {
    disconnectSocket();
    navigate("/UserLogin");
  };

  const handleRemove = useCallback(async (email) => {
    const res = await fetch(`${apiUrl}/api/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email: email }),
    });

    const data = await res.json();


    if (res.ok && data.success) {
      alert("User removed from the Contact List");
      setIsAdded((prev) => !prev); 
      setRecentlyRemovedEmail(email);
    } else {
      if (res.status === 401) {
        alert("Session expired. Please log in again.");
        navigate("/UserLogin"); 
      }
      setError(data.message || "Failed to remove user");
    }
  }, []);

  const callRejectHandler = useCallback(() => {
    if (!socket) return;
    try {
      Socket.current.emit("user-reject", {
        callerUser: incomingCall.callerEmail,
        calleeUser: user.email,
      });
    } catch (error) {
      setError("Something went wrong, try again after sometime");
    }
  }, [socket, incomingCall, user]);

  const handleMissCall = () => {
    setIncomingCall(null);
    setRoomId(null);
    setRemoteName(null);
    alert("Miss Call");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="block text-l text-gray-700 mb-1">
          <SearchBar
            onContactAdded={() => setIsAdded((prev) => !prev)}
            removedEmail={recentlyRemovedEmail}
            onResetRemovedEmail={() => setRecentlyRemovedEmail(null)}
          />
        </div>

        <div className="bg-fuchsia-50 p-4 rounded-md shadow-sm">
          <h1 className="text-xl font-semibold text-indigo-800 mb-2">
            Welcome, {user.name}
          </h1>

          {users.length === 0 ? (
            <p className="text-gray-600">
              No users found. Please add contacts.
            </p>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-black-700 mb-8 mt-5">
                Your Contacts
              </h2>
              <ul className="space-y-4">
                {users.map((user, idx) => (
                  <li
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-cyan-100 p-3 rounded-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <UserIcon className="h-5 w-5 text-gray-700" />
                      <strong className="text-gray-900">{user.name}</strong>
                      <span
                        className={`text-sm ${
                          list.includes(user.email)
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        ● {list.includes(user.email) ? "Active" : "Offline"}
                      </span>
                    </div>
                    <div className="mt-2 sm:mt-0 flex gap-3">
                      <button
                        onClick={() => handleCall(user.name, user.email)}
                        disabled={toggle}
                        className="text-emerald-700 bg-emerald-300 px-4 py-1  rounded-md hover:bg-emerald-200"
                      >
                        {toggle && user.name == remoteName
                          ? "Calling..."
                          : "Call"}
                      </button>
                      <button
                        onClick={() => handleRemove(user.email)}
                        className="text-red-700 bg-red-400 px-4 py-1 rounded-md hover:bg-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={handleLogOut}
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900"
          >
            Log Out
          </button>
        </div>

        {incomingCall && (
          <IncomingCallModal
            caller={incomingCall.callerName}
            roomId={incomingCall.roomId}
            UserInContacts={UserInContacts}
            onAccept={async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({
                  video: true,
                  audio: true,
                });

                updatestream(stream);
                sendStream(stream);
                setRoomId(incomingCall.roomId);
                setRemoteId(incomingCall.callerEmail);

                Socket.current.emit("callee-joined", {
                  callerEmail: incomingCall.callerEmail,
                  calleeEmail: user.email,
                  roomId: incomingCall.roomId,
                });

                navigate(`/Room/${incomingCall.roomId}`);
              } catch (error) {
                console.error("Error accepting call:", error);
              }
            }}
            onReject={() => {
              setIncomingCall(null);
              callRejectHandler();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default User;
