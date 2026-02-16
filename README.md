# IoT Sensor Monitoring Dashboard

![React](https://img.shields.io/badge/Frontend-React-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Render](https://img.shields.io/badge/Deployment-Render-purple)
![GitHub Pages](https://img.shields.io/badge/Frontend%20Hosting-GitHub%20Pages-black)
![License](https://img.shields.io/badge/License-MIT-yellow)

This project is a full-stack IoT monitoring dashboard that simulates sensor data, detects abnormal readings, stores alert history in a PostgreSQL database, and sends email notifications when thresholds are exceeded.

I built this project to demonstrate how a real-world monitoring system works — including frontend visualization, backend API development, database integration, and production deployment.

---

# Live Demo

Frontend
https://jithendrababug.github.io/IoT-Dashboard/

Backend API
https://iot-dashboard-y27r.onrender.com

---


# Features

## Real-Time Sensor Monitoring

The dashboard simulates IoT sensor readings for:

* Temperature
* Humidity
* Pressure

New readings are generated automatically every 5 minutes. The latest values are displayed clearly using live sensor cards.

---

## Data Visualization

The dashboard provides multiple ways to view the data:

* Line chart showing trends over time
* Paginated table of recent readings
* Displays the latest 20 sensor records
* Clean, responsive interface that works on different screen sizes

---

## Alert Detection System

Whenever a sensor value crosses a defined threshold, the system automatically detects it and classifies the alert as:

* WARNING
* CRITICAL

Each alert is stored permanently in the PostgreSQL database for future reference.

---

## Email Notifications

Users can enable email alerts directly from the dashboard. Once enabled:

* Alerts are sent automatically when thresholds are breached
* Multiple recipients can be configured
* A cooldown mechanism prevents sending too many emails in a short time

Email delivery is handled using the Resend Email API.

---

## Alert History and Reporting

The dashboard keeps a record of recent alerts and allows users to:

* View alert history
* Refresh alerts from the database
* Export alert data as a CSV file

This makes it easier to track and analyze abnormal sensor behavior.

---

# Technology Stack

## Frontend

* React.js
* Zustand for state management
* Recharts for data visualization
* Framer Motion for animations
* HTML, CSS, JavaScript

---

## Backend

* Node.js
* Express.js
* PostgreSQL database
* REST API architecture
* Resend Email API for notifications

---

## Database

PostgreSQL is used to store:

* Alert history
* Email configuration
* System state (cooldown tracking)

The database is hosted on Render.

---

## Deployment

The project is fully deployed using cloud services:

* Frontend hosted on GitHub Pages
* Backend hosted on Render
* PostgreSQL database hosted on Render

---

# Database Structure

## alerts table

Stores all alert records.

```sql
CREATE TABLE alerts (
  id BIGSERIAL PRIMARY KEY,
  reading_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL,
  severity TEXT NOT NULL,
  temperature DOUBLE PRECISION NOT NULL,
  humidity DOUBLE PRECISION NOT NULL,
  pressure DOUBLE PRECISION NOT NULL,
  message TEXT NOT NULL
);
```

---

## email_config table

Stores email sender and recipients.

```sql
CREATE TABLE email_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  from_email TEXT NOT NULL,
  recipients JSONB NOT NULL
);
```

---

## alert_state table

Stores system state such as cooldown timestamps.

```sql
CREATE TABLE alert_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

---

# API Endpoints

Configure email alerts:

```
POST /api/alerts/config
```

Check email configuration:

```
GET /api/alerts/config
```

Create alert and send email:

```
POST /api/alerts/email
```

Fetch alert history:

```
GET /api/alerts/history?limit=10
```

---

# How the System Works

1. Sensor readings are generated automatically
2. The frontend sends the reading to the backend
3. The backend checks if any thresholds are exceeded
4. If a breach is detected:

   * The alert is stored in PostgreSQL
   * An email notification is sent (if enabled)
5. The frontend retrieves alert history and displays it

---

# Running Locally

## Clone the repository

```bash
git clone https://github.com/jithendrababug/IoT-Dashboard.git
cd IoT-Dashboard
```

---

## Start Backend

```bash
cd iot-alert-backend
npm install
```

Create a `.env` file:

```
PORT=5000
DATABASE_URL=your_postgres_connection_string
RESEND_API_KEY=your_resend_api_key
NODE_ENV=development
```

Run backend:

```bash
npm start
```

---

## Start Frontend

```bash
cd ../iot-dashboard
npm install
npm start
```

Frontend runs at:

```
http://localhost:3000
```

---

# Deployment

Backend is deployed on Render and automatically updates when changes are pushed to GitHub.

Frontend is deployed using GitHub Pages:

```bash
npm run deploy
```

---

# Highlights

This project demonstrates:

* Full-stack development
* Cloud database integration
* REST API design
* Email notification system
* Real-time data simulation
* Production deployment
* Clean and structured architecture

---

# Future Improvements

Possible enhancements include:

* Integration with real IoT hardware
* User authentication system
* Role-based access control
* WebSocket real-time updates
* Configurable alert thresholds
* Multi-device monitoring support

---

# Author

Jithendra Babu G

GitHub
https://github.com/jithendrababug

LinkedIn
https://www.linkedin.com/in/jithendrababug

Email
[jithendrababug@gmail.com](mailto:jithendrababug@gmail.com)

---

# License

This project is licensed under the MIT License.
