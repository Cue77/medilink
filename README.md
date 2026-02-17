# MediLink – Patient Communication & Appointment Platform

MediLink is a healthcare-inspired Progressive Web Application designed to improve communication and appointment coordination between patients and healthcare providers.

The project simulates real NHS workflow challenges such as scheduling delays, missed appointments and fragmented communication by providing a centralised messaging and booking platform.

---

## Key Features

* Patient appointment booking and management
* Secure user authentication
* Messaging between patients and providers
* Real-time scheduling updates
* Responsive Progressive Web App (mobile & desktop support)

---

## Tech Stack

**Frontend**

* React
* Tailwind CSS
* HTML / CSS

**Backend**

* Node.js
* Express
* REST API architecture

**Database**

* MySQL / Supabase

**Other Tools**

* Git version control
* Firebase services
* PWA service workers

---

## System Architecture

The application follows a client-server architecture:

* React frontend communicates with REST API endpoints
* Backend handles authentication, booking logic and validation
* Database stores users, appointments and messages
* Service workers enable offline capability

---

## Example API Endpoints

| Method | Endpoint      | Description           |
| ------ | ------------- | --------------------- |
| POST   | /register     | Create new user       |
| POST   | /login        | Authenticate user     |
| GET    | /appointments | Retrieve appointments |
| POST   | /appointments | Book appointment      |
| POST   | /messages     | Send message          |

---

## Design Goals

* Improve reliability of patient communication
* Reduce appointment no-shows
* Provide accessible multi-device experience
* Demonstrate scalable backend architecture

---

## Running Locally

### 1. Clone Repository

git clone https://github.com/Cue77/medilink.git

### 2. Install Dependencies

npm install

### 3. Configure Environment

Create a .env file and add database credentials

### 4. Run Server

npm start

---

## Future Improvements

* Automated testing suite
* Role-based permissions
* Email/SMS notifications
* NHS API integration (simulated)

---

## Author

**Emmanuel Ukan Ochicha**
BSc Software Engineering – University of Bedfordshire

Focused on backend systems, reliability and real-world problem solving.
