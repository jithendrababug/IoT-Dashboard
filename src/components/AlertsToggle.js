import React, { useMemo, useState } from "react";
import { useSensorStore } from "../context/sensorStore";

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
  const [saving, setSaving] = useState(false);

  // inline status inside modal
  const [status, setStatus] = useState({ type: "", text: "" });

  // draft values (modal)
  const [draftFrom, setDraftFrom] = useState(emailConfig?.from || "");
  const [draftReceivers, setDraftReceivers] = useState(
    Array.isArray(emailConfig?.receivers) && emailConfig.receivers.length
      ? emailConfig.receivers
      : [""]
  );

  const validateEmail = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

  const receiverPlaceholder = useMemo(() => {
    const nth = (n) => {
      if (n === 2) return "second";
      if (n === 3) return "third";
      if (n === 4) return "fourth";
      if (n === 5) return "fifth";
      if (n === 6) return "sixth";
      if (n === 7) return "seventh";
      if (n === 8) return "eighth";
      if (n === 9) return "ninth";
      if (n === 10) return "tenth";
      return `${n}th`;
    };

    return (idx) => {
      if (idx === 0) return "Enter the receiver mail id";
      return `Enter the ${nth(idx + 1)} receiver mail id`;
    };
  }, []);

  const openModalWithCurrentConfig = () => {
    setStatus({ type: "", text: "" });

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
      // open modal, but DO NOT keep enabled unless submit succeeds
      openModalWithCurrentConfig();
    } else {
      setAlertsEnabled(false);
      setOpen(false);
      setStatus({ type: "", text: "" });
    }
  };

  const onCloseModal = () => {
    // If user closes without submitting => keep alerts OFF
    setOpen(false);
    setAlertsEnabled(false);
    setStatus({ type: "", text: "" });
  };

  const onAddReceiver = () => setDraftReceivers((prev) => [...prev, ""]);

  const onChangeReceiver = (index, value) => {
    setDraftReceivers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const onSubmit = async () => {
    const from = String(draftFrom || "").trim();
    const receivers = draftReceivers
      .map((r) => String(r || "").trim())
      .filter(Boolean);

    // Validations
    if (!from) {
      setStatus({ type: "error", text: "Please enter the From value." });
      return;
    }

    // Keep email validation (recommended)
    if (!validateEmail(from)) {
      setStatus({ type: "error", text: "Please enter a valid email in From." });
      return;
    }

    if (receivers.length === 0) {
      setStatus({
        type: "error",
        text: "Please enter at least one receiver email in To.",
      });
      return;
    }

    const bad = receivers.find((r) => !validateEmail(r));
    if (bad) {
      setStatus({ type: "error", text: `Invalid receiver email: ${bad}` });
      return;
    }

    setSaving(true);
    setStatus({ type: "", text: "" });

    try {
      // ✅ ONLY SAVE CONFIG. No email is sent here. No alert history row is created here.
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
        throw new Error(json.error || `Failed to save config (HTTP ${res.status})`);
      }

      // store for UI
      setEmailConfig({ from, receivers });

      // enable alerts only after successful save
      setAlertsEnabled(true);

      // success message (better wording)
      setStatus({
        type: "success",
        text:
          "✅ Email alerts enabled. You will receive notifications only when sensor values cross the threshold from now on.",
      });

      setTimeout(() => {
        setOpen(false);
        setStatus({ type: "", text: "" });
      }, 650);
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        text: err.message || "Failed to save email alert config.",
      });
      setAlertsEnabled(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Email Alerts</span>

      {/* Toggle switch */}
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
            background: alertsEnabled
              ? "linear-gradient(135deg, rgba(99,102,241,0.95), rgba(34,197,94,0.85))"
              : "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.12)",
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
          fontWeight: 950,
          color: alertsEnabled ? "#22c55e" : "#9CA3AF",
          letterSpacing: 0.4,
        }}
      >
        {alertsEnabled ? "ON" : "OFF"}
      </span>

      {/* Modal */}
      {open && (
        <div style={backdrop} onMouseDown={onCloseModal}>
          <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <div>
                <h2 style={modalTitle}>EMAIL ALERTS</h2>
                <div style={modalSubTitle}>
                  Configure recipients. Alerts trigger only on threshold breaches.
                </div>
              </div>

              <button style={xBtn} onClick={onCloseModal} aria-label="Close">
                ✕
              </button>
            </div>

            {/* Status message */}
            {status.text ? (
              <div
                style={{
                  ...statusBox,
                  background:
                    status.type === "error"
                      ? "rgba(239,68,68,0.16)"
                      : "rgba(34,197,94,0.16)",
                  border:
                    status.type === "error"
                      ? "1px solid rgba(239,68,68,0.25)"
                      : "1px solid rgba(34,197,94,0.25)",
                  color: status.type === "error" ? "#fecaca" : "#bbf7d0",
                }}
              >
                {status.text}
              </div>
            ) : null}

            <div style={form}>
              {/* From */}
              <div style={field}>
                <label style={fieldLabel}>From</label>
                <input
                  style={input}
                  placeholder="Enter the resend id"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                />
              </div>

              {/* To */}
              <div style={field}>
                <label style={fieldLabel}>To (only Resend-signed mail id)</label>

                {draftReceivers.map((val, idx) => (
                  <input
                    key={idx}
                    style={{ ...input, marginTop: idx === 0 ? 0 : 10 }}
                    placeholder={receiverPlaceholder(idx)}
                    value={val}
                    onChange={(e) => onChangeReceiver(idx, e.target.value)}
                  />
                ))}
              </div>

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
                <button style={submitBtn} onClick={onSubmit} disabled={saving}>
                  {saving ? "Saving..." : "Submit"}
                </button>
              </div>

              <div style={helperText}>
                No test email will be sent on submit. Alerts start from the next threshold breach.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsToggle;

/* ---------- Styles (Dark / Glass) ---------- */

const containerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 12,
  marginBottom: 25,
};

const labelStyle = {
  fontWeight: 900,
  fontSize: 14,
  color: "#E5E7EB",
  letterSpacing: 0.4,
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
  boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
};

/* Modal */
const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.62)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9999,
};

