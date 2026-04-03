import React, { useState, useRef } from 'react';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    
    setError(null);
    setResult(null);
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // In production point this to the backend API
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze image. Ensure the backend is running.');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container">
      <div className="glass-card">
        <h1>Solar Panel Analysis</h1>
        <p className="subtitle">Upload a solar panel image to detect dust or anomalies</p>
        
        {!preview ? (
          <div 
            className={`upload-area ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="file-input" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
            />
            <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <h3 style={{ marginBottom: '8px', fontWeight: '600' }}>Click or drag image to upload</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Supports JPG, PNG, WEBP</p>
          </div>
        ) : (
          <div className="preview-container">
            <img src={preview} alt="Solar panel preview" className="preview-image" />
          </div>
        )}
        
        {error && (
          <div style={{ color: '#ef4444', marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
            {error}
          </div>
        )}
        
        {result ? (
          <div className="result-card">
            <div className="result-category">
              {result.prediction.toLowerCase() === 'dusty' ? '🧹' : '✨'} {result.prediction}
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span>Confidence Model Score</span>
              <span>{(result.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="confidence-bar-bg">
              <div 
                className="confidence-bar-fill" 
                style={{ width: `${result.confidence * 100}%` }}
              ></div>
            </div>
            
            <button className="reset-btn" onClick={resetForm}>
              Analyze Another Image
            </button>
          </div>
        ) : (
          <button 
            className="btn" 
            onClick={preview ? handleAnalyze : () => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span className="loader"></span> Processing...
              </span>
            ) : (
              preview ? 'Analyze Image' : 'Select Image'
            )}
          </button>
        )}
        
        {preview && !result && !loading && (
          <button className="reset-btn" onClick={resetForm} style={{ marginTop: '1rem' }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
