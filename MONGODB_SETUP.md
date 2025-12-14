# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Recommended - Cloud Database) ⭐

This is the easiest option and doesn't require installing anything locally.

### Steps:

1. **Create a MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up for a free account (M0 Free Tier)

2. **Create a Cluster**
   - Once logged in, click "Build a Database"
   - Choose the FREE M0 Shared cluster
   - Select a cloud provider and region (choose closest to you)
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter username and generate a secure password (SAVE THIS!)
   - Under "Database User Privileges", select "Atlas admin"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It will look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<username>` and `<password>` with your database user credentials

6. **Update .env File**
   - Open `backend/.env`
   - Update `MONGODB_URI` with your connection string:
   ```
   MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/wikisource-verifier?retryWrites=true&w=majority
   ```
   - Make sure to add the database name (`wikisource-verifier`) before the `?`

---

## Option 2: Install MongoDB Locally

### Windows Installation:

1. **Download MongoDB Community Server**
   - Go to https://www.mongodb.com/try/download/community
   - Select:
     - Version: Latest (7.0 or higher)
     - Platform: Windows
     - Package: MSI
   - Click "Download"

2. **Install MongoDB**
   - Run the downloaded .msi installer
   - Choose "Complete" installation
   - Install as a Windows Service (recommended)
   - Install MongoDB Compass (optional, GUI tool)
   - Click "Install"

3. **Verify Installation**
   - MongoDB should start automatically as a Windows service
   - Check if it's running:
     ```powershell
     Get-Service MongoDB
     ```

4. **Start MongoDB (if not running)**
   ```powershell
   Start-Service MongoDB
   ```

5. **Your .env file should already have the correct connection string:**
   ```
   MONGODB_URI=mongodb://localhost:27017/wikisource-verifier
   ```

---

## Option 3: Use Docker (If you have Docker installed)

1. **Pull MongoDB Image**
   ```bash
   docker pull mongo:latest
   ```

2. **Run MongoDB Container**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

3. **Your .env file should already have:**
   ```
   MONGODB_URI=mongodb://localhost:27017/wikisource-verifier
   ```

---

## After Setup

Once MongoDB is configured, restart your backend server:

```bash
cd backend
npm run dev
```

The server should now connect to MongoDB successfully!

---

## Troubleshooting

### MongoDB Atlas Connection Issues:
- Make sure your IP address is whitelisted in Network Access
- Verify the username and password in the connection string
- Check that the database name is included in the connection string

### Local MongoDB Issues:
- Check if MongoDB service is running: `Get-Service MongoDB`
- Start the service: `Start-Service MongoDB`
- Check MongoDB logs if connection fails

### Connection String Format:
- Local: `mongodb://localhost:27017/wikisource-verifier`
- Atlas: `mongodb+srv://username:password@cluster.mongodb.net/wikisource-verifier?retryWrites=true&w=majority`



