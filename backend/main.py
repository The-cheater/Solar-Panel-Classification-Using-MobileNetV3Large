import io
import os
import json
import logging
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Set keras backend to torch before importing keras
os.environ["KERAS_BACKEND"] = "torch"
import keras

app = FastAPI(title="Solar Panel Classifier API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
class_mapping = {}

@app.on_event("startup")
async def load_resources():
    global model, class_mapping
    try:
        # Resolve paths
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base_dir, "solar_model_patched.keras")
        class_index_path = os.path.join(base_dir, "class_index.json")

        if os.path.exists(class_index_path):
            with open(class_index_path, "r") as f:
                class_mapping = json.load(f)
            logging.info("Class mapping loaded.")
        else:
            logging.warning("class_index.json not found.")

        if os.path.exists(model_path):
            model = keras.saving.load_model(model_path, safe_mode=True)
            logging.info(f"Model loaded successfully using PyTorch backend. Input shape: {model.input_shape if hasattr(model, 'input_shape') else 'unknown'}")
        else:
            logging.warning("solar_model.keras not found.")
            
    except Exception as e:
        logging.error(f"Error loading resources: {e}")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        # Resize based on model input shape, default 224x224
        target_size = (224, 224)
        if hasattr(model, 'input_shape') and model.input_shape is not None:
            shape = model.input_shape
            # For PyTorch backed Keras, shape might be (None, channels, height, width) or (None, height, width, channels)
            # Usually Keras model inputs are (None, H, W, C) regardless of backend if it was saved that way.
            if len(shape) == 4 and shape[1] is not None and shape[2] is not None:
                # Keras defaults to NHWC usually
                if shape[-1] == 3:
                    target_size = (shape[1], shape[2])
                elif shape[1] == 3:
                    target_size = (shape[2], shape[3])
                
        image = image.resize(target_size)
        img_array = np.array(image, dtype=np.float32)
        # PyTorch backed keras expects same layout as defined dynamically. Usually NHWC because it's a keras model.
        img_array = np.expand_dims(img_array, axis=0) # Shape: (1, H, W, C)

        # In Keras 3 with torch backend, model.predict works efficiently but expects numpy/torch tensor
        predictions = model.predict(img_array)
        
        # Determine the prediction output
        if isinstance(predictions, dict):
            # Getting the first (or 'cls' specifically) output from the dictionary
            if 'cls' in predictions:
                predictions = predictions['cls']
            else:
                predictions = list(predictions.values())[0]

        # Convert predictions back to numpy if it returned a torch tensor
        if hasattr(predictions, 'numpy'):
            predictions = predictions.numpy()
        
        # Binary or categorical check
        if predictions.shape[-1] == 1:
            prob = float(predictions[0][0])
            class_idx = 1 if prob > 0.5 else 0
            conf = prob if class_idx == 1 else 1.0 - prob
        else:
            class_idx = int(np.argmax(predictions[0]))
            conf = float(predictions[0][class_idx])
            
        label = class_mapping.get(str(class_idx), f"Class {class_idx}")
        
        return {
            "prediction": label,
            "confidence": conf
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
