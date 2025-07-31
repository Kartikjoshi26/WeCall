import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import { useSocket } from "../context/SocketProvider";
import { usePeer } from "../context/Peer";
import { useUser } from "../context/UserContext";

const Room = () => {
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteUser, setRemoteUser] = useState("");
  const [isOfferSent, setIsOfferSent] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const hangUpRef = useRef(false);
  const navigate = useNavigate();
  const calleeTimeoutRef = useRef(null);

  const { socket } = useSocket();
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAns,
    sendStream,
    addIceCandidate,
    myStream: contextStream,
    roomId,
    remoteId,
    setRoomId,
    setRemoteId,
  } = usePeer();

  const {
    hangUp,
    sethangUp,
    list,
    setlist,
    myname,
    setMyName,
    remoteName,
    setRemoteName,
  } = useUser();

  // Set myStream from context when available
  useEffect(() => {
    if (contextStream) {
      setMyStream(contextStream);
    }
  }, [contextStream]);

  // Handle callee joined event (Caller receives this)
  const handleCalleeJoined = useCallback(
    async ({ calleeEmail }) => {
      setRemoteUser(calleeEmail);

      try {
        const offer = await createOffer();

        socket.emit("offer-created", {
          roomId,
          calleeEmail,
          offer,
        });
        setIsOfferSent(true);
      } catch (error) {
        console.error("Error creating offer:", error);
        alert("Something went wrong");
        navigate(`/User`);
      }
    },
    [createOffer, socket, roomId]
  );

  // Handle offer received event (Callee receives this)
  const handleOfferReceived = useCallback(
    async ({ callerEmail, offer }) => {
      clearTimeout(calleeTimeoutRef.current);
      setRemoteUser(callerEmail);

      try {
        const answer = await createAnswer(offer);

        socket.emit("answer-created", {
          roomId,
          callerEmail,
          answer,
        });
      } catch (error) {
        console.error("Error creating answer:", error);
        alert("Something went wrong");
        navigate(`/User`);
      }
    },
    [createAnswer, socket, roomId]
  );

  // Handle answer received event (Caller receives this)
  const handleAnswerReceived = useCallback(
    async ({ answer }) => {
      clearTimeout(calleeTimeoutRef.current);

      try {
        await setRemoteAns(answer);

      } catch (error) {
        console.error("Error setting remote answer:", error);
        alert("Something went wrong");
        navigate(`/User`);
      }
    },
    [setRemoteAns]
  );

  // Handle ICE candidates
  const handleIceCandidate = useCallback(
    async ({ candidate }) => {

      try {
        await addIceCandidate(candidate);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
        alert("Something went wrong");
        navigate(`/User`);
      }
    },
    [addIceCandidate]
  );

  // Handle remote stream
  const handleTrackEvent = useCallback((event) => {
    const [stream] = event.streams;
    setRemoteStream(stream);
  }, []);

  // handle hangup button
  const handleHangUp = useCallback(() => {
    socket.emit("hang-up", { roomId, remoteUser, myname });
    sethangUp(true);
    hangUpRef.current = true;
    setMyStream(null);
    setRemoteUser("");
    setRemoteStream(null);
    alert("Call ended.");
    navigate(`/User`);
  }, [roomId, remoteUser, socket, peer]);

  // handle remote hangup button
  const handleUserHangUp = useCallback(
    ({ myname }) => {
      alert(`User ${myname} has hung up.`);
      setMyStream(null);
      setRemoteUser("");
      setRemoteStream(null);
      navigate(`/User`);
    },
    [remoteUser, roomId, socket, peer]
  );

  const handleUserRefresh = useCallback(({ message }) => {
    alert(`${message} or disconnected, please try again`);
    setRemoteStream(null);
    setRemoteUser("");
    navigate("/User");
  });

  const handleUserUnavailable = useCallback(() => {
    alert("User unavailable this time, call later");
    setRemoteUser("");

    navigate("/User");
  });

  // peer connection event listeners
  useEffect(() => {
    // Listen for remote tracks
    peer.addEventListener("track", handleTrackEvent);

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate && remoteUser) {
        socket.emit("ice-candidate", {
          roomId,
          targetEmail: remoteUser,
          candidate: event.candidate,
        });
      }
    };

    return () => {
      peer.removeEventListener("track", handleTrackEvent);
      peer.onicecandidate = null;
    };
  }, [peer, socket, roomId, remoteUser, handleTrackEvent]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("active-users", (list) => {
      setlist(list);
    });

    // Caller listens for callee joined
    socket.on("callee-joined", handleCalleeJoined);

    // Callee listens for offer
    socket.on("offer-received", handleOfferReceived);

    // Caller listens for answer
    socket.on("answer-received", handleAnswerReceived);

    // Both listen for ICE candidates
    socket.on("ice-candidate", handleIceCandidate);

    // user hangup
    socket.on("user-hung-up", handleUserHangUp);

    // user not-active or unavailable
    socket.on("user-unavailable", handleUserUnavailable);

    socket.on("user-reject", ({ calleeUser }) => {
      clearTimeout(calleeTimeoutRef.current);
      alert(`${calleeUser} has rejected your call `);
      setRoomId(null);
      setRemoteId(null);
      setRemoteName(null);
      navigate("/User");
    });

    socket.on("user-refresh", handleUserRefresh);

    return () => {
      socket.off("callee-joined");
      socket.off("offer-received");
      socket.off("answer-received");
      socket.off("ice-candidate");
      socket.off("user-hung-up");
      socket.off("user-reject");
      socket.off("active-users");
      socket.off("user-refresh");
      socket.off("user-unavailable");
    };
  }, [
    socket,
    handleCalleeJoined,
    handleOfferReceived,
    handleAnswerReceived,
    handleIceCandidate,
    handleUserHangUp,
    handleUserUnavailable,
  ]);

  // user refersh the page
  useEffect(() => {
    if (roomId) localStorage.setItem("roomId", roomId);
    if (remoteUser) localStorage.setItem("remoteUser", remoteUser);
  }, [roomId, remoteUser]);

  useEffect(() => {
    if (!roomId || !contextStream) {
      alert("You refreshed or lost the session. Returning to dashboard.");
      navigate("/User");
    }
  }, [roomId, contextStream]);

  useEffect(() => {
    return () => {
      if (hangUpRef.current === false) {
        const roomId = localStorage.getItem("roomId");
        const remoteUser = localStorage.getItem("remoteUser");

        if (roomId && remoteUser && socket) {
          socket.emit("user-refresh", {
            roomId,
            targetEmail: remoteUser,
          });
        }

        setMyStream(null);
        setRemoteStream(null);
        setRemoteUser("");
      }
    };
  }, [hangUp, peer]);

  useEffect(() => {
    const handleUnloadOrBack = () => {
      if (hangUpRef.current === false) {
        const roomId = localStorage.getItem("roomId");
        const remoteUser = localStorage.getItem("remoteUser");

        if (roomId && remoteUser && socket) {
          socket.emit("user-refresh", {
            roomId,
            targetEmail: remoteUser,
          });
        }
        sethangUp(false);
      }
    };

    window.addEventListener("beforeunload", handleUnloadOrBack);

    return () => {
      window.removeEventListener("beforeunload", handleUnloadOrBack);
    };
  }, [socket, hangUp]); 

  const toggleAudio = () => {
    if (myStream) {
      const audioTracks = myStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      } else {
        alert(
          "No audio track found. Please ensure microphone access is granted."
        );
      }
    } else {
      alert("Please allow microphone access to use audio features.");
    }
  };

  const toggleVideo = () => {
    if (myStream) {
      const videoTracks = myStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      } else {
        alert("No video track found. Please ensure camera access is granted.");
      }
    } else {
      alert("Please allow camera access to use video features.");
    }
  };

  useEffect(() => {
    if (isOfferSent == false) {
      calleeTimeoutRef.current = setTimeout(() => {
        alert("Callee did not join in time. Returning to dashboard.");

        socket.emit("miss-call", {
          targetEmail: remoteId,
        });

        setRemoteUser("");
        setRemoteId(null);
        setRoomId(null);
        setRemoteName(null);
        setMyStream(null);
        setRemoteStream(null);

        localStorage.removeItem("roomId");
        localStorage.removeItem("remoteUser");

        navigate("/User");
      }, 25000); // 25 seconds
    }

    return () => {
      clearTimeout(calleeTimeoutRef.current);
    };
  }, [isOfferSent, socket]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-2xl font-semibold mb-2">Welcome to WeCall App</h1>
      <h4 className="text-gray-600 mb-6">
        You are connected to <span className="font-medium">{remoteName}</span>
      </h4>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow w-full md:w-80 flex flex-col items-center">
          <h3 className="mb-2 text-lg font-medium">My Video</h3>
          {myStream ? (
            <ReactPlayer
              url={myStream}
              playing
              muted
              width="100%"
              height="200px"
            />
          ) : (
            <div className="w-full h-[200px] bg-gray-300 flex items-center justify-center text-sm text-gray-700">
              No Video
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow w-full md:w-80 flex flex-col items-center">
          <h3 className="mb-2 text-lg font-medium">{remoteName}'s Video</h3>
          {remoteStream ? (
            <ReactPlayer
              url={remoteStream}
              playing
              width="100%"
              height="200px"
            />
          ) : (
            <div className="w-full h-[200px] bg-gray-300 flex items-center justify-center text-sm text-gray-700">
              No Video
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={toggleAudio}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          {isAudioMuted ? "Unmute Mic" : "Mute Mic"}
        </button>
        <button
          onClick={toggleVideo}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          {isVideoMuted ? "Turn On Camera" : "Turn Off Camera"}
        </button>
      </div>

      <br />
      <button
        onClick={handleHangUp}
        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded shadow"
      >
        Hang Up
      </button>

      <div className="mt-8 pt-4 border-t text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Make sure your camera and microphone are allowed.</li>
          <li>
            If the Callee will not join in 25 secs then your call will end
            automatically
          </li>
          <li>Wait for the other user to join before leaving the call.</li>
          <li>
            Make sure to not refresh the page, your call session will end
            automatically
          </li>
          <li>Use the Hang Up button to leave the call.</li>
        </ul>
      </div>
    </div>
  );
};

export default Room;
