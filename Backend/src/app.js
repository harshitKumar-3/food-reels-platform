const express = require("express");
const authRoutes = require("./routes/auth.routes");
const cookieParser = require("cookie-parser");
const foodRoutes = require("./routes/food.routes");
const cors = require("cors");

const app = express();

// ✅ CORS (yahan lagana hai)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://food-view-eta.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

// middlewares
app.use(cookieParser());
app.use(express.json());

// routes
app.get("/", (req, res) => {
  res.send("Hello");
});

app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);

module.exports = app;