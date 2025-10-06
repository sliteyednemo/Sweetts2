import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const App = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initialize Gemini AI, assuming API_KEY is in the environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // --- Local device TTS ---
    const speak = (text: string) => {
        if (!text) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            if (voice) {
                utterance.voice = voice;
            }
            utterance.lang = 'id-ID';
            utterance.onerror = (event) => {
                const typedEvent = event as SpeechSynthesisErrorEvent;
                console.error("Local SpeechSynthesisUtterance.onerror", typedEvent.error);
                setError(`Gagal mengucapkan deskripsi. Kesalahan: ${typedEvent.error}. Fitur suara mungkin tidak didukung.`);
            };
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error("Error with local speech synthesis:", e);
            setError("Fitur suara tidak tersedia di browser ini.");
        }
    };

    // Setup camera and TTS voices on component mount
    useEffect(() => {
        // --- Voice Setup for local TTS ---
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            const indonesianVoice = availableVoices.find(v => v.lang === 'id-ID') || availableVoices.find(v => v.lang.startsWith('id'));
            if (indonesianVoice) {
                setVoice(indonesianVoice);
            }
        };

        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // Also call it directly in case voices are already available

        // --- Camera Setup ---
        async function setupCamera() {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    // Request camera with preference for the rear camera
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' }
                    });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("Error accessing camera:", err);
                    const errorMessage = "Tidak dapat mengakses kamera. Silakan periksa izin browser Anda.";
                    setError(errorMessage);
                    // Do not speak here, as it's not a user-initiated action and may be blocked.
                }
            } else {
                 const errorMessage = "Browser Anda tidak mendukung akses kamera.";
                 setError(errorMessage);
                 // Do not speak here, as it's not a user-initiated action and may be blocked.
            }
        }
        setupCamera();

        // --- Cleanup ---
        return () => {
            // Stop video stream when component unmounts
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            // Stop any playing speech on unmount
            window.speechSynthesis.cancel();
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const captureAndDescribe = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setDescription('');
        setError('');
        speak("Menganalisis...");

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas && video.readyState >= 2) { // Ensure video has enough data
            const context = canvas.getContext('2d');
            if (context) {
                // Set canvas dimensions to match video to capture full frame
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert canvas to base64 JPEG
                const dataUrl = canvas.toDataURL('image/jpeg');
                const base64Data = dataUrl.split(',')[1];

                try {
                    const imagePart = {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Data,
                        },
                    };
                    
                    const textPart = {
                         text: "Jelaskan gambar ini dalam satu atau dua kalimat singkat untuk orang tunanetra dalam Bahasa Indonesia. Prioritaskan penyebutan jumlah uang atau rintangan."
                    };

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: { parts: [imagePart, textPart] },
                    });

                    const resultText = response.text;
                    setDescription(resultText);
                    speak(resultText);

                } catch (err) {
                    console.error("Error with Gemini API:", err);
                    const errorMessage = "Maaf, saya tidak dapat mendeskripsikan gambar. Silakan coba lagi.";
                    setError(errorMessage);
                    speak(errorMessage);
                }
            }
        } else {
             const errorMessage = "Kamera belum siap. Mohon tunggu sejenak dan coba lagi.";
             setError(errorMessage);
             speak(errorMessage);
        }
        setIsLoading(false);
    };
    
    // CSS-in-JS for styling the application
    const styles: { [key: string]: React.CSSProperties } = {
        container: {
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
        },
        video: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
        },
        overlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxSizing: 'border-box',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
        },
        overlayDisabled: {
            cursor: 'not-allowed',
        },
        descriptionBox: {
            position: 'absolute',
            bottom: '20px',
            left: '10px',
            right: '10px',
            width: 'calc(100% - 20px)',
            maxHeight: '120px',
            overflowY: 'auto',
            color: '#fff',
            textAlign: 'center',
            fontSize: '18px',
            lineHeight: '1.4',
            textShadow: '1px 1px 3px black',
        },
        topText: {
            position: 'absolute',
            top: '30px',
            left: '10px',
            right: '10px',
            color: '#fff',
            textAlign: 'center',
            fontSize: '18px',
            textShadow: '1px 1px 3px black',
        },
        spinner: {
            border: '8px solid rgba(255, 255, 255, 0.3)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            borderLeftColor: '#ffffff',
            animation: 'spin 1s linear infinite',
        },
    };

    return (
        <div style={styles.container}>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
            <video ref={videoRef} autoPlay playsInline muted style={styles.video} aria-hidden="true"></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            
            <div
                onClick={captureAndDescribe}
                role="button"
                aria-disabled={isLoading}
                aria-label="Analisis gambar dengan sentuhan"
                style={{
                    ...styles.overlay,
                    ...(isLoading ? styles.overlayDisabled : {})
                }}
            >
                {!isLoading && !description && !error && (
                    <div style={styles.topText}>
                        Sentuh dimana saja untuk menganalisa.
                    </div>
                )}
                {isLoading && (
                    <div style={styles.spinner} aria-label="Menganalisis"></div>
                )}
                <div style={styles.descriptionBox} aria-live="polite">
                    {description || error}
                </div>
            </div>
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}