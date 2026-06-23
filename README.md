# RK Dental Clinic Website

A complete responsive website and Node.js backend for **RK Dental Clinic**, featuring **Dr. Nitin Jain** and clinic contact number **8979913023**.

## Features

- Premium responsive design for mobile, tablet, and desktop
- Animated hero, scroll reveals, hover states, FAQ accordion, mobile navigation, and form feedback
- Home, doctor profile, services, appointment, login/signup, testimonials, FAQ, contact, and footer
- Dedicated appointment booking and patient login/signup pages
- Floating call and WhatsApp buttons linked to 8979913023
- Express API with MongoDB and Mongoose
- Password hashing with bcrypt
- JWT login authentication
- Appointment and contact message storage
- Frontend and backend validation with centralized error responses
- Helmet security headers and configurable CORS

## Project Structure

```text
rk-dental-clinic/
|-- assets/
|   `-- hero-clinic.png
|-- models/
|   |-- Appointment.js
|   `-- User.js
|-- routes/
|   |-- appointment.js
|   |-- auth.js
|   `-- contact.js
|-- .env.example
|-- appointment.html
|-- index.html
|-- login.html
|-- package.json
|-- README.md
|-- script.js
|-- server.js
`-- style.css
```

## Setup

### 1. Install Node.js

Install Node.js 18 or newer from [nodejs.org](https://nodejs.org/). Confirm the installation:

```bash
node --version
npm --version
```

### 2. Run npm install

Open a terminal in the project folder and install dependencies:

```bash
npm install
```

### 3. Add MongoDB URL in `.env`

Create a `.env` file by copying `.env.example`. Update the MongoDB URL and use a long random JWT secret:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/rk_dental_clinic
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5000
```

You can use local MongoDB or replace `MONGODB_URI` with a MongoDB Atlas connection string.

### 4. Run backend using npm start

Make sure MongoDB is running, then start the application:

```bash
npm start
```

For automatic server restarts during development:

```bash
npm run dev
```

### 5. Open frontend in browser

Visit:

```text
http://localhost:5000
```

The Express server safely serves the frontend and all API routes from the same origin. The HTML files can also be opened directly, but the backend must still be running at `http://localhost:5000` for form submissions.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Server and database status |
| `POST` | `/api/auth/signup` | Create a user and return a JWT |
| `POST` | `/api/auth/login` | Login and return a JWT |
| `GET` | `/api/auth/me` | Get the authenticated user |
| `POST` | `/api/appointments` | Book an appointment, with optional user token |
| `GET` | `/api/appointments/mine` | Get appointments for the authenticated user |
| `POST` | `/api/contact` | Store a contact form message |

For authenticated endpoints, send the token as:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Production Notes

- Set a unique, long `JWT_SECRET`; never use the development fallback in production.
- Add your deployed frontend URL to `CLIENT_ORIGIN`. Multiple origins can be comma-separated.
- Use a managed MongoDB instance with authentication and network access controls.
- Serve the app behind HTTPS and keep `.env` out of source control.
- Add rate limiting, email/SMS confirmation, and an admin dashboard before using this as a full clinic management system.

## Clinic Details

- **Clinic:** RK Dental Clinic
- **Doctor:** Dr. Nitin Jain
- **Phone:** 8979913023
- **WhatsApp:** `https://wa.me/918979913023`
