import { useState } from "react";
import { Link } from "react-router-dom";
import "./ForgotPassword.css";

const API_URL = "http://localhost:8080/api/auth";

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function ForgotPassword() {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  // STEP 1: Send OTP
  const handleSendOtp = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Unable to send OTP.");
      }

      setStep(2);
      setMessage(
        data.message ||
          "If the account is eligible, an OTP will be sent to your email."
      );
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            otp,
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "OTP verification failed."
        );
      }

      if (!data.resetToken) {
        throw new Error(
          "The server did not return a reset token."
        );
      }

      setResetToken(data.resetToken);
      setStep(3);
      setMessage(
        "OTP verified successfully. Create your new password."
      );
    } catch (err) {
      setError(err.message || "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (event) => {
    event.preventDefault();
    clearMessages();

    if (newPassword.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      setError(
        "Your reset session is invalid. Please verify your OTP again."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resetToken,
            newPassword,
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Password reset failed."
        );
      }

      setMessage(
        data.message ||
          "Password reset successfully. Please log in."
      );

      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setResetToken("");
      setStep(4);
    } catch (err) {
      setError(
        err.message || "Unable to reset your password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setStep(1);
    setOtp("");
    setResetToken("");
    clearMessages();
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <Link
          to="/login"
          className="forgot-brand"
          aria-label="Back to login"
        >
          <span className="forgot-logo">N</span>
          <span className="forgot-brand-name">NEXORA</span>
        </Link>

        <div className="forgot-heading">
          <h1>
            {step === 4
              ? "Password Reset!"
              : "Forgot Password?"}
          </h1>

          <p className="forgot-subtitle">
            {step === 1 &&
              "No worries! Enter your registered email address and we'll help you reset your password."}

            {step === 2 &&
              "Enter the 6-digit verification code sent to your registered email address."}

            {step === 3 &&
              "Create a new password for your Nexora account."}

            {step === 4 &&
              "Your password has been reset. You can now log in with your new password."}
          </p>
        </div>

        {step !== 4 && (
          <div className="forgot-progress">
            {[1, 2, 3].map((number) => (
              <div
                key={number}
                className={`forgot-progress-step ${
                  step >= number ? "active" : ""
                }`}
              >
                <span>{number}</span>
                <small>
                  {number === 1
                    ? "Email"
                    : number === 2
                    ? "Verify"
                    : "Reset"}
                </small>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="forgot-alert forgot-alert-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div
            className="forgot-alert forgot-alert-success"
            role="status"
          >
            {message}
          </div>
        )}

        {/* STEP 1: Email Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="forgot-form-group">
              <label htmlFor="forgot-email">
                Email Address
              </label>

              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              className="forgot-button"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="forgot-form-group">
              <label htmlFor="forgot-otp">
                Verification Code
              </label>

              <input
                id="forgot-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="Enter 6-digit OTP"
                autoComplete="one-time-code"
                required
              />

              <small className="forgot-hint">
                Check your registered email for the OTP.
              </small>
            </div>

            <button
              type="submit"
              className="forgot-button"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              className="forgot-secondary-button"
              onClick={handleChangeEmail}
              disabled={loading}
            >
              Change Email
            </button>
          </form>
        )}

        {/* STEP 3: New Password Form */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="forgot-form-group">
              <label htmlFor="new-password">
                New Password
              </label>

              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="forgot-form-group">
              <label htmlFor="confirm-password">
                Confirm Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Re-enter new password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <p className="forgot-hint">
              Your password must contain at least 8 characters.
            </p>

            <button
              type="submit"
              className="forgot-button"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* STEP 4: Success */}
        {step === 4 && (
          <div className="forgot-success">
            <div className="forgot-success-icon">✓</div>

            <Link
              to="/login"
              className="forgot-button forgot-login-button"
            >
              Go to Login
            </Link>
          </div>
        )}

        {step !== 4 && (
          <div className="forgot-footer">
            Remember your password?{" "}
            <Link to="/login">Back to Login</Link>
          </div>
        )}

        <div className="forgot-bottom-text">
          Secure access to your Nexora account
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
