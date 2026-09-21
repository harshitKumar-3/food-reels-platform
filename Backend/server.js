require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/db/db");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowed = app.allowedOrigins || [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://food-view-eta.vercel.app"
      ];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for Socket.IO"));
      }
    },
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join_user", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on("join_partner", (partnerId) => {
    if (partnerId) {
      socket.join(`partner_${partnerId}`);
    }
  });
});

app.set("io", io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});