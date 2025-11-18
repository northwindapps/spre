import { Hands, Results } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import * as fp from "fingerpose";
import { useEffect, useRef } from "react";
interface HandDetectorProps {
  onFingerMove?: (pos: { x: number; y: number }) => void;
}

export default function HandDetector({ onFingerMove }: HandDetectorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
  if (!videoRef.current) return;

  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.5,
  });

  let camera: Camera | null = null;
  let stopped = false;

  hands.onResults((results: Results) => {
    if (stopped) return; // prevent sending after unmount
    if (!results.multiHandLandmarks) return;

    const landmarks = results.multiHandLandmarks[0];
    if (!landmarks || landmarks.length < 9) {
      return; // landmarks not fully available yet
    }
    const indexTip = landmarks[8];
    onFingerMove?.({ x: indexTip.x, y: indexTip.y });

    // --- Draw landmarks ---
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        // draw landmarks
        for (const point of landmarks) {
          ctx.beginPath();
          ctx.arc(point.x * canvasRef.current.width, point.y * canvasRef.current.height, 5, 0, 2 * Math.PI);
          ctx.fillStyle = "red";
          ctx.fill();
        }
      }
    }
  });


  camera = new Camera(videoRef.current, {
    onFrame: async () => {
      if (!videoRef.current || stopped) return;
      await hands.send({ image: videoRef.current });
    },
    width: 640,
    height: 480,
  });

  camera.start();

  return () => {
    stopped = true;
    camera?.stop();
    hands.close();
  };
}, [onFingerMove]);


  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} width={640} height={480} />
    </div>
  );
}
