import Link from "next/link";
import ResendVerification from "@/components/ResendVerification";

export const metadata = { title: "Resend verification | AfriPlate" };

export default function ResendVerificationPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--ap-color-background)",
        fontFamily: "var(--ap-font)",
      }}
    >
      <section
        style={{
          background: "#fff",
          border: "1px solid var(--ap-color-border)",
          borderRadius: 24,
          padding: "40px 24px",
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        }}
        aria-labelledby="resend-title"
      >
        <Link
          href="/"
          style={{
            fontSize: "1.9rem",
            fontWeight: 900,
            color: "#111",
            letterSpacing: "-0.04em",
          }}
        >
          Afri<span style={{ color: "var(--ap-color-primary)" }}>Plate</span>
        </Link>
        <h1
          id="resend-title"
          style={{
            fontSize: "1.5rem",
            fontWeight: 900,
            color: "#111",
            letterSpacing: "-0.05em",
            marginTop: 24,
          }}
        >
          Verify your email
        </h1>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--ap-color-muted)",
            lineHeight: 1.7,
            marginTop: 8,
          }}
        >
          Enter the email you registered with to request a new verification
          link.
        </p>
        <ResendVerification />
        <Link
          href="/login"
          style={{
            display: "inline-block",
            marginTop: 24,
            fontWeight: 700,
            fontSize: "0.875rem",
            color: "var(--ap-color-primary)",
          }}
        >
          Back to login
        </Link>
      </section>
    </main>
  );
}
