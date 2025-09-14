import React, { useRef, useEffect, useState } from "react";

export default function CameraCapture() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [result, setResult] = useState("No scan yet");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch (err) {
        console.error("Camera error:", err);
        setResult("Camera not available");
      }
    }
    startCamera();
  }, []);

  async function captureAndSend() {
    setLoading(true);
    setResult("Scanning...");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", 0.8)
    );
    const fd = new FormData();
    fd.append("file", blob, "capture.jpg");

    try {
      const resp = await fetch("https://anirudhvishnu24-backend.hf.space/analyze", {

        method: "POST",
        body: fd,
      });
      const json = await resp.json();

      const labels = (json.detections || [])
        .map((d) => d.label)
        .join(", ");
      const texts = (json.ocr_texts || []).join(" ");

      const speakStr = labels
        ? `Detected: ${labels}. ${texts ? "Read text: " + texts : ""}`
        : texts
        ? `Read text: ${texts}`
        : "Nothing recognized.";

      setResult(speakStr);

      const utter = new SpeechSynthesisUtterance(speakStr);
      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
    } catch (err) {
      console.error("Error:", err);
      setResult("Error communicating with server.");
      const utter = new SpeechSynthesisUtterance(
        "Error communicating with server."
      );
      speechSynthesis.speak(utter);
    } finally {
      setLoading(false);
    }
  }

  function stopSpeech() {
    speechSynthesis.cancel();
    setResult("Speech stopped");
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0b74de, #2a5298)",
        fontFamily: "Arial, sans-serif",
        padding: 20
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 30,
          maxWidth: 500,
          width: "100%",
          boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
          textAlign: "center"
        }}
      >
        <h1 style={{ color: "#0b74de", marginBottom: 20 }}>
          VI Shopping Assistant
        </h1>

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            borderRadius: 10,
            border: "3px solid #0b74de"
          }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button
            onClick={captureAndSend}
            disabled={loading}
            style={{
              flex: 1,
              padding: "14px 0",
              fontSize: 18,
              borderRadius: 8,
              background: loading ? "#6c757d" : "#0b74de",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {loading ? "⏳ Scanning..." : "📷 Scan"}
          </button>
          <button
            onClick={stopSpeech}
            style={{
              flex: 1,
              padding: "14px 0",
              fontSize: 18,
              borderRadius: 8,
              background: "#d9534f",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            🛑 Stop
          </button>
        </div>

        <p
          style={{
            marginTop: 20,
            fontSize: 16,
            color: "#333",
            background: "#f5f5f5",
            padding: 12,
            borderRadius: 6,
            minHeight: 50,
            lineHeight: 1.4
          }}
        >
          <strong>Result:</strong> {result}
        </p>
      </div>
    </div>
  );
}
