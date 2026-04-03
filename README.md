# Solar Panel Classifier

This project contains a full-stack solution for classifying images of solar panels using a `.keras` deep learning model.

## Folder Structure

- **\`backend/\`**: A fully functional Python FastAPI server that uses TensorFlow/Keras to load \`solar_model.keras\` and serve predictions.
- **\`node_backend/\`**: A mock Node.js/Express server. Use this to quickly test the beautiful frontend locally if your python environment doesn't have TensorFlow installed.
- **\`frontend/\`**: A React application powered by Vite. Features glassmorphism, smooth animations, and a drag-and-drop interface.

## How to Run

### 1. The Frontend
The frontend uses Vite and React.
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
The application will run on \`http://localhost:5173\`.

### 2. The Backend (Python - Real Model)
The Python backend uses Keras 3 with the **PyTorch backend** (resolving TensorFlow compatibility issues on Windows). A script called `patch_model.py` was used to remove an incompatible bytecode Lambda layer from `solar_model.keras`, creating `solar_model_patched.keras` which is loaded dynamically.
\`\`\`bash
cd backend
python -m venv venv
# Activate venv on Windows: .\venv\Scripts\activate
# Activate venv on Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py
\`\`\`
The real backend will run on \`http://localhost:8000\`.

### 3. The Mock Backend (Node.js - For UI Testing)
If you encounter TensorFlow installation issues, you can run the mock backend to experience the UI.
\`\`\`bash
cd node_backend
npm install
node server.js
\`\`\`
The mock backend will also run on \`http://localhost:8000\` and return simulated predictions.

## Features
- **Frontend**: Responsive, modern, and aesthetically pleasing using dark mode/glassmorphism aesthetics.
- **Image Preprocessing**: The backend resizes uploaded images to fit the expected input dimensions of the `.keras` model, normalizing pixel values automatically.
- **Dynamic Classes**: Loads mapping directly from \`class_index.json\`.
