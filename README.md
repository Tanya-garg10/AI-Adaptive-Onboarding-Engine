# 🚀 AI-Adaptive Onboarding Engine

An intelligent, AI-powered onboarding system that analyzes resumes and job descriptions to identify skill gaps and generate personalized learning roadmaps across multiple domains (engineering, management, healthcare, and more).

## 🧠 Problem Statement

Traditional onboarding follows a one-size-fits-all approach:
- Experienced hires waste time on known topics  
- Beginners struggle with advanced modules  

Our solution dynamically adapts onboarding based on a candidate’s existing skills and target role requirements.

## 💡 Solution Overview

The AI-Adaptive Onboarding Engine:
- Extracts skills from Resume & Job Description  
- Performs skill-gap analysis  
- Generates a personalized learning roadmap  
- Provides a readiness score and explainable recommendations  

## ✨ Features

- 🧠 **Readiness Score (%)**  
- 📊 **Visual Skill Dashboard (Covered / Missing / Partial)**  
- 🛣️ **Timeline-Based Learning Roadmap**  
- 🔍 **Skill Gap Analysis**  
- 🧠 **Explainable Recommendations (Reasoning Trace)**  
- 📥 **Download Report (PDF)**  
- 🎯 **Role Templates (Multi-domain support)**  

## 🏗️ Project Structure

```

AI-Adaptive-Onboarding-Engine/
│
├── frontend/        # React + Vite UI
├── backend/         # Node.js Express server (PDF parsing & APIs)
├── data/            # Sample resumes & job descriptions
├── screenshots/     # UI screenshots
├── README.md

```

## ⚙️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS

### Backend
- Node.js
- Express.js

### AI / Processing
- NLP-based skill extraction
- Rule-based + similarity matching

### Tools
- PDF parsing (pdf-parse / pdfplumber)
- JSON-based skill & course catalogs

## 🔄 Project Workflow

```

Resume + JD Input
↓
Text Extraction (PDF Parser)
↓
Skill Extraction (NLP)
↓
Skill Gap Analysis
↓
Adaptive Roadmap Generation
↓
Dashboard + Report Output

```

## 🔍 Skill Gap Analysis Logic

1. Extract skills from Resume  
2. Extract required skills from Job Description  
3. Normalize skills using a predefined catalog  
4. Compare both sets:
   - ✅ Covered Skills  
   - ⚠️ Partial Skills  
   - ❌ Missing Skills  
5. Calculate Readiness Score:
```

Readiness Score = (Matched Skills / Total Required Skills) × 100

````

## 🧠 Adaptive Learning Path Logic

- Skips already known skills  
- Prioritizes missing critical skills  
- Follows prerequisite-based sequencing  
- Generates a structured timeline roadmap  

## 📊 Example Output

- **Readiness Score:** 68%  
- **Missing Skills:** SQL, APIs  
- **Roadmap:**
  - Week 1: SQL Basics  
  - Week 2: Advanced SQL  
  - Week 3: API Fundamentals  
  - Week 4: Mini Project  

## 🛠️ Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/AI-Adaptive-Onboarding-Engine.git
cd AI-Adaptive-Onboarding-Engine
````

### 2. Setup Backend

```bash
cd backend
npm install
npm start
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📦 Dependencies

### Backend

* express
* pdf-parse
* cors

### Frontend

* react
* vite
* tailwindcss

## ▶️ Run Locally

* Backend: [http://localhost:5000](http://localhost:5000)
* Frontend: [http://localhost:5173](http://localhost:5173)

## 🌍 Multi-Domain Support

This system is designed to work across multiple domains:

* 💻 Engineering
* 📊 Management
* 💊 Healthcare / Pharma
* 🎨 Creative / Arts

## 🚀 Future Improvements

* LLM-based advanced skill extraction
* Real-time course recommendations (Coursera, YouTube APIs)
* User authentication & profiles
* Deployment on cloud (AWS / Vercel)
* Graph-based learning visualization

## 📌 Conclusion

This project transforms onboarding into a **personalized, efficient, and intelligent experience**, reducing redundant training and improving role readiness.

## 👩‍💻 Author

**Tanya Garg**
