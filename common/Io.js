const { Server } = require("socket.io");
const { log } = require("#common/Logger.js");
const { SOCKET_INITIALIZED } = require("#enum/Message.js");
const { SOCKET_NOT_INITIALIZED, userNotFoundError, socketAuthError } = require("#enum/Error.js");
const User = require("#models/User.js");
const { verifyToken } = require("./JWT");
const Env = require("#config/Env.js");
let io;
const users = new Map();
const rooms = new Map();

function getCorsConfig() {
  return {
    cors: {
      origin: Env.CORS_ORIGIN,
      methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    },
  };
}

function init(server) {
  io = new Server(server, getCorsConfig());
  log(SOCKET_INITIALIZED, "DEBUG", "Socket");

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.payload);
      if (!user) {
        return next(userNotFoundError);
      } else {
        socket.userId = user._id;
        return next();
      }
    } catch (error) {
      log(error.message, "ERROR", "Socket");
      return next(socketAuthError);
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    users.set(userId, socket.id);

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(userId);
    });

    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(userId);
      }
    });

    socket.on("disconnect", () => {
      users.delete(userId);
      rooms.forEach((members, roomId) => {
        members.delete(userId);
        if (members.size === 0) {
          rooms.delete(roomId);
        }
      });
    });

    socket.on("roomCreated", (room) => {
      if (!rooms.has(room._id.toString())) {
        rooms.set(room._id.toString(), new Set());
      }
    });
  });

  return io;
}

function emit(event, data) {
  if (io) {
    io.emit(event, data);
  } else {
    log(SOCKET_NOT_INITIALIZED, "ERROR", "Socket");
  }
}

function emitToUser(userId, event, data) {
  if (io) {
    const socketId = users.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
    } else {
      log(`User with ID ${userId} not connected`, "ERROR", "Socket");
    }
  } else {
    log(SOCKET_NOT_INITIALIZED, "ERROR", "Socket");
  }
}

function emitToRoom(roomId, event, data) {
  if (io) {
    io.to(roomId).emit(event, data);
  } else {
    log(SOCKET_NOT_INITIALIZED, "ERROR", "Socket");
  }
}

module.exports = { init, emit, emitToUser, emitToRoom };
