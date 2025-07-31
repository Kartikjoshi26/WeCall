import React, { useMemo, useState, createContext, useContext } from "react";

const PeerContext = createContext(null);

export const usePeer = () => useContext(PeerContext);

export const PeerProvider = ({ children }) => {
  const [myStream, setMyStream] = useState(null);
  const [roomId, updateRoomId] = useState(null);
  const [remoteId, updateRemoteId] = useState(null);

  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      }),
    []
  );

  const createOffer = async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  };

  const createAnswer = async (offer) => {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(new RTCSessionDescription(answer));
    return answer;
  };

  const setRemoteAns = async (answer) => {
    await peer.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const sendStream = (stream) => {
    for (const track of stream.getTracks()) {
      peer.addTrack(track, stream);
    }
  };

  const updatestream = (stream) => {
    if (stream) {
      setMyStream(stream);
    }
  };

  const setRoomId = (id) => {
    if (id) {
      updateRoomId(id);
    }
  };

  const setRemoteId = (id) => {
    if (id) {
      updateRemoteId(id);
    }
  };

  const addIceCandidate = async (candidate) => {
    try {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Failed to add ICE Candidate", err);
    }
  };

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAns,
        sendStream,
        addIceCandidate,
        myStream,
        updatestream,
        roomId,
        setRoomId,
        remoteId,
        setRemoteId,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};
