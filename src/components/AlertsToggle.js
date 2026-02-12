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

  // ✅ UI status
  const [status, setStatus] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);

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
      setAlertsEnabled(true);
      openModalWithCurrentConfig();
    } else {
      setAlertsEnabled(false);
      setOpen(false);
    }
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

  const onCloseModal = () => {
    setOpen(false);
    setAlertsEnabled(false);
  };

  const onSubmit = async () => {
    const from = String(draftFrom || "").trim();
    const receivers = draftReceivers
      .map((r) => String(r || "").trim())
      .filter(Boolean);

    if (!validateEmail(from)) {
      setStatus({ type: "error", text: "Please enter a valid sender email in FROM." });
      return;
    }

    if (receivers.length === 0) {
      setStatus({ type: "error", text: "Please enter at least one receiver email in TO." });
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
      const res = await fetch(`${API_BASE}/api/alerts/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromEmail: from,
          appPass: "", // ✅ no longer needed (Resend)
          recipients: receivers,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || `Failed to save email config (HTTP ${res.status})`);
      }

      setEmailConfig({ from, receivers });

      setStatus({ type: "success", text: "✅ Configuration saved. Now you can send a test email/alert." });

      setAlertsEnabled(true);
      setOpen(false);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: err.message || "Failed to save config." });
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    setTestingEmail(true);
    setStatus({ type: "", text: "" });

    try {
      const res = await fetch(`${API_BASE}/api/alerts/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || `Test email failed (HTTP ${res.status})`);
      }

      setStatus({ type: "success", text: "✅ Test email sent! Check inbox/spam." });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: err.message || "❌ Failed to send test email" });
    } finally {
      setTestingEmail(false);
    }
  };

  // ✅ NEW: sends a real “ALERT” email + stores it in alert history
  const sendTestAlert = async () => {
    setTestingAlert(true);
    setStatus({ type: "", text: "" });

    try {
      const res = await fetch(`${API_BASE}/api/alerts/test-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || `Test alert failed (HTTP ${res.status})`);
      }

      // Refresh history instantly
      window.dispatchEvent(new Event("alerts-updated"));

      setStatus({ type: "success", text: "🚨 Test ALERT sent + added to Alert History!" });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: err.message || "❌ Failed to send test alert" });
    } finally {
      setTestingAlert(false);
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

            {/* ✅ Status message */}
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
              <div style={field}>
                <label style={fieldLabel}>From (reply-to)</label>
                <input
                  style={input}
                  placeholder="Enter your email id"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                />
              </div>

              <div style={field}>
                <label style={fieldLabel}>To (receivers)</label>

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

              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                <button style={submitBtn} onClick={onSubmit} disabled={saving || testingEmail || testingAlert}>
                  {saving ? "Saving..." : "Submit"}
                </button>

                <button style={testBtn} onClick={sendTestEmail} disabled={saving || testingEmail || testingAlert}>
                  {testingEmail ? "Sending..." : "Send Test Email"}
                </button>

                <button style={alertBtn} onClick={sendTestAlert} disabled={saving || testingEmail || testingAlert}>
                  {testingAlert ? "Sending..." : "Send Test Alert"}
                </button>
              </div>

              <div style={{ marginTop: 10, textAlign: "center", color: "#6b7280", fontWeight: 700, fontSize: 12 }}>
                “Send Test Alert” will also add a row into Alert History.
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
  width: "min(620px, 96vw)",
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
  minWidth: 130,
  opacity: 1,
};

const testBtn = {
  padding: "10px 18px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 900,
  minWidth: 150,
};

const alertBtn = {
  padding: "10px 18px",
  borderRadius: 12,
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontWeight: 900,
  minWidth: 150,
};
