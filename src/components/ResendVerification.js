"use client";
import { useState } from "react";
import api from "@/app/lib/api";

// Keep verification recovery in the existing authentication visual style.
const emailHelp=code=>({EMAIL_CONFIGURATION_MISSING:"Verification email is not configured on the server yet. Your account is saved. Please retry once AfriPlate has completed email setup.",EMAIL_OWNER_ONLY:"Email is currently limited to the owner test inbox. Student email delivery needs a verified sender domain. You do not need to register again.",EMAIL_SENDER_INVALID:"AfriPlate sender setup is incomplete. Your account is saved; please retry later.",EMAIL_PROVIDER_FORBIDDEN:"The email provider has not allowed this send. AfriPlate needs to check its sender domain and test restrictions.",EMAIL_FRONTEND_URL_INVALID:"Verification link configuration needs attention. Your account is saved."}[code]);
export default function ResendVerification({ email = "", initialCode = null }) {
  const [address, setAddress] = useState(email);
  const [status, setStatus] = useState(initialCode ? "error" : "idle");
  const [message, setMessage] = useState(emailHelp(initialCode)||"");
  const resend = async (event) => {
    event.preventDefault();
    if (status === "loading") return;
    const normalized = address.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch(
        `${api.defaults.baseURL}/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalized }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          emailHelp(data.code) || data.message ||
            "We could not send the verification email. Please try again.",
        );
      if (data.verification_email_sent === false)
        throw new Error(
          "Your account exists, but we could not confirm the verification email was sent. Please try again.",
        );
      setStatus("success");
      setMessage(data.message || "If an eligible account exists, verification instructions have been requested. Inbox delivery is not confirmed.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof TypeError
          ? "We could not connect. Please try again in a moment."
          : error.message,
      );
    }
  };
  return (
    <form
      onSubmit={resend}
      className="ap-verification-form"
      aria-busy={status === "loading"}
    >
      {!email && (
        <div className="ap-verification-field">
          <label htmlFor="verification-email">Email address</label>
          <input
            id="verification-email"
            type="email"
            autoComplete="email"
            required
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              setStatus("idle");
              setMessage("");
            }}
            aria-invalid={status === "error" ? true : undefined}
            aria-describedby={message ? "verification-feedback" : undefined}
            placeholder="you@university.edu.ng"
          />
        </div>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="ap-verification-button"
      >
        {status === "loading"
          ? "Sending verification email..."
          : "Resend verification email"}
      </button>
      {message && (
        <p
          id="verification-feedback"
          role={status === "error" ? "alert" : "status"}
          className={`ap-verification-feedback ${status}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
