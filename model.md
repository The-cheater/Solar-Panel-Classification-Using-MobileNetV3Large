# Solar Panel Classifier — Model Overview

A binary image classification model that identifies whether a solar panel is **clean** or **dusty**, built with transfer learning on ResNet18 and evaluated using sklearn metrics.

---

## What This Model Does (Plain English)

You feed the model a photo of a solar panel. It outputs a single number between 0 and 1 — a confidence score. If that score is above 0.5, the panel is classified as **dusty**. Below 0.5 and it's **clean**.

After running through an entire validation dataset, the script reports how often the model was right (accuracy), how balanced its errors were (F1 score), and shows a colour-coded confusion matrix so you can see exactly where it succeeded or failed.

---

## Model Architecture

| Component | Detail |
|---|---|
| Backbone | ResNet18 (ImageNet pretrained) |
| Fine-tuning strategy | Transfer learning — pretrained weights, custom head |
| Output head | `Dense(1)` — single neuron |
| Activation | Sigmoid → outputs probability in \[0, 1\] |
| Output key | `preds['cls']` (multi-output Keras model) |
| Decision threshold | `prob > 0.5` → class 1 (dusty), else class 0 (clean) |

### Why ResNet18?

ResNet18 is a convolutional neural network with 18 layers and skip (residual) connections. These skip connections solve the vanishing gradient problem, letting gradients flow cleanly during backpropagation. For a two-class visual task like this, it's an excellent balance between accuracy and inference speed.

Transfer learning reuses the feature extraction layers (edges, textures, patterns) already learned from 1.2 million ImageNet images. Only the final classification head is trained from scratch on solar panel data — so you get strong results even with a small dataset.

---

## Pipeline Walk-Through

### Step 1 — Data loading

```python
for imgs, labels in val_ds:
```

`val_ds` is a batched `tf.data.Dataset`. Each iteration yields a batch of images and their corresponding ground-truth labels, both structured as dicts with a `'cls'` key.

### Step 2 — Inference

```python
preds = model.predict(imgs, verbose=0)
y_pred_probs.extend(preds['cls'].flatten())
```

`model.predict()` runs a forward pass. The `'cls'` output is a sigmoid probability per image, flattened into a 1D array and accumulated across all batches.

### Step 3 — Label extraction

```python
y_true.extend(labels['cls'].numpy().flatten())
```

Ground-truth labels are pulled from the dataset's label dict, converted from tensors to numpy arrays, and accumulated alongside the predictions.

### Step 4 — Thresholding

```python
y_pred_binary = (y_pred_probs > 0.5).astype(int)
```

Probabilities become hard class assignments. 0.5 is the standard threshold for a sigmoid — adjust lower if you want higher recall for dusty panels (fewer missed detections), or higher if you want fewer false alarms.

### Step 5 — Metric computation

```python
acc = accuracy_score(y_true, y_pred_binary)
f1  = f1_score(y_true, y_pred_binary)
```

**Accuracy** — fraction of all predictions that were correct.  
**F1 Score** — harmonic mean of precision and recall. More robust than accuracy on imbalanced datasets (e.g. if clean panels vastly outnumber dusty ones).

### Step 6 — Classification report

```python
classification_report(y_true, y_pred_binary, target_names=class_names)
```

Prints per-class precision, recall, F1, and support. Tells you whether the model struggles specifically with one class.

### Step 7 — Confusion matrix

```python
cm = confusion_matrix(y_true, y_pred_binary)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ...)
```

A 2×2 grid showing:

|  | Predicted clean | Predicted dusty |
|---|---|---|
| **Actually clean** | True Negatives (TN) | False Positives (FP) |
| **Actually dusty** | False Negatives (FN) | True Positives (TP) |

High numbers on the diagonal = model is working well.

---

## Key Metrics Explained

**Precision** — of all panels predicted dusty, how many actually were?  
High precision = fewer false alarms.

**Recall** — of all actually dusty panels, how many did the model catch?  
High recall = fewer missed dusty panels.

**F1 Score** — single number balancing precision and recall.  
`F1 = 2 × (Precision × Recall) / (Precision + Recall)`

**Accuracy** — total correct predictions / total predictions.  
Can be misleading if class distribution is skewed.

---

## File Structure

```
project/
├── model/               # Saved Keras model weights
├── data/
│   ├── train/           # Training images (clean/ dusty/)
│   └── val/             # Validation images (clean/ dusty/)
├── evaluate.py          # This evaluation script
├── train.py             # Training script (ResNet18 + transfer learning)
├── predict.py           # Single-image inference
└── export.py            # FastAPI server + deployment artifacts
```

---

## Dependencies

```
tensorflow / keras
numpy
scikit-learn
seaborn
matplotlib
```

---

## Running Evaluation

```bash
python evaluate.py
```

Expected output:
```
🔄 Generating predictions for validation set...

==============================
✅ Final Accuracy: 0.9450
✅ Final F1 Score: 0.9312
==============================

📋 Detailed Classification Report:
              precision    recall  f1-score   support
       clean       0.95      0.94      0.95       200
       dusty       0.93      0.95      0.94       180
```

---

## Tuning the Threshold

The default threshold is `0.5`. For deployment in the field where missing a dusty panel is costly, lower it:

```python
threshold = 0.35  # catches more dusty panels, at cost of more false alarms
y_pred_binary = (y_pred_probs > threshold).astype(int)
```

Plot a PR curve or ROC curve to find the optimal operating point for your use case.

---

## Deployment

The `export.py` script packages this model as a FastAPI server with:

- `/predict` endpoint — accepts an image, returns class label + confidence score
- Severity scoring — maps confidence to a dustiness severity level
- Packaged deployment artifacts ready for containerisation
