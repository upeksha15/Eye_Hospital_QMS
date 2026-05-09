🏥 Eye Hospital Queue Management System (QMS)

A full-stack web application designed to streamline patient queue management, appointment scheduling, and hospital operations in eye hospitals. The system enables real-time coordination between patients, medical staff, and administrators using role-based access and live updates.

🚀 Key Highlights
Real-time patient queue management using WebSockets
Role-based system (Patient, Medical Staff, Admin)
Smart appointment and follow-up scheduling
Predictive analytics for patient flow forecasting
Interactive dashboards with data visualization
Secure authentication using JWT
Automated email notifications and reports

✨ Features
👤 Patient Portal
View appointment status (pending, completed, upcoming)
Real-time queue position updates
Book and manage appointments
Receive instant updates from hospital system

🏥 Medical Staff Panel
Live queue processing (accept, skip, complete patients)
Manage patient consultations efficiently
Schedule and update follow-up appointments
Real-time synchronization with patient data

🧑‍💼 Admin Dashboard
Hospital performance monitoring
Patient flow prediction and reporting
Filter data by doctor and date
Visual analytics using charts and graphs
Generate downloadable reports (PDF)

🛠️ Tech Stack
Frontend
React 19
React Router DOM
Tailwind CSS
Recharts (Data Visualization)
Socket.io Client (Real-time communication)
Axios (API requests)
Backend
Node.js
Express.js
MongoDB & Mongoose
Socket.io
JWT Authentication
Bcrypt.js (Password security)
Nodemailer (Email service)
PDFKit (Report generation)

📁 Project Structure
Eye_Hospital_QMS/
├── backend/
│   ├── src/              # API, models, controllers, routes
│   ├── scripts/          # Database seeding scripts
│   └── .env              # Environment variables
│
├── frontend/
│   ├── src/              # React components & pages
│   └── public/           # Static assets
│
└── dataset_csv/          # Data for analytics & reporting
