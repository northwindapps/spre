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
    const lastLogRef = useRef("");
    let openPoseCount = 0;
    let openPoseCancelCount = 0;
    const REQUIRED_FRAMES = 20; // tune this (5–10 works well)
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
        // --- Distance Helper ---
        const dist = (p1, p2) => {
            return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        };
        hands.onResults((results) => {
            const ts = Date.now();
            const canvas = canvasRef.current;
            const ctx = canvas === null || canvas === void 0 ? void 0 : canvas.getContext("2d");
            if (!canvas || !ctx)
                return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            if (stopped)
                return; // prevent sending after unmount
            if (!results.multiHandLandmarks)
                return;
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
                { name: "Thumb", tipsIdx: 4, compareIdx: 3, indices: [1, 2, 3, 4] }, // Thumb compares Tip vs IP
                { name: "Index", tipsIdx: 8, compareIdx: 6, indices: [5, 6, 7, 8] }, // Fingers compare Tip vs PIP
                { name: "Middle", tipsIdx: 12, compareIdx: 10, indices: [9, 10, 11, 12] },
                { name: "Ring", tipsIdx: 16, compareIdx: 14, indices: [13, 14, 15, 16] },
                { name: "Pinky", tipsIdx: 20, compareIdx: 18, indices: [17, 18, 19, 20] },
            ];
            const statuses = [];
            const statusMap = {};
            // Loop through each finger to check status and draw
            fingers.forEach((finger) => {
                if (finger.name === "Thumb") {
                    const thumbTip = lm[4];
                    const thumbIP = lm[3];
                    const indexMCP = lm[5];
                    const isOpen = dist(thumbTip, indexMCP) > dist(thumbIP, indexMCP);
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
            //cancel
            if (statusMap["Index"] == "CURL" && statusMap["Thumb"] == "CURL" && statusMap["Middle"] == "CURL" && statusMap["Pinky"] == "CURL" && statusMap["Ring"] == "CURL") {
                const indexTip = lm[0];
                openPoseCancelCount += 1;
                if (REQUIRED_FRAMES >= openPoseCancelCount) {
                    openPoseCancelCount = 0;
                    onFingerMove === null || onFingerMove === void 0 ? void 0 : onFingerMove({ x: indexTip.x, y: indexTip.y, label: "cancel", ts: ts });
                }
            }
            // click
            if (statusMap["Index"] == "OPEN" && statusMap["Thumb"] == "OPEN" && statusMap["Middle"] == "OPEN" && statusMap["Pinky"] == "OPEN" && statusMap["Ring"] == "OPEN") {
                const indexTip = lm[0];
                openPoseCount += 1;
                if (REQUIRED_FRAMES >= openPoseCount) {
                    openPoseCount = 0;
                    onFingerMove === null || onFingerMove === void 0 ? void 0 : onFingerMove({ x: indexTip.x, y: indexTip.y, label: "click", ts: ts });
                }
            }
            // ok
            else if (statusMap["Index"] == "OPEN" && statusMap["Thumb"] == "CURL" && statusMap["Middle"] == "OPEN" && statusMap["Pinky"] == "CURL" && statusMap["Ring"] == "CURL") {
                const indexTip = lm[8];
                // openPoseCount = 0;
                onFingerMove === null || onFingerMove === void 0 ? void 0 : onFingerMove({ x: indexTip.x, y: indexTip.y, label: "ok", ts: ts });
            }
            // cursor
            else if (statusMap["Index"] == "OPEN" && statusMap["Thumb"] == "CURL" && statusMap["Middle"] == "CURL") {
                const indexTip = lm[8];
                openPoseCount = 0;
                onFingerMove === null || onFingerMove === void 0 ? void 0 : onFingerMove({ x: indexTip.x, y: indexTip.y, label: "cursor", ts: ts });
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
    return (_jsxs("div", { children: [_jsx("video", { ref: videoRef, style: { display: "none" } }), _jsx("canvas", { ref: canvasRef, style: {
                    width: "100%", // stretches to parent width
                    height: "100%", // stretches to parent height
                    objectFit: "cover", // optional, preserves aspect
                } })] }));
}
