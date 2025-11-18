import { Hands, Results } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import * as fp from "fingerpose";
import { useEffect, useRef } from "react";

export default function HandDetector() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,            // lower complexity = faster
      minDetectionConfidence: 0.8,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: Results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return; // no hands detected, skip
    }

    

    // Only track first detected hand
  const landmarks = results.multiHandLandmarks[0];

  // Index finger tip = landmark #8
  const indexTip = landmarks[8];

  // Coordinates are normalized between 0–1
  const x = indexTip.x;
  const y = indexTip.y;
  const z = indexTip.z;

  console.log("Index Tip:", { x, y, z });


    // --- Fingerpose example ---
    const GE = new fp.GestureEstimator([
      fp.Gestures.VictoryGesture,
      fp.Gestures.ThumbsUpGesture,
    ]);

    const est = GE.estimate(landmarks, 7);
    // console.log(est);

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


    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });

      camera.start();
    }
  }, []);

  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} width={640} height={480} />
    </div>
  );
}
