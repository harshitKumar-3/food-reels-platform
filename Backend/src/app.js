const express = require("express");
const authRoutes = require("./routes/auth.routes");
const cookieParser = require("cookie-parser");
const foodRoutes = require("./routes/food.routes");
const orderRoutes = require("./routes/order.routes");
const cors = require("cors");

const app = express();

app.set("trust proxy", 1);

// ✅ CORS
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (origin === "https://food-view-eta.vercel.app") return true;
  if (process.env.CLIENT_URL) {
    const urls = process.env.CLIENT_URL.split(",").map((u) => u.trim());
    if (urls.includes(origin)) return true;
  }
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  return false;
};
app.isAllowedOrigin = isAllowedOrigin;

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
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