import React, { useState, useRef, useEffect } from 'react';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Attach stream to video element when it becomes available
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  const startCamera = async () => {
    setError(null);
    setResult(null);
    setPreview(null);
    setFile(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      setError('Could not access the camera. Please allow camera permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPreview(dataUrl);
      
      // Convert to file
      canvas.toBlob((blob) => {
        const imageFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        setFile(imageFile);
      }, 'image/jpeg');
      
      stopCamera();
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'; // Assuming local backend runs at 8000
      const response = await fetch(`${apiUrl}/predict`, {
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
    stopCamera();
  };

  return (
    <div className="container">
      <div className="glass-card">
        <h1>Solar Panel Analysis</h1>
        <p className="subtitle">Capture a solar panel image to detect dust or anomalies</p>
        
        {!preview && !cameraActive && (
          <div className="upload-area" onClick={startCamera}>
            <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <h3 style={{ marginBottom: '8px', fontWeight: '600' }}>Click to Start Camera</h3>
          </div>
        )}

        {cameraActive && (
          <div className="preview-container">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="preview-image" 
              style={{ display: 'block', maxWidth: '100%' }}
            ></video>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn" onClick={captureImage}>Capture</button>
              <button className="reset-btn" onClick={stopCamera}>Cancel</button>
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        {preview && (
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
          preview && !cameraActive && (
            <button 
              className="btn" 
              onClick={handleAnalyze}
              disabled={loading}
              style={{ marginTop: '1rem' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span className="loader"></span> Processing...
                </span>
              ) : (
                'Analyze Image'
              )}
            </button>
          )
        )}
        
        {preview && !result && !loading && !cameraActive && (
          <button className="reset-btn" onClick={resetForm} style={{ marginTop: '1rem' }}>
            Retake Photo
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
