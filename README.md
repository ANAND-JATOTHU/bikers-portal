# Bikers Portal

A professional motorcycle marketplace platform built with Node.js, Express, and MongoDB.

## 📝 Description

Bikers Portal is a full-stack web application that allows users to buy, sell, and service motorcycles. It provides a user-friendly interface for motorcycle enthusiasts to list their bikes for sale, browse available bikes, and connect with service providers for maintenance and repairs.

## ✨ Features

- **User Authentication**: Register, login, and user profile management.
- **Bike Listings**: Post bikes for sale with detailed information, images, and contact details.
- **Service Listings**: Service providers can post maintenance and repair services.
- **Search & Filter**: Find bikes and services based on various criteria.
- **Dashboard**: User dashboard to manage listings, view statistics, and interact with other users.
- **Responsive Design**: Works on all devices from desktop to mobile.

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Express-session with MongoDB store
- **Future Integration**: Java for microservices (included in project structure)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

## 🚀 Installation & Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/bikers-portal.git
cd bikers-portal
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Then edit `.env` and add your values:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
```

**MongoDB Setup Options:**

- **Option 1 - MongoDB Atlas (Recommended for beginners):**
  1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  2. Create a free account and cluster
  3. Get your connection string
  4. Update `MONGODB_URI` in `.env`

- **Option 2 - Local MongoDB:**
  1. Install MongoDB Community Server
  2. Start MongoDB service
  3. Use default URI: `mongodb://localhost:27017/bikers-portal`

**Session Secret:**
Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Start the development server**

```bash
npm run dev
# or for production
npm start
```

5. **Access the application**

Open your browser and go to `http://localhost:3000`

## 📂 Project Structure

```
bikers-portal/
├── models/             # Mongoose models
│   ├── User.js
│   ├── Bike.js
│   └── Service.js
├── controllers/        # Route controllers
│   ├── authController.js
│   ├── bikeController.js
│   ├── serviceController.js
│   └── dashboardController.js
├── routes/             # Express routes
│   ├── auth.js
│   ├── bikes.js
│   ├── services.js
│   └── dashboard.js
├── public/             # Static files
│   ├── css/
│   ├── js/
│   └── images/
├── views/              # HTML templates
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── dashboard.html
├── app.js              # Application entry point
├── package.json
└── README.md
```

## 📑 API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login
- `GET /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password

### Bikes

- `GET /bikes` - Get all bikes (with filtering/pagination)
- `GET /bikes/featured` - Get featured bikes
- `GET /bikes/:id` - Get single bike by ID
- `POST /bikes` - Create a new bike listing
- `PUT /bikes/:id` - Update a bike listing
- `DELETE /bikes/:id` - Delete a bike listing
- `GET /bikes/search` - Search for bikes
- `GET /bikes/seller/:sellerId` - Get bikes by seller

### Services

- `GET /services` - Get all services (with filtering/pagination)
- `GET /services/featured` - Get featured services
- `GET /services/:id` - Get single service by ID
- `POST /services` - Create a new service listing
- `PUT /services/:id` - Update a service listing
- `DELETE /services/:id` - Delete a service listing
- `GET /services/search` - Search for services
- `GET /services/provider/:providerId` - Get services by provider

### Dashboard

- `GET /dashboard` - Get user dashboard
- `GET /dashboard/profile` - Get user profile
- `GET /dashboard/bikes` - Get user's bikes
- `GET /dashboard/services` - Get user's services
- `GET /dashboard/stats` - Get dashboard statistics

## 🏗️ Future Java Integration

The project includes a Java class structure (`java/Bike.java`) for future integration with Java-based microservices. This will allow for more complex processing and scaling of the application.

## 🚀 Deployment

The application can be deployed to a hosting service like Render or Heroku:

1. Create an account on [Render](https://render.com/) or [Heroku](https://www.heroku.com/)
2. Connect your GitHub repository
3. Configure the environment variables
4. Deploy

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Author

Bikers Portal Team

---

Feel free to contribute to this project by submitting pull requests or reporting issues! 