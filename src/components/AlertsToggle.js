import React, { useMemo, useState } from "react";
import { useSensorStore } from "../context/sensorStore";

// ✅ API base
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === "production"
    ? "https://iot-dashboard-y27r.onrender.com"
    : "http://localhost:5000");

const AlertsToggle = () => {
  const alertsEnabled = useSensorStore((state) => state.alertsEnabled);
  const setAlertsEnabled = useSensorStore((state) => state.setAlertsEnabled);

  const emailConfig = useSensorStore((state) => state.emailConfig);
  const setEmailConfig = useSensorStore((state) => state.setEmailConfig);

  const [open, setOpen] = useState(false);

  // Draft state
  const [draftFrom, setDraftFrom] = useState(emailConfig?.from || "");
  const [draftReceivers, setDraftReceivers] = useState(
    Array.isArray(emailConfig?.receivers) && emailConfig.receivers.length
      ? emailConfig.receivers
      : [""]
  );

  const receiverPlaceholder = useMemo(() => {
    const nth = (n) => {
      if (n === 2) return "second";
      if (n === 3) return "third";
      if (n === 4) return "fourth";
      if (n === 5) return "fifth";
      return `${n}th`;
    };

    return (idx) => {
      if (idx === 0) return "Enter the receiver mail id";
      return `Enter the ${nth(idx + 1)} receiver mail id`;
    };
  }, []);

  const validateEmail = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

  const openModalWithCurrentConfig = () => {
    setDraftFrom(emailConfig?.from || "");
    setDraftReceivers(
      Array.isArray(emailConfig?.receivers) && emailConfig.receivers.length
        ? [...emailConfig.receivers]
        : [""]
    );
    setOpen(true);
  };

  const onToggleChange = (e) => {
    const next = e.target.checked;

    if (next) {
      setAlertsEnabled(true);
      openModalWithCurrentConfig();
    } else {
      setAlertsEnabled(false);
      setOpen(false);
    }
  };

  const onAddReceiver = () => setDraftReceivers((prev) => [...prev, ""]);

  const onChangeReceiver = (index, value) => {
    setDraftReceivers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const onCloseModal = () => {
    setOpen(false);
    setAlertsEnabled(false);
  };

  const onSubmit = async () => {
    const from = String(draftFrom || "").trim();
    const receivers = draftReceivers.map((r) => String(r || "").trim()).filter(Boolean);

    if (!validateEmail(from)) {
      alert("Please enter a valid sender email in FROM.");
      return;
    }

    if (receivers.length === 0) {
      alert("Please enter at least one receiver email in TO.");
      return;
    }

    const bad = receivers.find((r) => !validateEmail(r));
    if (bad) {
      alert(`Invalid receiver email: ${bad}`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/alerts/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromEmail: from,
          recipients: receivers,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || `Failed to save email config (HTTP ${res.status})`);
      }

      setEmailConfig({ from, receivers });

      setOpen(false);
      setAlertsEnabled(true);

      alert("Email alert configuration saved!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save email config. Check backend logs.");
    }
  };

  const sendTestEmail = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || `Test email failed (HTTP ${res.status})`);
      }

      alert("✅ Test email sent successfully! Check your inbox/spam.");
    } catch (err) {
      console.error(err);
      alert(err.message || "❌ Failed to send test email");
    }
  };

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Email Alerts</span>

      <label style={switchStyle}>
        <input
          type="checkbox"
          checked={alertsEnabled}
          onChange={onToggleChange}
          style={{ display: "none" }}
        />

        <span
          style={{
            ...sliderStyle,
            backgroundColor: alertsEnabled ? "#2d22c5" : "#9ca3af",
          }}
        >
          <span
            style={{
              ...knobStyle,
              transform: alertsEnabled ? "translateX(28px)" : "translateX(0px)",
            }}
          />
        </span>
      </label>

      <span
        style={{
          marginLeft: 10,
          fontWeight: 800,
          color: alertsEnabled ? "#16a34a" : "#374151",
        }}
      >
        {alertsEnabled ? "ON" : "OFF"}
      </span>

      {open && (
        <div style={backdrop} onMouseDown={onCloseModal}>
          <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>EMAIL ALERT</h2>
              <button style={xBtn} onClick={onCloseModal} aria-label="Close">
                ✕
              </button>
            </div>

            <div style={form}>
              <div style={field}>
                <label style={fieldLabel}>From</label>
                <input
                  style={input}
                  placeholder="Enter the sender mail id"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                />
                <div style={hintText}>
                  For now, replies go to this email. Actual sending uses Resend default until you verify a domain.
                </div>
              </div>

              <div style={field}>
                <label style={fieldLabel}>To</label>

                {draftReceivers.map((val, idx) => (
                  <input
                    key={idx}
                    style={{ ...input, marginTop: idx === 0 ? 0 : 10 }}
                    placeholder={receiverPlaceholder(idx)}
                    value={val}
                    onChange={(e) => onChangeReceiver(idx, e.target.value)}
                  />
                ))}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <button type="button" style={addReceiverBtn} onClick={onAddReceiver}>
                    + Add another receiver
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: 18, gap: 12 }}>
                <button style={submitBtn} onClick={onSubmit}>
                  Submit
                </button>

                <button style={testBtn} onClick={sendTestEmail}>
                  Send Test Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsToggle;

/* ---------- styles (your existing + tiny hint text) ---------- */

const containerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 12,
  marginBottom: 25,
};

const labelStyle = {
  fontWeight: 700,
  fontSize: 15,
  color: "#111827",
};

const switchStyle = {
  position: "relative",
  display: "inline-block",
  width: 60,
  height: 30,
};

const sliderStyle = {
  position: "absolute",
  cursor: "pointer",
  inset: 0,
  borderRadius: 999,
  transition: "0.25s",
};

const knobStyle = {
  position: "absolute",
  height: 22,
  width: 22,
  left: 4,
  top: 4,
  backgroundColor: "#ffffff",
  borderRadius: "50%",
  transition: "0.25s",
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
};

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9999,
};

const modal = {
  width: "min(560px, 96vw)",
  background: "white",
  borderRadius: 16,
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  padding: 18,
  position: "relative",
};

const modalHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
};

const modalTitle = { margin: 0, fontSize: 18, color: "#111827", fontWeight: 900 };

const xBtn = {
  border: "none",
  background: "transparent",
  fontSize: 18,
  cursor: "pointer",
  color: "#111827",
};

const form = { display: "flex", flexDirection: "column", gap: 14 };

const field = { display: "flex", flexDirection: "column" };

const fieldLabel = { fontWeight: 800, marginBottom: 6, color: "#111827" };

const input = {
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  outline: "none",
  fontSize: 14,
};

const hintText = {
  marginTop: 6,
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 600,
};

const addReceiverBtn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 900,
};

const submitBtn = {
  padding: "10px 18px",
  borderRadius: 12,
  border: "none",
  background: "#111827",
  color: "white",
  cursor: "pointer",
  fontWeight: 900,
  minWidth: 140,
};

const testBtn = {
  padding: "10px 18px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 900,
  minWidth: 160,
};
