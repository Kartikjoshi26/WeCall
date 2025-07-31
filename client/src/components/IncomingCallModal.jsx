import React from "react";

const IncomingCallModal = ({ caller, roomId,UserInContacts, onAccept, onReject }) => {
  return (
    <div style={{
      position: "fixed",
      top: "30%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      padding: "20px",
      backgroundColor: "#fff",
      border: "2px solid #333",
      boxShadow: "0px 0px 20px rgba(0,0,0,0.2)",
      zIndex: 1000
    }}>
      <h3>📞 Incoming Call</h3>
      <p><strong>{caller}</strong> is calling you.</p>
      {UserInContacts ? null : <p>This user is not in your contact list</p>}

      <div style={{ marginTop: "15px" }}>
        <button onClick={onAccept} style={{ marginRight: "10px", background: "#4CAF50", color: "#fff", padding: "10px 15px" }}>
          Accept
        </button>
        <button onClick={onReject} style={{ background: "#f44336", color: "#fff", padding: "10px 15px" }}>
          Reject
        </button>
      </div>
    </div>
  );
};

export default IncomingCallModal;
