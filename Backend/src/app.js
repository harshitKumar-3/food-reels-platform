const express = require("express");
const authRoutes = require("./routes/auth.routes");
const cookieParser = require("cookie-parser");
const foodRoutes = require("./routes/food.routes");
const orderRoutes = require("./routes/order.routes");
const cors = require("cors");

const app = express();

// ✅ CORS (yahan lagana hai)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://food-view-eta.vercel.app"
];

app.allowedOrigins = allowedOrigins;

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
app.use("/api/orders", orderRoutes);

module.exports = app;