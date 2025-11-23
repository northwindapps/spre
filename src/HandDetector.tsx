import { Hands, Results } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import * as fp from "fingerpose";
import { useEffect, useRef } from "react";
interface HandDetectorProps {
  onFingerMove?: (pos: { x: number; y: number; label: string }) => void;
}

export default function HandDetector({ onFingerMove }: HandDetectorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastLogRef = useRef<string>("");

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

  // --- Distance Helper ---
  const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  hands.onResults((results: Results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (stopped) return; // prevent sending after unmount
    if (!results.multiHandLandmarks) return;

    const landmarks = results.multiHandLandmarks[0];
    if (!landmarks || landmarks.length < 9) {
      return; // landmarks not fully available yet
    }
  
    const lm = results.multiHandLandmarks[0];
    const wrist = lm[0];
     

      // Define the landmarks for each finger
      // [Base, Joint1, Joint2, Tip]
      // Note: We need the PIP joint (2nd from bottom) for the check
      const fingers = [
        { name: "Thumb",  tipsIdx: 4,  compareIdx: 3,  indices: [1, 2, 3, 4] },   // Thumb compares Tip vs IP
        { name: "Index",  tipsIdx: 8,  compareIdx: 6,  indices: [5, 6, 7, 8] },   // Fingers compare Tip vs PIP
        { name: "Middle", tipsIdx: 12, compareIdx: 10, indices: [9, 10, 11, 12] },
        { name: "Ring",   tipsIdx: 16, compareIdx: 14, indices: [13, 14, 15, 16] },
        { name: "Pinky",  tipsIdx: 20, compareIdx: 18, indices: [17, 18, 19, 20] },
      ];

      const statuses: string[] = [];
      const statusMap: Record<string, "OPEN" | "CURL"> = {};

      // Loop through each finger to check status and draw
      fingers.forEach((finger) => {
        if (finger.name === "Thumb") {
          const thumbTip = lm[4];
          const thumbIP = lm[3];
          const indexMCP = lm[5];

          const isOpen =
            dist(thumbTip, indexMCP) > dist(thumbIP, indexMCP);
          
          statusMap["Thumb"] = isOpen ? "OPEN" : "CURL";

          statuses.push(`Thumb: ${isOpen ? "OPEN" : "CURL"}`);
          ctx.fillStyle = isOpen ? "#00FF00" : "#FF0000";
          
          for (const idx of finger.indices) {
            const p = lm[idx];
            ctx.beginPath();
            ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, Math.PI * 2);
            ctx.fill();
          }
          return; // skip default logic
        }

        const tip = lm[finger.tipsIdx];
        const pivot = lm[finger.compareIdx]; // PIP or IP joint

        // LOGIC: If Tip is further from Wrist than Pivot is, it is OPEN.
        const isOpen = dist(wrist, tip) > dist(wrist, pivot);

        statusMap[finger.name] = isOpen ? "OPEN" : "CURL";
        
        statuses.push(`${finger.name}: ${isOpen ? "OPEN" : "CURL"}`);

        // DRAWING: Color THIS finger's landmarks based on THIS finger's status
        ctx.fillStyle = isOpen ? "#00FF00" : "#FF0000"; // Green = Open, Red = Curl
        
        
        for (const idx of finger.indices) {
          const point = lm[idx];
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 6, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // --- Logging (Debounced) ---
      // Only log if the index or thumb status changes to avoid spam
      // const currentStatusStr = `${statuses[0]}, ${statuses[1]}`; // Log Thumb and Index
      const currentStatusStr = statuses.join(", ");
      if (currentStatusStr !== lastLogRef.current) {
        console.log(currentStatusStr);
        lastLogRef.current = currentStatusStr;
      }
      // share index inger movements
      if (statusMap["Index"] == "OPEN" && statusMap["Thumb"] == "CURL" && statusMap["Middle"] == "CURL"){
        const indexTip = lm[0];
        onFingerMove?.({ x: indexTip.x, y: indexTip.y, label: "cursor" });
      }
      if (statusMap["Index"] == "CURL" && statusMap["Thumb"] == "OPEN" && statusMap["Middle"] == "CURL"){
        const indexTip = lm[0];
        onFingerMove?.({ x: indexTip.x, y: indexTip.y, label: "click" });
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
      {/* <canvas ref={canvasRef} width={640} height={480} /> */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",    // stretches to parent width
          height: "100%",   // stretches to parent height
          objectFit: "cover", // optional, preserves aspect
        }}
      />
    </div>
  );
}
