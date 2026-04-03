const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Read class mapping
let classMapping = { "0": "Clean", "1": "Dusty" };
try {
  const mappingPath = path.join(__dirname, '..', 'class_index.json');
  if (fs.existsSync(mappingPath)) {
    classMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  }
} catch (e) {
  console.log("Could not load class mapping, using default.");
}

app.post('/predict', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  // To simulate processing time
  setTimeout(() => {
    // Generate mock prediction since we cannot load .keras directly in Node without python or tfjs conversion
    const rand = Math.random();
    const classIdx = rand > 0.5 ? 1 : 0;
    const confidence = 0.75 + (Math.random() * 0.24); // 75% - 99%
    
    const label = classMapping[classIdx.toString()] || `Class ${classIdx}`;
    
    // Cleanup uploaded file
    fs.unlink(req.file.path, () => {});

    res.json({
      prediction: label,
      confidence: confidence,
      class_index: classIdx,
      mock_warning: "This is a simulated prediction. Real prediction requires the python backend."
    });
  }, 1500);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Mock Node Server running on http://localhost:${PORT}`);
  console.log(`To use the real model, please set up the Python FastAPI backend in the 'backend' folder.`);
});
