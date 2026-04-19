import React, { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    let html5QrCode;
    let isStopped = false;
    
    const startScanner = async () => {
      try {
        if (!window.Html5Qrcode) {
          throw new Error("Scanner Library not loaded");
        }
        
        // Timeout pour laisser le DOM render le div #reader
        setTimeout(async () => {
          try {
            html5QrCode = new window.Html5Qrcode("reader");
            
            await html5QrCode.start(
              { facingMode: "environment" }, // Utiliser la caméra arrière
              {
                fps: 10,
                qrbox: { width: 250, height: 250 }
              },
              (decodedText) => {
                // Succès -> Arrête le scanner et envoie le résultat
                if (!isStopped) {
                  isStopped = true;
                  html5QrCode.stop().then(() => {
                    onScan(decodedText);
                  }).catch(console.error);
                }
              },
              (errorMessage) => {
                // Ignore silent parsing errors frame by frame
              }
            );
          } catch(e) {
             setError("Erreur caméra : Vérifiez vos permissions de navigateur.");
          }
        }, 100);
      } catch (err) {
        console.error("Scanner Error:", err);
        setError("Impossible de charger le moteur de code-barres offline.");
      }
    };

    startScanner();

    return () => {
      isStopped = true;
      if (html5QrCode) {
        html5QrCode.stop().catch(error => {
          console.warn("L'arrêt du scanner a échoué:", error);
        });
      }
    };
  }, [onScan]);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9998 }} onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '400px',
          background: 'var(--bg)',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          zIndex: 9999,
          padding: '1.5rem',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
               <Camera size={20} color="var(--accent)" /> Scan Intelligent
           </div>
           <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)' }}>
               <X size={16} />
           </button>
        </div>

        <div style={{ position: 'relative', width: '100%', borderRadius: '1rem', overflow: 'hidden', background: '#000', minHeight: '300px' }}>
            {error ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>
                    {error}
                </div>
            ) : (
                <div id="reader" style={{ width: '100%' }}></div>
            )}
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Placez le code-barres (QR, EAN-13) au centre de l'encadré.
        </div>
      </motion.div>
    </>
  );
};

export default BarcodeScanner;
