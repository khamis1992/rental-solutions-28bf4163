
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QRScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let stream: MediaStream | null = null;
    const start = async () => {
      if (!navigator.mediaDevices || !(window as any).BarcodeDetector) return;
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const scan = async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              navigate(`/field-ops/inspection/${encodeURIComponent(codes[0].rawValue)}`);
              return;
            }
          } catch {}
          requestAnimationFrame(scan);
        };
        scan();
      }
    };
    start();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [navigate]);

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Scan Vehicle QR Code</h1>
      <video ref={videoRef} className="w-full h-auto" />
    </div>
  );
}
