import React, { useMemo, useState } from "react";
import { useSensorStore } from "../context/sensorStore";

const AlertsToggle = () => {
  const alertsEnabled = useSensorStore((state) => state.alertsEnabled);
  const setAlertsEnabled = useSensorStore((state) => state.setAlertsEnabled);

  const emailConfig = useSensorStore((state) => state.emailConfig);
  const setEmailConfig = useSensorStore((state) => state.setEmailConfig);

  const [open, setOpen] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  // Draft state (so user can cancel without saving)
  const [draftFrom, setDraftFrom] = useState(emailConfig?.from || "");
  const [draftPass, setDraftPass] = useState(emailConfig?.pass || "");
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

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

  const openModalWithCurrentConfig = () => {
    setDraftFrom(emailConfig?.from || "");
    setDraftPass(emailConfig?.pass || "");
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
      // Turn ON -> open modal to fill details
      setAlertsEnabled(true);
      openModalWithCurrentConfig();
    } else {
      // Turn OFF
      setAlertsEnabled(false);
      setOpen(false);
      setGuidelinesOpen(false);
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
    // Closing without submit -> keep it OFF (as you wanted logic-wise)
    setOpen(false);
    setGuidelinesOpen(false);
    setAlertsEnabled(false);
  };

  const onSubmit = () => {
    const from = String(draftFrom || "").trim();
    const pass = String(draftPass || "").trim();
    const receivers = draftReceivers.map((r) => String(r || "").trim()).filter(Boolean);

    if (!validateEmail(from)) {
      alert("Please enter a valid sender email in FROM.");
      return;
    }

    if (!pass) {
      alert("Please enter the email app password.");
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

    // ✅ Save config in store
    setEmailConfig({
      from,
      pass,
      receivers,
    });

    setOpen(false);
    setGuidelinesOpen(false);
    alert("Email alert configuration saved!");
  };

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Email Alerts</span>

      {/* ✅ YOUR EXISTING TOGGLE UI (kept as-is) */}
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

      {/* ✅ EMAIL ALERT MODAL */}
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
              </div>

              <div style={field}>
                <label style={fieldLabel}>Email Pass</label>
                <input
                  style={input}
                  placeholder="Enter the email pass"
                  value={draftPass}
                  onChange={(e) => setDraftPass(e.target.value)}
                />

                <button type="button" style={createPassBtn} onClick={() => setGuidelinesOpen(true)}>
                  Create email pass
                </button>
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

              <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
                <button style={submitBtn} onClick={onSubmit}>
                  Submit
                </button>
              </div>
            </div>

            {/* ✅ GUIDELINES POPUP */}
            {guidelinesOpen && (
              <div style={innerBackdrop} onMouseDown={() => setGuidelinesOpen(false)}>
                <div style={innerModal} onMouseDown={(e) => e.stopPropagation()}>
                  <h3 style={{ margin: 0, marginBottom: 10 }}>Guidelines for creating email pass</h3>

                  <ul style={{ marginTop: 0, lineHeight: 1.6 }}>
                    <li>Enable 2-Step Verification in your Google Account.</li>
                    <li>Go to Google Account → Security → App passwords.</li>
                    <li>Select “Mail” and your device, then generate.</li>
                    <li>Copy the 16-character app password and paste it here.</li>
                    <li>Do NOT use your normal Gmail login password.</li>
                  </ul>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button style={closeGuidelinesBtn} onClick={() => setGuidelinesOpen(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsToggle;

/* ---------- YOUR EXISTING STYLES (kept) ---------- */

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

/* ---------- Modal styles (new) ---------- */

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

const createPassBtn = {
  marginTop: 8,
  width: "fit-content",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  cursor: "pointer",
  fontWeight: 800,
  color: "#111827",
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

const innerBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 10000,
};

const innerModal = {
  width: "min(520px, 94vw)",
  background: "white",
  borderRadius: 16,
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  padding: 16,
};

const closeGuidelinesBtn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 900,
};
