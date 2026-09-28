# Student Attendance Management App

A full-stack mobile attendance system: **React Native (Expo, runs in Expo Go)** frontend +
**Node.js/Express/MongoDB Atlas** backend, deployable to **Render**.

- Admin (env-based login) manages students & volunteers, marks/edits attendance, views reports.
- Volunteers (created by Admin) mark attendance and view reports.
- Attendance is date-wise, one record per student per day (enforced by a unique DB index),
  calculated in the **Asia/Kolkata** timezone.

---

## 1. Project Structure

```
attendance-app/
  backend/
    src/
      config/db.js
      controllers/        (auth, student, volunteer, attendance, report)
      middleware/          (auth, error handler)
      models/               (Student, Volunteer, Attendance)
      routes/
      utils/date.js
      app.js
      server.js
    .env.example
    .gitignore
    package.json
  frontend/
    src/
      api/client.js
      components/UI.js
      context/AuthContext.js
      navigation/AppNavigator.js
      screens/              (Login, Dashboard, Students, StudentForm, StudentDetail,
                              Volunteers, VolunteerForm, MarkAttendance, Reports)
      utils/date.js
    App.js
    app.json
    babel.config.js
    .env.example
    .gitignore
    package.json
  README.md
```

The backend and frontend have **separate `package.json` files and dependencies** — they are
independent projects that happen to live in one repo. The backend can be deployed to Render on
its own; the frontend runs through Expo Go on its own.

---

## 2. Technology Stack

**Frontend:** React Native, Expo SDK 57, React Navigation (native-stack), Axios, AsyncStorage.
**Backend:** Node.js, Express, Mongoose, MongoDB Atlas, JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`.

---

## 3. MongoDB Atlas Setup

1. Create a free cluster at https://www.mongodb.com/cloud/atlas.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add your IP, or `0.0.0.0/0` (allow from anywhere) for easy dev/Render access.
4. **Database → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/attendance-app?retryWrites=true&w=majority
   ```
   Make sure you add a database name (`attendance-app` above) before the `?`.

---

## 4. Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` → `backend/.env` and fill in real values:

```
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/attendance-app?retryWrites=true&w=majority
JWT_SECRET=some_long_random_string
JWT_EXPIRES_IN=7d
ADMIN_ID=admin
ADMIN_PASSWORD=choose_a_strong_password
CORS_ORIGIN=*
```

