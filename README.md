---
title: Solar Panel Cleanliness Predictor
emoji: ☀️
colorFrom: yellow
colorTo: blue
sdk: docker
pinned: false
---

# Solar Panel Cleanliness Predictor Platform

A complete full-stack AI platform that captures real-time images of solar panels, classifies them as **clean** or **dusty** using a deep learning model, and logs the prediction results directly to a Firebase Realtime Database.

## 🌟 Platform Overview

This platform integrates a modern web frontend, a FastAPI backend, and a PyTorch-backed Keras model into a seamless pipeline:

1. **Capture**: A React frontend accesses the device's camera to capture real-time images of solar panels.
2. **Predict**: The image is sent to a Python FastAPI backend where an advanced AI model (ResNet18) evaluates it.
3. **Log**: The prediction result (including cleanliness score, dust severity, and timestamps) is automatically synced to a **Firebase Realtime Database** for monitoring and analytics.

## 🧠 The AI Model

At the core of the platform is a binary image classification model built using **transfer learning on ResNet18** (detailed fully in `model.md`). 

- **Backbone**: ResNet18 (ImageNet pretrained), which offers an excellent balance between accuracy and inference speed.
- **Output**: A single neuron (`Dense(1)`) with a Sigmoid activation that outputs a probability between 0 and 1.
- **Thresholding**: A score `> 0.5` classifies the panel as **dusty** (Severity 5), while `<= 0.5` is **clean** (Severity 0).
- **Format**: The model is saved in the Keras 3 format (`.keras`) and uses the PyTorch backend to avoid TensorFlow compatibility issues on Windows.

## 📂 Architecture & Folder Structure

- **`backend/`**: A Python FastAPI server that loads `solar_model_patched.keras` dynamically. It processes image inputs, runs the prediction, and pushes the structured data to the `prediction` node in Firebase using `firebase-admin`.
- **`frontend/`**: A React application powered by Vite. Features glassmorphism, modern UI/UX, direct camera access (`getUserMedia` API), and live status updates.
- **`model.md`**: Detailed technical documentation regarding the model's metrics (Accuracy, F1 Score) and validation pipeline.

## 🚀 How to Run Locally

### 1. Configure Firebase
1. Create a Firebase project with a Realtime Database.
2. Generate a new private key from **Project settings > Service accounts**.
3. Rename the downloaded file to `serviceAccountKey.json` and place it inside the `backend/` directory.

### 2. Start the Backend (FastAPI + AI Model)
```bash
cd backend
python -m venv venv
# Activate venv on Windows: .\venv\Scripts\activate
# Activate venv on Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py
```
The FastAPI server will start on `http://localhost:8000` and load the AI model into memory.

### 3. Start the Frontend (React UI)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. Allow camera permissions, capture an image, and click "Analyze Image" to see the magic happen!

## 📊 Firebase Data Schema

When a prediction is made, the backend automatically updates your Realtime Database with the following schema:
```json
"prediction": {
  "cleanliness_score": 75.21,
  "cls_probability": 0.7642,
  "dust_severity": 5,
  "label": "Clean",
  "score": 76.42,
  "stub": false,
  "timestamp": 1777744739001
}
```
