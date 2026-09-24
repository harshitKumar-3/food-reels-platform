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
      const checkOrigin = app.isAllowedOrigin || ((o) => {
        if (!o) return true;
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return true;
        if (o === "https://food-view-eta.vercel.app") return true;
        return false;
      });
      if (checkOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
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