import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const hoverLift = {
  whileHover: { y: -4, scale: 1.01 },
  transition: { type: "spring", stiffness: 260, damping: 18 },
};

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function useSpotlight() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return ref;
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 20, mass: 0.2 });

  return (
    <motion.div className="scrollBarWrap" aria-hidden="true">
      <motion.div className="scrollBar" style={{ scaleX: smooth }} />
    </motion.div>
  );
}

function Section({ id, title, children }) {
  return (
    <motion.section
      id={id}
      className="homeSection"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.22 }}
      variants={fadeUp}
    >
      <div className="sectionHeader">
        <h2 className="sectionH">{title}</h2>
        <div className="sectionLine" />
      </div>
      {children}
    </motion.section>
  );
}

function Feature({ title, desc, index }) {
  return (
    <motion.div className="glassCard featureCard" variants={fadeUp} {...hoverLift}>
      <div className="featureTop">
        <span className="featureIndex">{String(index).padStart(2, "0")}</span>
        <span className="featureDot" />
      </div>
      <div className="featureTitle">{title}</div>
      <div className="featureDesc">{desc}</div>
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const spotlightRef = useSpotlight();

  // lightweight particles (stable positions)
  const particles = useMemo(() => {
    const count = 18;
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const size = 2 + Math.random() * 4;
      const dur = 10 + Math.random() * 16;
      const delay = Math.random() * 6;
      const drift = 10 + Math.random() * 24;
      return { id: i, left, top, size, dur, delay, drift };
    });
  }, []);

  const [active, setActive] = useState("");
  useEffect(() => {
    const ids = ["about", "features", "how", "stack", "cta"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const topMost = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (topMost?.target?.id) setActive(topMost.target.id);
      },
      { threshold: [0.15, 0.25, 0.4] }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const features = [
    { title: "Live Sensor Cards", desc: "Instant summary of current readings with polished UI." },
    { title: "Trends Chart", desc: "Visualize sensor changes over time for quick insights." },
    { title: "Alert History", desc: "Breaches stored and shown in a clean table view." },
    { title: "Email Alerts", desc: "Notifications sent only when thresholds breach after enabling." },
    { title: "Cooldown Logic", desc: "Prevents email spam during frequent breach bursts." },
    { title: "Responsive Design", desc: "Smooth layout on desktop and mobile screens." },
  ];

  return (
    <div className="page homePage" ref={spotlightRef}>
      <ScrollProgress />

      {/* Background accents */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-grid" />
      <div className="spotlight" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />

      {/* particles */}
      <div className="particles" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              "--drift": `${p.drift}px`,
            }}
          />
        ))}
      </div>

      <div className="container">
        {/* Top Nav */}
        <div className="homeNav">
          <div className="brand">
            <span className="brandDot" />
            <span className="brandText">IoT Dashboard</span>
          </div>

          <div className="navLinks">
            <a href="#about" className={`navLink ${active === "about" ? "navActive" : ""}`}>About</a>
            <a href="#features" className={`navLink ${active === "features" ? "navActive" : ""}`}>Features</a>
            <a href="#how" className={`navLink ${active === "how" ? "navActive" : ""}`}>How it works</a>
            <a href="#stack" className={`navLink ${active === "stack" ? "navActive" : ""}`}>Tech</a>
          </div>

          <button className="btn btnPrimary" onClick={() => navigate("/dashboard")}>
            View Live Dashboard
          </button>
        </div>

        {/* HERO */}
        <motion.div className="hero" initial="hidden" animate="show" variants={stagger}>
          <motion.div className="heroLeft" variants={fadeUp}>
            <div className="heroBadge">Live Monitoring • Alerts • Analytics</div>

            <h1 className="heroTitle">
              IoT Sensor Dashboard
              <span className="heroGlow"> — Real-time Visibility</span>
            </h1>

            <p className="heroDesc">
              Track temperature, humidity, and pressure with a modern dashboard UI.
              Enable email alerts for threshold breaches and review alert history anytime.
            </p>

            <div className="heroActions">
              <button className="btn btnPrimary" onClick={() => navigate("/dashboard")}>
                🚀 View Live Dashboard
              </button>
              <a className="btn btnGhost" href="#how">See How It Works</a>
            </div>

            <div className="heroMeta">
              <div className="metaItem"><span className="metaDot dot1" />Auto refresh every 5 minutes</div>
              <div className="metaItem"><span className="metaDot dot2" />Alert history stored</div>
              <div className="metaItem"><span className="metaDot dot3" />Responsive UI</div>
            </div>
          </motion.div>

          {/* Preview */}
          <motion.div className="heroRight" variants={fadeUp}>
            <motion.div className="glassCard heroPreview" {...hoverLift}>
              <div className="cardHead">
                <h3 className="cardTitle">Dashboard Preview</h3>
                <span className="pill">Live</span>
              </div>

              <div className="previewGrid">
                <div className="previewStat">
                  <div className="previewLabel">Temperature</div>
                  <div className="previewValue">27.8<span className="previewUnit">°C</span></div>
                  <div className="previewHint">Updated every 5 min</div>
                </div>

                <div className="previewStat">
                  <div className="previewLabel">Humidity</div>
                  <div className="previewValue">51.9<span className="previewUnit">%</span></div>
                  <div className="previewHint">Updated every 5 min</div>
                </div>

                <div className="previewStat">
                  <div className="previewLabel">Pressure</div>
                  <div className="previewValue">1009<span className="previewUnit">hPa</span></div>
                  <div className="previewHint">Updated every 5 min</div>
                </div>
              </div>

              <div className="previewLine" />
              <div className="previewNote">
                Tip: Enable Email Alerts inside dashboard to receive breach notifications.
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ABOUT */}
        <Section id="about" title="About The Project">
          <p className="sectionText">
            This project demonstrates real-time sensor monitoring with a clean, glassmorphism UI.
            It simulates live readings, visualizes trends, triggers alerts on threshold breaches,
            and maintains an alert history for quick analysis.
          </p>
        </Section>

        {/* FEATURES */}
        <Section id="features" title="Key Features">
          <motion.div
            className="grid3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.22 }}
            variants={stagger}
          >
            {features.map((f, idx) => (
              <Feature key={f.title} title={f.title} desc={f.desc} index={idx + 1} />
            ))}
          </motion.div>
        </Section>

        {/* HOW */}
        <Section id="how" title="How It Works (Architecture)">
          <div className="howCard glassCard">
            <div className="howRow">
              <div className="howStep">
                <div className="howIndex">01</div>
                <div>
                  <div className="howTitle">Frontend (React)</div>
                  <div className="howDesc">Shows live cards, chart, table, and alert history.</div>
                </div>
              </div>

              <div className="howArrow">→</div>

              <div className="howStep">
                <div className="howIndex">02</div>
                <div>
                  <div className="howTitle">Sensor Simulation</div>
                  <div className="howDesc">Generates readings every 5 minutes (IST aligned).</div>
                </div>
              </div>

              <div className="howArrow">→</div>

              <div className="howStep">
                <div className="howIndex">03</div>
                <div>
                  <div className="howTitle">Backend API</div>
                  <div className="howDesc">Stores breach history + sends email alerts via Resend.</div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* STACK */}
        <Section id="stack" title="Technology Stack">
          <div className="stackGrid">
            <div className="glassCard stackCard">
              <div className="stackTitle">Frontend</div>
              <ul className="stackList">
                <li>React / HTML / CSS / JavaScript</li>
                <li>Recharts</li>
                <li>Zustand</li>
                <li>Framer Motion</li>
              </ul>
            </div>

            <div className="glassCard stackCard">
              <div className="stackTitle">Backend</div>
              <ul className="stackList">
                <li>Node.js (Express REST API)</li>
                <li>Email alerts via Resend</li>
                <li>SQLite (alerts + config)</li>
              </ul>
            </div>

            <div className="glassCard stackCard">
              <div className="stackTitle">Concepts</div>
              <ul className="stackList">
                <li>REST APIs</li>
                <li>JSON handling</li>
                <li>Threshold-based alerting</li>
                <li>Responsive UI design</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* CTA */}
        <motion.div
          id="cta"
          className="cta glassCard"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
        >
          <div>
            <h3 className="ctaTitle">Ready to Explore?</h3>
            <p className="ctaDesc">
              Experience real-time monitoring and analytics in action. Enable alerts and watch breaches get recorded automatically.
            </p>
          </div>

          <button className="btn btnPrimary" onClick={() => navigate("/dashboard")}>
            👉 View Live Dashboard
          </button>
        </motion.div>

        {/* FOOTER */}
        <div className="homeFooter">
          <div className="muted">Developed by: Jithendra Babu G</div>
          <div className="footerLinks">
            <a className="navLink" href="https://github.com/jithendrababug" target="_blank" rel="noreferrer">GitHub</a>
            <a className="navLink" href="https://www.linkedin.com/in/jithendrababug/" target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="navLink" href="mailto:jithendrababug@gmail.com">Email</a>
          </div>
        </div>
      </div>
    </div>
  );
}