const modal = {
  width: "min(560px, 96vw)",
  borderRadius: 18,
  padding: 18,
  position: "relative",
  background: "rgba(17,24,39,0.92)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
  backdropFilter: "blur(12px)",
};

const modalHeader = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
};

const modalTitle = { margin: 0, fontSize: 18, color: "#E5E7EB", fontWeight: 950 };

const modalSubTitle = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 800,
  color: "#9CA3AF",
};

const xBtn = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  fontSize: 16,
  cursor: "pointer",
  color: "#E5E7EB",
  width: 36,
  height: 36,
  borderRadius: 12,
};

const statusBox = {
  marginBottom: 10,
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 850,
};

const form = { display: "flex", flexDirection: "column", gap: 14 };
const field = { display: "flex", flexDirection: "column" };

const fieldLabel = { fontWeight: 950, marginBottom: 6, color: "#E5E7EB" };

const input = {
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  outline: "none",
  fontSize: 14,
  color: "#E5E7EB",
  background: "rgba(255,255,255,0.06)",
};

const addReceiverBtn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#E5E7EB",
  cursor: "pointer",
  fontWeight: 950,
};

const submitBtn = {
  padding: "11px 22px",
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, rgba(99,102,241,0.95), rgba(34,197,94,0.80))",
  color: "white",
  cursor: "pointer",
  fontWeight: 950,
  minWidth: 160,
  boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
};

const helperText = {
  marginTop: 2,
  textAlign: "center",
  color: "#9CA3AF",
  fontWeight: 800,
  fontSize: 12,
};