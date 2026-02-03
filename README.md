# WeCall 📞

**WeCall** is a full-stack real-time communication web application that enables users to connect through **audio/video calls**.

The application uses **WebRTC** for peer-to-peer media streaming, **Socket.IO** for signaling and real-time events, **JWT** for authentication and **MongoDB** to manage user identities and related data.
The project is built with a **React + Vite frontend** and a **Node.js + Socket.IO backend**, enabling low-latency, real-time interactions.
---

## Features

- 📹 Real-time **audio & video calling** using WebRTC
- 🔁 WebRTC signaling via Socket.IO
- 🧑 User identity management using MongoDB
- ⚡ Fast frontend built with React + Vite
- 🌐 Real-time client–server communication
- 🔐 Environment-based configuration

---


##  Project Structure
wecall/
└── app_call/
    ├── client/   # Frontend (React + Vite + WebRTC)
    └── server/   # Backend (Node.js + Socket.IO + MongoDB)

---


## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- WebRTC (RTCPeerConnection, MediaStreams)
- Socket.IO Client
- Tailwind CSS

### Backend
- Node.js
- Express
- Socket.IO (signaling server)
- MongoDB (user IDs & metadata)
- Mongoose
- bcrypt (password hashing)
- JWT (authentication & authorization)

---

## Prerequisites

- **Node.js** (v16 or later)
- **npm / yarn**
- **MongoDB** (local or Atlas)
- **Git**

---

## Installation & Setup

1️- Clone the Repository
```bash
git clone https://github.com/Kartikjoshi26/WeCall.git
cd WeCall/app_call
```

2️-  Backend Setup (Server)
cd server
npm install


Create a .env file in server/:

- PORT=5000
- MONGO_URI=mongodb://localhost:27017/wecall
- CLIENT_URL=http://localhost:5173


Start the server:

npm start


Server runs on:

http://localhost:5000

3️-  Frontend Setup (Client)
cd ../client
npm install
npm run dev


Frontend runs on:

http://localhost:5173

## 🔄 How It Works

Users are identified and stored in MongoDB

Clients connect to the signaling server using Socket.IO

WebRTC exchanges:

SDP offers/answers

ICE candidates

Peer-to-peer audio/video stream is established

Socket.IO maintains real-time events and room state

🧪 Development Notes

WebRTC handles media streaming

Socket.IO handles signaling & room coordination

MongoDB stores user IDs and metadata

Vite enables fast HMR during development

🔐 Security
- Passwords are hashed using bcrypt
- Authentication handled via JWT