The Admin account is **not** stored in MongoDB — it's validated straight from `ADMIN_ID` /
`ADMIN_PASSWORD`. Never commit the real `.env` file (it's already in `.gitignore`).

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` → `frontend/.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

**Important:** when testing on your physical phone with Expo Go, `localhost` refers to the
*phone itself*, not your computer. You must use your computer's **local network IP address**
(see step 6 below). Switch this to your Render URL once deployed (step 8).

---

## 5. Backend — Local Setup

```bash
cd backend
npm install
cp .env.example .env      # then edit .env with your real values
npm run dev                # starts on http://localhost:5000 with nodemon
```

You should see:
```
MongoDB connected: cluster0-xxxxx.mongodb.net
Attendance API listening on port 5000
```

Test it's alive: open `http://localhost:5000/api/health` in a browser — you should get a JSON response.

---

## 6. Frontend — Local Setup (Expo Go on your Android phone)

```bash
cd frontend
npm install
```

1. **Make sure your computer and phone are on the same Wi-Fi network.**
2. Find your computer's local IPv4 address:
   - **Windows:** `ipconfig` → look for "IPv4 Address" (e.g. `192.168.1.100`)
   - **Mac/Linux:** `ifconfig | grep inet` or `ip addr`
3. Copy `frontend/.env.example` → `frontend/.env` and set:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
   ```
4. Start Expo:
   ```bash
   npx expo start
   ```
5. Install **Expo Go** on your Android phone from the Play Store if you haven't already.
6. Scan the QR code shown in the terminal/browser using the Expo Go app.
7. The app should load on your phone and hit your locally-running backend.

If you change `.env`, restart `npx expo start` (env vars are read at startup).

### First login

- **Admin:** use the `ADMIN_ID` / `ADMIN_PASSWORD` you set in `backend/.env`.
- **Volunteers:** none exist yet — log in as Admin first, go to **Volunteers → + Add Volunteer**
  to create one, then that volunteer can log in with their Volunteer ID/email + password.

### Typical first-run walkthrough

1. Login as Admin.
2. **Volunteers → + Add Volunteer** — create at least one volunteer account.
3. **Students → + Add Student** — add a few students (Student ID + Name required).
4. **Mark Attendance** — search, tap P/A per student (or "Mark All Present"), then **Save Attendance**.
5. **Reports** — see today's totals, tap a student to view their individual history.

---

## 7. Render Deployment (Backend)

1. Push this repo to GitHub.
2. Go to https://dashboard.render.com → **New → Web Service**.
3. Connect your GitHub repository.
4. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables (Render → your service → **Environment**), same keys as `backend/.env.example`:
   `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_ID`, `ADMIN_PASSWORD`, `CORS_ORIGIN`.
   (`PORT` is set automatically by Render — you don't need to add it; the server already reads
   `process.env.PORT` with a fallback.)
6. Click **Deploy**. Once live, Render gives you a URL like:
   ```
   https://your-backend.onrender.com
   ```
7. In `frontend/.env`, switch to:
   ```
   EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
   ```
8. Restart `npx expo start` — your phone app now talks to the deployed backend from anywhere
   (no longer needs the same Wi-Fi).

> Note: Render's free tier spins down after inactivity — the first request after idling can
> take ~30-50 seconds to respond while it wakes up. This is normal.

---

## 8. API Reference

All routes are prefixed `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | `{ id, password }` → `{ token, user }` |
| GET | `/auth/me` | Auth | Current user info |
| GET | `/students?search=&activeOnly=` | Auth | List/search students |
| POST | `/students` | Admin | Create student |
| PUT | `/students/:id` | Admin | Update student |
| DELETE | `/students/:id` | Admin | Delete student (+ their attendance) |
| GET | `/volunteers` | Admin | List volunteers |
| POST | `/volunteers` | Admin | Create volunteer |
| PUT | `/volunteers/:id` | Admin | Update volunteer |
| DELETE | `/volunteers/:id` | Admin | Delete volunteer |
| POST | `/attendance` | Auth | `{ date, records:[{studentId,status}] }` — upserts |
| GET | `/attendance?date=YYYY-MM-DD` | Auth | Attendance for one date |
| PUT | `/attendance/:id` | Auth | Update a single record |
| GET | `/attendance/student/:studentId` | Auth | Full history + stats for one student |
| GET | `/reports/daily?date=YYYY-MM-DD` | Auth | Daily totals + per-student status |

---

## 9. Troubleshooting

**"Network request failed" / "Unable to connect to server" in the app**
- Confirm the backend is actually running (`npm run dev` in `backend/`).
- Confirm phone and computer are on the **same Wi-Fi**.
- Confirm `EXPO_PUBLIC_API_URL` uses your computer's **LAN IP**, not `localhost`, and includes `/api` at the end.
- Some routers isolate devices from each other ("AP/client isolation") — try a phone hotspot instead if this happens.
- After editing `.env`, you must **restart** `npx expo start`.

**Cannot connect to MongoDB**
- Double-check `MONGODB_URI` — username/password must be URL-encoded if they contain special characters.
- In Atlas → Network Access, make sure your current IP (or `0.0.0.0/0`) is allowed.
- Make sure the database user has read/write permissions.

**JWT / "Session expired" errors**
- `JWT_SECRET` must be set in `backend/.env`. If you change it, all existing tokens become invalid (users must log in again).
- Tokens expire after `JWT_EXPIRES_IN` (default 7 days).

**Expo dependency / version errors**
- Run `npx expo install --fix` inside `frontend/` to align package versions with your installed Expo SDK.
- Make sure you're using Expo Go **57.0.9** (or newer within SDK 57) on your phone — old Expo Go versions won't open SDK 57 projects.

**Render deployment errors**
- Check the **Root Directory** is set to `backend`, not the repo root.
- Check every env var from `backend/.env.example` is set in Render's dashboard.
- Check Render's logs tab for the actual startup error (missing env var, bad Mongo URI, etc.).

**Duplicate attendance / duplicate student / duplicate volunteer errors**
- These are expected validation errors (unique `studentId`, unique `volunteerId`+`email`, unique `studentId`+`date` for attendance) — the API returns a clear message rather than crashing.

---

## 10. Notes

- Students do not log in in this version — only Admin and Volunteers authenticate.
- Admin credentials live only in environment variables, never in the database.
- Passwords for volunteers are hashed with bcrypt before being stored; password hashes are never returned by the API.
- Attendance dates are stored and compared as plain `YYYY-MM-DD` strings (computed in Asia/Kolkata) to avoid UTC day-shift bugs.
