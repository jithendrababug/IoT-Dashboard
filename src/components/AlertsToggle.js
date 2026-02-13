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

  const onAddReceiver = () => {
    setDraftReceivers((prev) => [...prev, ""]);
  };

  const onChangeReceiver = (index, value) => {
    setDraftReceivers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const onSubmit = async () => {
    const from = String(draftFrom || "").trim();
    const receivers = draftReceivers.map((r) => String(r || "").trim()).filter(Boolean);

    // Validations (fast + clear)
    if (!from) {
      setStatus({ type: "error", text: "Please enter the From value." });
      return;
    }

    // If you truly want this to be an email (recommended), keep this validation.
    // If "resend id" is not an email, tell me and I’ll relax this validation.
    if (!validateEmail(from)) {
      setStatus({ type: "error", text: "Please enter a valid email in From." });
      return;
    }

    if (receivers.length === 0) {
      setStatus({ type: "error", text: "Please enter at least one receiver email in To." });
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

      // show success message
      const msg =
        "✅ Email alerts are enabled successfully. You’ll receive alerts only when a threshold is breached (after this point).";

      setStatus({ type: "success", text: msg });

      // close modal after a short moment so user sees success
      setTimeout(() => {
        setOpen(false);
        setStatus({ type: "", text: "" });
      }, 600);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: err.message || "Failed to save email alert config." });
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

      {/* Modal */}
      {open && (
        <div style={backdrop} onMouseDown={onCloseModal}>
          <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>EMAIL ALERTS</h2>
              <button style={xBtn} onClick={onCloseModal} aria-label="Close">
                ✕
              </button>
            </div>

            {/* Status message */}
            {status.text ? (
              <div
                style={{
                  marginBottom: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  fontWeight: 800,
                  background: status.type === "error" ? "#fee2e2" : "#dcfce7",
                  color: status.type === "error" ? "#991b1b" : "#166534",
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

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
                <button style={submitBtn} onClick={onSubmit} disabled={saving}>
                  {saving ? "Saving..." : "Submit"}
                </button>
              </div>

              <div style={{ marginTop: 10, textAlign: "center", color: "#6b7280", fontWeight: 700, fontSize: 12 }}>
                Alerts will be sent only when a threshold is breached after enabling.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsToggle;

/* ---------- Styles ---------- */

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

/* Modal */
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