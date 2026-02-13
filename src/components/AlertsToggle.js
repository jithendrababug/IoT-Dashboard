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
  const [status, setStatus] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  const [draftFrom, setDraftFrom] = useState(emailConfig?.from || "");
  const [draftReceivers, setDraftReceivers] = useState(
    Array.isArray(emailConfig?.receivers) && emailConfig.receivers.length
      ? emailConfig.receivers
      : [""]
  );

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
      openModalWithCurrentConfig();
    } else {
      setAlertsEnabled(false);
      setOpen(false);
    }
  };

  const onAddReceiver = () =>
    setDraftReceivers((prev) => [...prev, ""]);

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
      setStatus({ type: "error", text: "Please enter a valid sender email." });
      return;
    }

    if (receivers.length === 0) {
      setStatus({ type: "error", text: "Please enter at least one receiver email." });
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
          recipients: receivers,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || `Failed to save configuration.`);
      }

      setEmailConfig({ from, receivers });
      setAlertsEnabled(true);
      setOpen(false);

      // 🔥 Professional activation message
      setStatus({
        type: "success",
        text:
          "✅ Email alerts activated successfully. Alerts will be sent automatically when threshold limits are breached.",
      });
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        text: err.message || "Failed to activate email alerts.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontWeight: 700 }}>Email Alerts</span>

      <label style={{ position: "relative", width: 60, height: 30 }}>
        <input
          type="checkbox"
          checked={alertsEnabled}
          onChange={onToggleChange}
          style={{ display: "none" }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            backgroundColor: alertsEnabled ? "#2d22c5" : "#9ca3af",
            transition: "0.25s",
          }}
        />
      </label>

      {status.text && (
        <div
          style={{
            marginLeft: 12,
            padding: "6px 10px",
            borderRadius: 10,
            fontWeight: 700,
            background: status.type === "error" ? "#fee2e2" : "#dcfce7",
            color: status.type === "error" ? "#991b1b" : "#166534",
          }}
        >
          {status.text}
        </div>
      )}

      {open && (
        <div style={{ marginTop: 20 }}>
          <input
            placeholder="Sender email"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
          />

          {draftReceivers.map((val, idx) => (
            <input
              key={idx}
              placeholder="Receiver email"
              value={val}
              onChange={(e) => onChangeReceiver(idx, e.target.value)}
            />
          ))}

          <button onClick={onAddReceiver}>+ Add Receiver</button>

          <button onClick={onSubmit} disabled={saving}>
            {saving ? "Activating..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertsToggle;