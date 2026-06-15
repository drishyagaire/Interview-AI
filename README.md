# Resumee - AI Interview Prep

## Local Development

1. **Backend Setup**:
   - Create a `.env` file in `Backend/` with:
     ```
     MONGO_URI=your_mongodb_url
     JWT_SECRET=your_jwt_secret
     GOOGLE_GENAI_API_KEY=your_google_ai_key
     ```
   - Run `cd Backend && npm install && npm run dev`

2. **Frontend Setup**:
   - Create a `.env` file in `Frontend/` with:
     ```
     VITE_API_URL=http://localhost:3000
     ```
   - Run `cd Frontend && npm install && npm run dev`

## Vercel Deployment

1. **Environment Variables**:
   - Set these in your Vercel project dashboard:
     - `MONGO_URI`
     - `JWT_SECRET`
     - `GOOGLE_GENAI_API_KEY`

2. **Deploy**:
   - Push code to GitHub
   - Import into Vercel
   - The `vercel.json` file will handle routing automatically

## Features

- Resume upload & parsing
- AI interview report generation
- Question bank & preparation plan
- Authentication (login/register)
