# Deployment Guide (No-VPS Strategy)

This guide covers deploying your Unified QA Automated Testing Platform using a **Fully Managed Free-Tier Architecture**. This approach avoids the need to manage a Linux VPS or Docker containers.

1. **Frontend**: Vercel (for high availability and fast static delivery).
2. **Backend**: Render (Cloud application hosting).
3. **Database**: MongoDB Atlas (Cloud database).
4. **Selenium Grid**: Browserless.io (Cloud browser automation).

---

## 1. Database (MongoDB Atlas)

You already have this! Your MongoDB Atlas cluster (`cluster0.4p69z47.mongodb.net`) is hosted in the cloud. Ensure you have your `MONGODB_URI` ready with the correct username and password.

---

## 2. Selenium Grid (Browserless.io)

Since we are not hosting our own Dockerized Selenium nodes, we will use a free cloud provider to run the automated browsers.

1. Go to [Browserless.io](https://www.browserless.io/) and create a free account (1000 free sessions/month).
2. Get your API key from their dashboard.
3. Your `SELENIUM_GRID_URL` will be:
   `wss://chrome.browserless.io/webdriver?token=YOUR_API_KEY`

---

## 3. Backend API (Render)

Render will host the Node.js API server. 

1. Go to [Render.com](https://render.com) and sign in with GitHub.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add your Environment Variables:
   - `MONGODB_URI`: (Your secure MongoDB URL)
   - `GEMINI_API_KEY`: (Your Gemini key)
   - `JWT_SECRET`: (A secure random string)
   - `SELENIUM_GRID_URL`: (The Browserless URL from Step 2)
6. Click **Create Web Service**. 

Render will automatically build and deploy your API. It will give you a free secure URL (e.g., `https://meghana-qa-backend.onrender.com`).

*Note: On the free tier, Render spins down after 15 minutes of inactivity. The first request after a period of inactivity may take ~50 seconds to wake up the server.*

---

## 4. Frontend (Vercel)

Vercel is ideal for our React frontend because it natively handles single-page application routing (`vercel.json`) and CDN distribution.

1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** -> **Project** and import your GitHub repository.
3. In the project settings, set the **Framework Preset** to `Vite`.
4. Set the **Root Directory** to `client`.
5. Add the following Environment Variable:
   - `VITE_API_URL`: The URL Render gave you in Step 3, plus `/api` (e.g., `https://meghana-qa-backend.onrender.com/api`).
6. Click **Deploy**.

Vercel will build and deploy the frontend. It will automatically route API requests to your Render backend, which in turn will use Browserless for Selenium tests and MongoDB Atlas for data!

🎉 **Deployment Complete!**
