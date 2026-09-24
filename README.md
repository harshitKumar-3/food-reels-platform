# 🍽️ Food Reels Platform

> A full-stack food discovery and real-time ordering platform built with the MERN stack (MongoDB, Express, React, Node.js), Socket.IO, and ImageKit CDN.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://food-view-eta.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://render.com)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)

---

## 🌟 Overview

**Food Reels** combines short-form vertical video engagement with real-time food commerce. Customers discover signature dishes through an immersive video feed, interact via likes and comments, and place instant orders. Food partners showcase their culinary creations, manage incoming orders live with real-time audio/visual notifications, and track fulfillment in an intuitive kitchen dashboard.

---

## ✨ Key Features

### 👤 Customer Experience (User Role)
- **Interactive Reel Feed**: Full-screen vertical video feed with smooth scroll, automatic play/pause using `IntersectionObserver`, and sound controls.
- **Engagement System**: Like and bookmark dishes with persistent state across page reloads and browser sessions.
- **Interactive Comments**: Read customer reviews and share feedback with real-time author attribution and owner-controlled deletion.
- **Store & Chef Discovery**: Seamless navigation from any reel directly to the Food Partner's dedicated storefront and menu catalog (`Store → ReelViewer` flow).
- **Direct & Cart Ordering**:
  - Instant **"Order Now"** modal directly from any reel.
  - Multi-item **Cart** with real-time quantity adjustments and subtotal calculation.
  - Delivery details collection with international country code phone selection.
- **Live Order Tracking**: Dedicated Orders page featuring live status updates (**Placed ➔ Preparing ➔ Delivered**) powered by **Socket.IO**.

### 👨‍🍳 Food Partner Experience (Partner Role)
- **Creator Studio & Dashboard**: Clean management console showing active food listings, kitchen statistics, and live customer orders.
- **Cloud Media Uploads**: Streamlined video upload pipeline powered by **Multer** and **ImageKit CDN** for instant video optimization and streaming.
- **Real-Time Kitchen Management**:
  - Live incoming order dispatch notifications via WebSockets.
  - One-click order state transitions (*Preparing*, *Delivered*, *Cancelled*).
  - Terminal states (*Delivered*, *Cancelled*) strictly enforce workflow integrity.
- **Content Ownership**: Food Partners can edit or delete their own reels and manage their comments with cascade cleanup.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, React Router v7, Axios, Socket.IO Client, CSS3 Variables |
| **Backend** | Node.js, Express.js v5, Socket.IO, Multer, ImageKit Node SDK, Cookie-Parser |
| **Database** | MongoDB Atlas (Cloud Database), Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt.js, HTTP-Only Cross-Site Secure Cookies |
| **Hosting & CI/CD** | Vercel (Frontend SPA), Render (Backend Web Service), GitHub |

---

## 🔐 Security & Engineering Highlights

- **Cross-Site Cookie Architecture**: Backend sets `SameSite=None` and `Secure=true` in production with `trust proxy` enabled, ensuring smooth authentication across independent frontend and backend domains.
- **Role-Based Access Control (RBAC)**: Strict separation between `user` and `food-partner` permissions; food partners cannot place customer orders or manipulate other partner catalogs.
- **Cascade Deletion**: Deleting a food reel automatically purges associated comments and interaction records from MongoDB.
- **Dynamic CORS & Socket.IO**: Flexible whitelist supporting local development, Vercel production domains, and preview deployment URLs.

---

## 📁 Repository Structure

```text
food-reels-platform/
├── Backend/
│   ├── src/
│   │   ├── controllers/      # Auth, Food, and Order controller logic
│   │   ├── db/               # MongoDB Atlas connection setup
│   │   ├── middlewares/      # JWT verification & role authorization
│   │   ├── models/           # Mongoose schemas (User, FoodPartner, Food, Order)
│   │   ├── routes/           # Express API route declarations
│   │   └── services/         # ImageKit storage service integration
│   ├── server.js             # HTTP & Socket.IO server initialization
│   ├── package.json          # Backend dependencies and scripts
│   └── .env.example          # Backend environment variable template
│
├── Frontend/
│   ├── src/
│   │   ├── components/       # ReelFeed, ReelViewer, OrderModal, PhoneInput, BottomNav
│   │   ├── pages/            # Home, Saved, UserOrders, Dashboard, Profile, Auth
│   │   ├── routes/           # React Router route definitions
│   │   ├── styles/           # Modern mobile-first responsive styling
│   │   └── utils/            # Axios API instance and Socket.IO client
│   ├── vercel.json           # Vercel SPA rewrite configuration
│   ├── package.json          # Frontend dependencies and scripts
│   └── .env.example          # Frontend environment variable template
│
├── .gitignore                # Global gitignore preventing credential leaks
└── README.md                 # Project documentation
```

