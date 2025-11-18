var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { useEffect, useRef } from "react";
export default function HandDetector({ onFingerMove }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    useEffect(() => {
        if (!videoRef.current)
            return;
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0,
            minDetectionConfidence: 0.8,
            minTrackingConfidence: 0.5,
        });
        let camera = null;
        let stopped = false;
        hands.onResults((results) => {
            if (stopped)
                return; // prevent sending after unmount
            if (!results.multiHandLandmarks)
                return;
            const landmarks = results.multiHandLandmarks[0];
            if (!landmarks || landmarks.length < 9) {
                return; // landmarks not fully available yet
            }
            const indexTip = landmarks[8];
            onFingerMove === null || onFingerMove === void 0 ? void 0 : onFingerMove({ x: indexTip.x, y: indexTip.y });
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
            onFrame: () => __awaiter(this, void 0, void 0, function* () {
                if (!videoRef.current || stopped)
                    return;
                yield hands.send({ image: videoRef.current });
            }),
            width: 640,
            height: 480,
        });
        camera.start();
        return () => {
            stopped = true;
            camera === null || camera === void 0 ? void 0 : camera.stop();
            hands.close();
        };
    }, [onFingerMove]);
    return (_jsxs("div", { children: [_jsx("video", { ref: videoRef, style: { display: "none" } }), _jsx("canvas", { ref: canvasRef, width: 640, height: 480 })] }));
}
