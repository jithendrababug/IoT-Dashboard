import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.wrap}>
      {/* animated gradient blobs */}
      <div style={styles.blobA} />
      <div style={styles.blobB} />
      <div style={styles.grid} />

      <div style={styles.container}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={styles.brand}>
            <div style={styles.logoDot} />
            <span style={styles.brandText}>Fresh IoT</span>
          </div>
          <button style={styles.ghostBtn} onClick={() => navigate("/dashboard")}>
            Open Dashboard →
          </button>
        </div>

        {/* Hero */}
        <div style={styles.hero}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={styles.badge}
          >
            ⚡ Real-time monitoring • 📧 Email alerts (Resend) • 🕒 IST time sync
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            style={styles.h1}
          >
            Monitor sensors in real-time.
            <br />
            Get alerts when thresholds breach.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
            style={styles.p}
          >
            A modern IoT dashboard that tracks Temperature, Humidity, and Pressure with
            automatic email notifications — clean UI, fast updates, and alert history.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            style={styles.ctaRow}
          >
            <button style={styles.primaryBtn} onClick={() => navigate("/dashboard")}>
              🚀 Launch Dashboard
            </button>

            <button
              style={styles.secondaryBtn}
              onClick={() => {
                const el = document.getElementById("features");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Features
            </button>
          </motion.div>

          {/* floating cards */}
          <div style={styles.cardsRow}>
            <FloatingCard title="Temperature" value="27.5°C" sub="Stable" />
            <FloatingCard title="Humidity" value="50.1%" sub="Normal range" />
            <FloatingCard title="Pressure" value="1026.8 hPa" sub="Monitor" />
          </div>
        </div>

        {/* Features */}
        <div id="features" style={styles.features}>
          <Feature
            title="Live sensor simulation"
            text="Consistent 5-minute interval readings with clean charts and recent history."
          />
          <Feature
            title="Smart email alerts"
            text="Email triggers only when thresholds breach, with cooldown protection."
          />
          <Feature
            title="Alert history"
            text="Every breach is stored and visible instantly in the alert history section."
          />
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Built for your IoT Dashboard project • Modern UI</span>
          <span style={styles.footerText}>© {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* local keyframes */}
      <style>{keyframes}</style>
    </div>
  );
}

function Feature({ title, text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      style={styles.featureCard}
    >
      <div style={styles.featureTitle}>{title}</div>
      <div style={styles.featureText}>{text}</div>
    </motion.div>
  );
}

function FloatingCard({ title, value, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={styles.floatCard}
    >
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
      <div style={styles.cardSub}>{sub}</div>
    </motion.div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    background: "radial-gradient(1200px 600px at 20% 10%, #e0e7ff 0%, transparent 60%), radial-gradient(900px 500px at 80% 20%, #cffafe 0%, transparent 55%), #0b1020",
    color: "#e5e7eb",
    position: "relative",
    overflow: "hidden",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
    backgroundSize: "52px 52px",
    maskImage: "radial-gradient(circle at 40% 30%, black 0%, transparent 60%)",
    opacity: 0.6,
    pointerEvents: "none",
  },
  blobA: {
    position: "absolute",
    width: 520,
    height: 520,
    left: -180,
    top: -220,
    background: "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.55), rgba(99,102,241,0) 70%)",
    filter: "blur(10px)",
    animation: "floatA 8s ease-in-out infinite",
    pointerEvents: "none",
  },
  blobB: {
    position: "absolute",
    width: 520,
    height: 520,
    right: -220,
    top: -120,
    background: "radial-gradient(circle at 40% 40%, rgba(34,211,238,0.45), rgba(34,211,238,0) 70%)",
    filter: "blur(12px)",
    animation: "floatB 9s ease-in-out infinite",
    pointerEvents: "none",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "28px 18px 36px",
    position: "relative",
    zIndex: 2,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 34,
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  logoDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    boxShadow: "0 0 0 6px rgba(99,102,241,0.15)",
  },
  brandText: { fontWeight: 900, letterSpacing: 0.2 },
  ghostBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    fontWeight: 800,
    cursor: "pointer",
    backdropFilter: "blur(6px)",
  },
  hero: {
    padding: "34px 18px",
    borderRadius: 22,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 30px 120px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 800,
    color: "#e5e7eb",
    fontSize: 13,
    marginBottom: 16,
  },
  h1: {
    margin: 0,
    fontSize: "clamp(30px, 5vw, 52px)",
    lineHeight: 1.05,
    letterSpacing: -0.8,
    fontWeight: 950,
  },
  p: {
    marginTop: 12,
    marginBottom: 18,
    maxWidth: 720,
    color: "rgba(229,231,235,0.88)",
    fontSize: 15.5,
    lineHeight: 1.6,
    fontWeight: 600,
  },
  ctaRow: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 },
  primaryBtn: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "#071021",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 12px 36px rgba(34,211,238,0.15)",
  },
  secondaryBtn: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
    backdropFilter: "blur(6px)",
  },
  cardsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginTop: 10,
  },
  floatCard: {
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 18px 70px rgba(0,0,0,0.25)",
    animation: "floatCard 5.5s ease-in-out infinite",
  },
  cardTitle: { fontWeight: 900, color: "rgba(229,231,235,0.9)", marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: 950, letterSpacing: -0.5 },
  cardSub: { marginTop: 8, color: "rgba(229,231,235,0.72)", fontWeight: 700, fontSize: 13 },
  features: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  featureCard: {
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  featureTitle: { fontWeight: 950, marginBottom: 8 },
  featureText: { color: "rgba(229,231,235,0.75)", fontWeight: 650, lineHeight: 1.55, fontSize: 14 },
  footer: {
    marginTop: 26,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    opacity: 0.9,
  },
  footerText: { color: "rgba(229,231,235,0.65)", fontWeight: 700, fontSize: 13 },
};

const keyframes = `
@keyframes floatA {
  0%,100% { transform: translate(0px, 0px) scale(1); opacity: 0.95; }
  50% { transform: translate(30px, 26px) scale(1.04); opacity: 1; }
}
@keyframes floatB {
  0%,100% { transform: translate(0px, 0px) scale(1); opacity: 0.9; }
  50% { transform: translate(-24px, 22px) scale(1.03); opacity: 1; }
}
@keyframes floatCard {
  0%,100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@media (max-width: 820px) {
  .cards { grid-template-columns: 1fr; }
}
`;