---

## 📡 REST API Reference

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/user/register` | Register customer account | Public |
| `POST` | `/api/auth/user/login` | Authenticate customer | Public |
| `GET` | `/api/auth/user/logout` | Clear customer session | Customer |
| `POST` | `/api/auth/food-partner/register` | Register restaurant / food partner | Public |
| `POST` | `/api/auth/food-partner/login` | Authenticate food partner | Public |
| `GET` | `/api/auth/food-partner/logout` | Clear food partner session | Partner |
| `GET` | `/api/auth/food-partner/profile` | Get partner profile details | Partner |
| `GET` | `/api/auth/me` | Fetch active authenticated profile & role | Authenticated |

### Food & Reels Routes (`/api/food`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/food` | Fetch all food reels feed | Authenticated |
| `POST` | `/api/food` | Upload new food reel (video + details) | Food Partner |
| `DELETE` | `/api/food/:id` | Delete own reel (cascades comments) | Food Partner (Owner) |
| `POST` | `/api/food/like` | Toggle like status on a reel | Authenticated |
| `POST` | `/api/food/save` | Toggle bookmark status on a reel | Authenticated |
| `GET` | `/api/food/save` | Retrieve all bookmarked reels | Authenticated |
| `GET` | `/api/food/food-partner/:id` | Fetch partner details and reel catalog | Authenticated |
| `POST` | `/api/food/:id/comment` | Add a comment to a reel | Authenticated |
| `DELETE` | `/api/food/:id/comment/:commentId` | Delete own comment | Comment Owner |

### Order Routes (`/api/orders`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Place single or multi-item order | Customer Only |
| `GET` | `/api/orders/my-orders` | Fetch customer's order history | Customer Only |
| `GET` | `/api/orders/partner-orders` | Fetch kitchen's incoming orders | Food Partner Only |
| `PATCH` | `/api/orders/:id/status` | Update status (`preparing`, `delivered`, `cancelled`) | Food Partner Only |

---

## ⚡ Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas cluster connection string
- ImageKit account (Public Key, Private Key, URL Endpoint)

### 1. Clone Repository
```bash
git clone https://github.com/harshitKumar-3/food-reels-platform.git
cd food-reels-platform
```

### 2. Backend Configuration
```bash
cd Backend
npm install
```
Create a `.env` file in the `Backend/` directory:
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/foodreels_db?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint
```
Start the backend server:
```bash
npm start
# Server running at http://localhost:3000
```

### 3. Frontend Configuration
In a separate terminal:
```bash
cd Frontend
npm install
```
Create a `.env` file in the `Frontend/` directory:
```env
VITE_API_URL=http://localhost:3000
```
Start the frontend development server:
```bash
npm run dev
# Vite server running at http://localhost:5173
```

---

## 🚀 Production Deployment Guide

### Deploying the Backend (Render)
1. Log in to [Render](https://render.com) and click **New + ➔ Web Service**.
2. Connect your GitHub repository: `harshitKumar-3/food-reels-platform`.
3. Configure the Web Service settings:
   - **Name**: `food-reels-backend`
   - **Root Directory**: `Backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables** in Render Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default, Render sets `PORT` automatically)
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `your_production_jwt_secret`
   - `CLIENT_URL`: `https://food-view-eta.vercel.app` (or your Vercel frontend URL)
   - `IMAGEKIT_PUBLIC_KEY`: `your_imagekit_public_key`
   - `IMAGEKIT_PRIVATE_KEY`: `your_imagekit_private_key`
   - `IMAGEKIT_URL_ENDPOINT`: `your_imagekit_url_endpoint`
5. Click **Create Web Service**. Once deployed, copy your live backend URL (e.g. `https://food-reels-backend.onrender.com`).

### Deploying the Frontend (Vercel)
1. Log in to [Vercel](https://vercel.com) and click **Add New ➔ Project**.
2. Import the `harshitKumar-3/food-reels-platform` repository.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `Frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend.onrender.com` (your Render backend live URL)
5. Click **Deploy**. Vercel will build and deploy the SPA with automatic routing.

---

## 👨‍💻 Author

**Harshit Kumar**
- GitHub: [@harshitKumar-3](https://github.com/harshitKumar-3)
- Project Repository: [food-reels-platform](https://github.com/harshitKumar-3/food-reels-platform)

---

## 📄 License
This project is licensed under the MIT License - feel free to use and adapt it for your portfolio.