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
import * as fp from "fingerpose";
import { useEffect, useRef } from "react";
export default function HandDetector() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    useEffect(() => {
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0, // lower complexity = faster
            minDetectionConfidence: 0.8,
            minTrackingConfidence: 0.5,
        });
        hands.onResults((results) => {
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
                onFrame: () => __awaiter(this, void 0, void 0, function* () {
                    if (videoRef.current) {
                        yield hands.send({ image: videoRef.current });
                    }
                }),
                width: 640,
                height: 480,
            });
            camera.start();
        }
    }, []);
    return (_jsxs("div", { children: [_jsx("video", { ref: videoRef, style: { display: "none" } }), _jsx("canvas", { ref: canvasRef, width: 640, height: 480 })] }));
}
