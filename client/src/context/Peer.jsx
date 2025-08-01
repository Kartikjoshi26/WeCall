import React, { useRef, useState, createContext, useContext } from "react";

const PeerContext = createContext(null);

export const usePeer = () => useContext(PeerContext);

const createPeerConnection = () =>
  new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:global.stun.twilio.com:3478",
        ],
      },
    ],
  });

export const PeerProvider = ({ children }) => {
  const [myStream, setMyStream] = useState(null);
  const [roomId, updateRoomId] = useState(null);
  const [remoteId, updateRemoteId] = useState(null);

  const peer = useRef(createPeerConnection());

  const createOffer = async () => {
    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  };

  const createAnswer = async (offer) => {
    await peer.current.setRemoteDescription(offer);
    const answer = await peer.current.createAnswer();
    await peer.current.setLocalDescription(new RTCSessionDescription(answer));
    return answer;
  };

  const setRemoteAns = async (answer) => {
    await peer.current.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const sendStream = (stream) => {
    for (const track of stream.getTracks()) {
      peer.current.addTrack(track, stream);
    }
  };

  const updatestream = (stream) => {
    if (stream) {
      setMyStream(stream);
    }
  };

  const setRoomId = (id) => {
    if (id) updateRoomId(id);
  };

  const setRemoteId = (id) => {
    if (id) updateRemoteId(id);
  };

  const addIceCandidate = async (candidate) => {
    try {
      await peer.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Something went wrong, Failed to add ICE Candidate", err);
    }
  };

  const resetPeer = () => {
    if (peer.current) peer.current.close();
    peer.current = createPeerConnection();
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
        resetPeer,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};
