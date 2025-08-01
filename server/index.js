const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./db"); // database connection
const http = require("http");
require("dotenv").config();

const StaticUsersRoute = require("./routes/StaticUsersRoute");
const User = require("./routes/User");

// cookie and toekn related stuff
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const cookie = require("cookie"); // NOT cookie-parser
const jwt = require("jsonwebtoken");

// middlewares
const { restrictToLoginUser } = require("./middleware/auth");
app.use(express.json());

// socket map
const userSocketMap = {};

const server = http.createServer(app);

const { Server } = require("socket.io");

const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const port = process.env.PORT || 3000;
connectDB();

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Routes
app.use("/api", restrictToLoginUser, StaticUsersRoute); // restrictToLoginUser,
app.use("/user", User);

// All the Socket Logic 
io.on("connection", (socket) => {
  socket.emit("idExchange", socket.id);

  const rawCookie = socket.handshake.headers.cookie;

  if (rawCookie) {
    const parsedCookies = cookie.parse(rawCookie);
    const token = parsedCookies.uid; // assuming JWT is stored in uid cookie

    if (token) {
      try {
        const user = jwt.verify(token, process.env.SECRET_KEY);

        userSocketMap[user.email] = socket.id;
        const userEmail = user.email;
        socket.email = userEmail;

        io.emit("active-users", Object.keys(userSocketMap));
      } catch (err) {
        console.error("Invalid token:", err.message);
      }
    }
  }

  socket.on("disconnect", () => {
    if (socket.email) {
      delete userSocketMap[socket.email];
    } else {
      console.error("A socket disconnected with no associated email");
    }

    io.emit("active-users", Object.keys(userSocketMap));
  });

  // Caller requests call
  socket.on("call-request", ({ from, to, callerName, roomId }) => {
    const callerSocketId = userSocketMap[from];
    const calleeSocketId = userSocketMap[to];

    if (calleeSocketId) {
      socket.join(roomId);
      socket.emit("joined", roomId);

      socket.to(calleeSocketId).emit("incoming-call", {
        callerEmail: from,
        callerName,
        roomId,
      });
    } else {
      io.to(callerSocketId).emit("user-unavailable", { to });
    }
  });

  // user reject the call
  socket.on("user-reject", ({ callerUser, calleeUser }) => {
    const callerSocketId = userSocketMap[callerUser];
    socket.to(callerSocketId).emit("user-reject", {
      calleeUser: calleeUser,
    });
  });

  // user miss call
  socket.on("miss-call", ({ targetEmail }) => {
    const targetSocketId = userSocketMap[targetEmail];
    socket.to(targetSocketId).emit("miss-call");
  });

  // Callee joins the room
  socket.on("callee-joined", ({ callerEmail, calleeEmail, roomId }) => {
    const callerSocketId = userSocketMap[callerEmail];

    if (callerSocketId) {
      socket.join(roomId);

      // Notify caller that callee has joined
      io.to(callerSocketId).emit("callee-joined", {
        calleeEmail,
        roomId,
      });
    }
  });

  // Caller creates and sends offer
  socket.on("offer-created", ({ roomId, calleeEmail, offer }) => {
    const calleeSocketId = userSocketMap[calleeEmail];
    if (calleeSocketId) {
      io.to(calleeSocketId).emit("offer-received", {
        callerEmail: socket.email,
        offer,
        roomId,
      });
    }
  });

  // Callee creates and sends answer
  socket.on("answer-created", ({ roomId, callerEmail, answer }) => {
    const callerSocketId = userSocketMap[callerEmail];
    if (callerSocketId) {
      io.to(callerSocketId).emit("answer-received", {
        calleeEmail: socket.email,
        answer,
        roomId,
      });
    }
  });

  // Handle ICE candidates exchange
  socket.on("ice-candidate", ({ roomId, targetEmail, candidate }) => {
    const targetSocketId = userSocketMap[targetEmail];
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", {
        fromEmail: socket.email,
        candidate,
        roomId,
      });
    }
  });

  // User hanp-up the Call
  socket.on("hang-up", ({ roomId, remoteUser, myname }) => {
    socket.to(roomId).emit("user-hung-up", { myname });
  });

  // User refersh its Room page
  socket.on("user-refresh", ({ roomId, targetEmail }) => {
    socket.to(roomId).emit("user-refresh", {
      message: "user-refreshed the page",
    });
  });
});

server.listen(port, () => console.log("Server is running on", port));
