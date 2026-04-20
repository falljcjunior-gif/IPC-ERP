import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check } from 'lucide-react';

const SignaturePad = ({ onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (isEmpty) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSave) onSave(dataUrl);
  };

  return (
    <div className="signature-pad-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '500px' }}>
      <div 
        style={{ 
          border: '2px dashed var(--border-color)', 
          borderRadius: '1rem', 
          background: '#fff', 
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {isEmpty && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
            Signez ici
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          style={{ width: '100%', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn" onClick={clearPad} type="button" style={{ background: 'var(--bg-subtle)' }}>
          <Eraser size={16} /> Effacer
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onCancel && (
            <button className="btn" onClick={onCancel} type="button">
              Annuler
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={isEmpty} type="button">
            <Check size={16} /> Confirmer la signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
