# IoT Sensor Monitoring Dashboard

A **real-time IoT sensor dashboard** built with **React.js** and **Zustand** that displays temperature, humidity, and pressure readings. The project features interactive charts, responsive sensor cards, and a paginated table for historical data, making it **portfolio-ready** and visually appealing.

---

## Features

* **Real-time updates**: Live sensor data simulation with automatic updates every 2 seconds.
* **Interactive charts**: Line charts using **Recharts** to visualize temperature, humidity, and pressure trends.
* **Responsive sensor cards**: Displays the latest readings for temperature, humidity, and pressure with smooth hover animations.
* **Paginated table**: Shows historical readings in descending order, 20 readings per page.
* **Professional UI**: Modern gradient background, clean typography, hover effects, and shadows for a polished look.

---

## Technologies Used

* **Frontend**: React.js, JavaScript (ES6+), HTML5, CSS3
* **State Management**: Zustand
* **Charts**: Recharts
* **Simulated Sensor Data**: JavaScript timers (setInterval)
* **Responsive Design**: CSS Grid and Flexbox

---

## Project Structure

```
iot-dashboard/
 ├─ public/
 │   └─ index.html
 ├─ src/
 │   ├─ api/
 │   │   └─ sensorAPI.js
 │   ├─ components/
 │   │   ├─ SensorCard.js
 │   │   ├─ Chart.js
 │   │   └─ SensorTable.js
 │   ├─ context/
 │   │   └─ sensorStore.js
 │   ├─ pages/
 │   │   └─ Dashboard.js
 │   ├─ App.js
 │   └─ index.js
 ├─ package.json
 └─ README.md
```

---

## Getting Started

1. **Clone the repository**:

```bash
git clone https://github.com/yourusername/iot-dashboard.git
cd iot-dashboard
```

2. **Install dependencies**:

```bash
npm install
```

3. **Start the development server**:

```bash
npm start
```

4. **Open in browser**:
   Navigate to `http://localhost:3000` to view the dashboard.

---

## Future Enhancements

* Integrate **real sensor APIs** instead of simulated data.
* Add **alerts/notifications** when readings exceed thresholds.
* Implement **user authentication** for secure dashboard access.
* Add **downloadable CSV export** of historical readings.

---

## Author

**Jithendra Babu G**
---

## License

This project is **open-source** and available under the MIT License.
