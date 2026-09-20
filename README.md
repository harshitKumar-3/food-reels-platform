# Food Reels Platform

A full-stack food discovery platform where users can explore short food videos, like and save food reels, and visit food partner profiles. Food partners can register, create their profiles, and upload food videos.

## Features

### User

- User registration and login
- JWT-based authentication
- Browse food reels
- Like and unlike food reels
- Save and unsave food reels
- View saved food
- Visit food partner profiles

### Food Partner

- Food partner registration and login
- JWT-based authentication
- Food partner dashboard
- Upload food videos
- View uploaded food reels
- View food partner profile

### Backend

- REST APIs using Node.js and Express.js
- MongoDB Atlas for database storage
- Mongoose for data modeling
- JWT authentication
- HTTP-only cookies for authentication
- Multer for handling video uploads
- ImageKit for cloud media storage
- CORS configuration for frontend-backend communication

## Tech Stack

### Frontend

- React.js
- React Router
- Axios
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer
- ImageKit

## Project Structure

```text
food-reels-platform/
│
├── Backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── server.js
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── styles/
│   │   └── utils/
│   └── package.json
│
├── .gitignore
└── README.md
```

## API Overview

### Authentication

```text
POST /api/auth/user/register
POST /api/auth/user/login
GET  /api/auth/user/logout

POST /api/auth/food-partner/register
POST /api/auth/food-partner/login
GET  /api/auth/food-partner/logout
GET  /api/auth/food-partner/profile
```

### Food

```text
POST /api/food
GET  /api/food
POST /api/food/like
POST /api/food/save
GET  /api/food/save
GET  /api/food/food-partner/:id
GET  /api/food/food-partner/foods
```

## Environment Variables

### Backend

Create a `.env` file inside the `Backend` folder:

```env
PORT=3000
JWT_SECRET=your_jwt_secret
MONGO_URI=your_mongodb_connection_string
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
```

### Frontend

Create a `.env` file inside the `Frontend` folder:

```env
VITE_API_URL=http://localhost:3000
```

> Never commit `.env` files or secret keys to GitHub.

## Run Locally

### Backend

```bash
cd Backend
npm install
node server.js
```

Backend runs on:

```text
http://localhost:3000
```

### Frontend

Open another terminal:

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## Database

MongoDB Atlas is used to store application data including:

- Users
- Food partners
- Food reels
- Likes
- Saved food items

Videos are uploaded to ImageKit, while their URLs and related food information are stored in MongoDB.

## Future Improvements

- Food search and category filtering
- Comments and replies
- Pagination and infinite scrolling
- Improved food partner analytics
- Better recommendation system
- Responsive UI improvements
- Production deployment

## License

This project is intended for learning and portfolio purposes.