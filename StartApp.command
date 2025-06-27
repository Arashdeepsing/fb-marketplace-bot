#!/bin/bash

cd "$(dirname "$0")"  # Change to the folder containing this script

# ✅ Check for Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install it from https://nodejs.org"
  exit 1
fi

# ✅ Install npm dependencies
echo "📦 Installing npm packages..."
npm install

# ✅ Check if Playwright is installed
if ! command -v npx &> /dev/null; then
  echo "❌ npx is required (comes with Node.js)."
  exit 1
fi

# ✅ Install Playwright if needed
npx playwright install

# ✅ Check for .env
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  echo "Please create a .env file with:"
  echo "FACEBOOK_EMAIL=your_email"
  echo "FACEBOOK_PASSWORD=your_password"
  exit 1
fi

# ✅ Run Facebook login to create auth.json
echo "🔐 Logging in to Facebook..."
node login.js

# ✅ Start the app
echo "🚀 Starting the Dealer Scanner App"
npm run dev
