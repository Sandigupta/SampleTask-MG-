# Chapter Performance Dashboard Backend

A RESTful API backend for managing chapter performance data with MongoDB, Redis caching, and comprehensive rate limiting.

## Overview

This application provides a robust backend service for managing educational chapter performance data. It implements modern caching strategies, authentication mechanisms, and performance optimization techniques suitable for production environments.

## Key Features

- RESTful API endpoints with comprehensive CRUD operations
- MongoDB integration with Mongoose ODM
- Redis-based caching with configurable TTL
- Rate limiting (30 requests/minute per IP)
- JWT-based admin authentication
- File upload support for bulk data operations
- Advanced filtering, sorting, and pagination
- Request validation using Joi schemas
- Comprehensive error handling and logging
- Security headers and CORS configuration


## Tech Stack

**Backend**
* Node.js and Express.js

**Database**
* MongoDB for structured data storage
* Redis for caching and performance optimization

**Deployment**
* MongoDB (local instance or MongoDB Atlas)
* Redis (local instance or Redis Cloud using UpStash)
* Backend deployed on Render

## Architecture

![Image](https://github.com/user-attachments/assets/ac218b86-7386-43d6-82c3-dcae58783dc6)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Sandigupta/SampleTask-MG-.git
cd SampleTask-MG-
```

2. Install dependencies:
```bash
npm install
```

## Project Structure

```
src/
├── config/
│   ├── database.js      # MongoDB configuration
│   └── redis.js         # Redis configuration
├── controllers/
│   ├── authController.js
│   └── chapterController.js
├── middleware/
│   ├── auth.js          # JWT authentication
│   |   
│   └── errorHandler.js
├── models/
│   └── User.js       # Mongoose schema
|   └── Chapters.js       # Mongoose schema   
├── routes/
│   ├── auth.js
│   └── chapters.js
├── services/
│   └── cacheService.js  # Redis caching logic
├── utils/
│   ├── validation.js    # Request validation
│   
└── app.js               # Express app configuration
```


## Setting up project

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/chapter-performance-db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d

# Admin Credentials
ADMIN_EMAIL=admin@mathongo.com
ADMIN_PASSWORD=admin123
```

## Database Setup

# MongoDB:

* Make sure to have add all the env variable
* Run command to migrate your database setup : `npm install` 
* Make sure you have redis-cli and mongodb in local if you are using localhost

* Wohoo ! you are done : )

# Local Database:

* Collections

 [![Image](https://github.com/user-attachments/assets/60d7a65b-ce34-4c67-bd36-242a400edcea)]


* Chapter Collection

![Image](https://github.com/user-attachments/assets/4ff3d35e-3d2e-4b29-8e18-35e929759ba1)


* User Collection (Admin)

![Image](https://github.com/user-attachments/assets/db53c43e-06a3-4c24-9bf5-5fb0f5ebe789)


**Run your backend server**
* cd to backend `npm run dev`

## Wohoo ! congrats you are done with setup :)


## API Documentation

### Postman Collection
Use this Postman collection to test all available API endpoints:

**Collection Link:** [API Collection of Task](https://www.postman.com/sandip-g/task-collection/collection/9wcknfz/api-collection-of-task?action=share&creator=38252655)

### How to Use
1. Click the collection link above
2. Fork it to your own Postman workspace
3. Set environment variables:
   - `base_url`: `http://localhost:5000/api/v1`
   - `admin_token`: (set after login)
4. Run the requests to test the API

---

## RESTful API Endpoints

### Chapters

- **GET** `/api/v1/chapters`  
  Returns a list of all chapters.

- **GET** `/api/v1/chapters/:id`  
  Returns details of a specific chapter by ID.

- **POST** `/api/v1/chapters`  
  Uploads one or more chapters to the database. Requires authentication.

---

## API Endpoints (with Usage)

### 1. Login
**POST** `{{base_url}}/auth/login`

**Headers:**
```

Content-Type: application/json

````

**Body:**
```json
{
  "email": "admin@mathongo.com",
  "password": "admin123"
}
````

---

### 2. Get All Chapters

**GET** `{{base_url}}/chapters`

**Headers:**

```
Content-Type: application/json
```

---

### 3. Filter Chapters

**GET** `{{base_url}}/chapters?class=Class 11&subject=Physics&status=Completed&page=1&limit=5`

**Headers:**

```
Content-Type: application/json
```

---

### 4. Weak Chapters

**GET** `{{base_url}}/chapters?weakChapters=true`

**Headers:**

```
Content-Type: application/json
```

---

### 5. Upload Chapters

**POST** `{{base_url}}/chapters`

**Headers:**

```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Body:**

```json
[
  {
    "chapter": "Sample Chapter",
    "class": "Class 11",
    "subject": "Physics",
    "status": "Completed"
  }
]
```

## Query Parameters: 

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `class` | string | Filter by class | `Class 11` |
| `unit` | string | Filter by unit | `Mechanics 1` |
| `status` | string | Filter by status | `Completed`, `In Progress`, `Not Started` |
| `subject` | string | Filter by subject | `Physics` |
| `weakChapters` | boolean | Filter weak chapters | `true`, `false` |
| `page` | number | Page number (default: 1) | `1` |
| `limit` | number | Items per page (default: 10, max: 100) | `10` |


## Radis-CLI Connection and Cache Check! 

![Image](https://github.com/user-attachments/assets/21af8ba6-1df5-4648-b15c-126a2302ada7)


![Image](https://github.com/user-attachments/assets/7aae8bbe-47b8-4439-b995-74a11da1a895)


![Image](https://github.com/user-attachments/assets/b5a3bfe0-4d27-4909-bef0-4160b61f32f7)


![Image](https://github.com/user-attachments/assets/021e0b70-9b1d-4e04-a469-c1f640b115eb)





## Performance Features

### Caching Strategy
- Redis-based caching with 1-hour TTL
- Automatic cache invalidation on data updates
- Cached endpoints: GET /chapters

### Rate Limiting
- IP-based rate limiting: 30 requests/minute
- Redis-backed rate limit storage
- Graceful handling with HTTP 429 responses

### Database Optimization
- MongoDB indexing for frequently queried fields
- Connection pooling and optimization
- Query optimization for large datasets

## Security Features

- CORS configuration
- MongoDB injection prevention
- JWT token-based authentication
- Input validation and sanitization
- File upload restrictions

## Error Handling

The application implements comprehensive error handling:

- Validation errors with detailed messages
- Database connection error recovery
- File upload error handling
- Authentication and authorization errors
- Rate limit exceeded responses
- Graceful server error responses

---

**Repository:** [https://github.com/Sandigupta/SampleTask-MG-](https://github.com/Sandigupta/SampleTask-MG-)

**Author:** Sandeep Gupta