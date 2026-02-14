import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={wrap}>
      <div style={bg1} />
      <div style={bg2} />

      <div style={content}>
        <div style={pill}>IoT • Live readings • Alerts • History</div>

        <h1 style={title}>
          Monitor your sensors <span style={grad}>beautifully</span>.
        </h1>

        <p style={desc}>
          Real-time dashboard with charts, history, and email alerts when thresholds breach.
        </p>

        <div style={btnRow}>
          <Link to="/dashboard" style={primaryBtn}>Open Dashboard</Link>
        </div>

        <div id="features" style={grid}>
          <div style={card}><b>Live Cards</b><div style={muted}>Auto-updated every 5 minutes</div></div>
          <div style={card}><b>Trends</b><div style={muted}>Temperature, humidity & pressure</div></div>
          <div style={card}><b>Alerts</b><div style={muted}>Email notifications on breach</div></div>
        </div>
      </div>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background: "radial-gradient(1200px 600px at 20% 20%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(900px 500px at 80% 40%, rgba(34,197,94,0.20), transparent 55%), #050814",
  color: "#E5E7EB",
  fontFamily: "Inter, system-ui, sans-serif",
};

const bg1 = {
  position: "absolute",
  inset: "-20%",
  background: "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.35), transparent 40%)",
  filter: "blur(40px)",
};

const bg2 = {
  position: "absolute",
  inset: "-30%",
  background: "radial-gradient(circle at 75% 50%, rgba(34,197,94,0.28), transparent 45%)",
  filter: "blur(55px)",
};

const content = {
  position: "relative",
  maxWidth: 980,
  margin: "0 auto",
  padding: "90px 22px 70px",
};

const pill = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  fontWeight: 800,
  fontSize: 12,
  letterSpacing: 0.6,
};

const title = {
  margin: "18px 0 10px",
  fontSize: 54,
  lineHeight: 1.05,
  fontWeight: 950,
};

const grad = {
  background: "linear-gradient(135deg, rgba(99,102,241,1), rgba(34,197,94,1))",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const desc = {
  margin: 0,
  maxWidth: 620,
  color: "#9CA3AF",
  fontWeight: 700,
  fontSize: 16,
  lineHeight: 1.6,
};

const btnRow = { display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" };

const primaryBtn = {
  textDecoration: "none",
  padding: "12px 18px",
  borderRadius: 14,
  color: "white",
  fontWeight: 900,
  background: "linear-gradient(135deg, rgba(99,102,241,0.95), rgba(34,197,94,0.85))",
  boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
};

const secondaryBtn = {
  textDecoration: "none",
  padding: "12px 18px",
  borderRadius: 14,
  color: "#E5E7EB",
  fontWeight: 900,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const grid = {
  marginTop: 36,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const card = {
  padding: 16,
  borderRadius: 16,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const muted = { marginTop: 6, color: "#9CA3AF", fontWeight: 700, fontSize: 13 };