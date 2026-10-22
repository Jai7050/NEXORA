import React, { useEffect, useRef, useState } from "react";
import "./Profile.css";

const API_URL = "http://localhost:8080/api/profile";

const getEmptyProfile = () => ({
  fullName: "",
  email: localStorage.getItem("nexora_profile_email") || "",
  phone: "",
  bio: "",
  profileImage: "",
});

const Profile = () => {
  const [viewMode, setViewMode] = useState(true);
  const [profile, setProfile] = useState(getEmptyProfile);
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const fileInputRef = useRef(null);

  // Get JWT token
  const getToken = () => localStorage.getItem("nexora_token");

  // Display success/error messages
  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  // Load profile from Spring Boot backend
  useEffect(() => {
    const loadProfile = async () => {
      const token = getToken();

      if (!token) {
        showMessage("Please log in to view your profile.", "error");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          showMessage(
            "Your session may have expired. Please log in again.",
            "error"
          );
          setLoading(false);
          return;
        }

        if (response.status === 404) {
          setProfileExists(false);
          setProfile(getEmptyProfile());
          showMessage(
            "Your profile has not been created yet. Select Edit Details to create it."
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Unable to load profile. Server returned ${response.status}.`
          );
        }

        const data = await response.json();

        setProfile({
          ...getEmptyProfile(),
          ...data,
          email:
            data.email ||
            localStorage.getItem("nexora_profile_email") ||
            "",
        });

        setProfileExists(true);
        showMessage("");
      } catch (error) {
        showMessage(
          error.message || "Unable to connect to the backend.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Update form fields
  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Select and preview profile image
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage("Please select a valid image file.", "error");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showMessage("Please select an image smaller than 2 MB.", "error");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfile((previous) => ({
        ...previous,
        profileImage: reader.result,
      }));

      showMessage("Image selected. Save your profile to keep the changes.");
    };

    reader.onerror = () => {
      showMessage("Unable to read the selected image.", "error");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  // Remove profile image
  const handleRemoveImage = () => {
    setProfile((previous) => ({
      ...previous,
      profileImage: "",
    }));

    showMessage("Image removed. Save your profile to confirm the change.");
  };

  // Save or update profile in MongoDB
  const handleSave = async (event) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      showMessage("Please log in again before saving your profile.", "error");
      return;
    }

    if (!profile.fullName.trim()) {
      showMessage("Please enter your full name.", "error");
      return;
    }

    setSaving(true);
    showMessage("");

    try {
      const payload = {
        fullName: profile.fullName.trim(),
        phone: profile.phone.trim(),
        bio: profile.bio.trim(),
        profileImage: profile.profileImage,
      };

      const endpoint = profileExists ? `${API_URL}/me` : API_URL;
      const method = profileExists ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Authentication failed. Please log in again and retry."
        );
      }

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || `Failed to save profile (${response.status}).`
        );
      }

      const savedData = await response.json();

      setProfile((previous) => ({
        ...previous,
        ...savedData,
        email:
          savedData.email ||
          previous.email ||
          localStorage.getItem("nexora_profile_email") ||
          "",
      }));

      setProfileExists(true);
      setViewMode(true);

      showMessage("Profile saved successfully!");
    } catch (error) {
      showMessage(
        error.message || "Unable to save your profile.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing and reload the saved profile
  const handleCancel = async () => {
    setViewMode(true);
    showMessage("");

    const token = getToken();

    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        setProfileExists(false);
        setProfile(getEmptyProfile());
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to reload saved profile details.");
      }

      const data = await response.json();

      setProfile({
        ...getEmptyProfile(),
        ...data,
        email:
          data.email ||
          localStorage.getItem("nexora_profile_email") ||
          "",
      });

      setProfileExists(true);
    } catch (error) {
      showMessage(
        error.message || "Unable to reload saved profile details.",
        "error"
      );
    }
  };

  // Generate avatar initials
  const getInitials = () => {
    const name = profile.fullName.trim();

    if (!name) return "U";

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // Loading screen
  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">

        {/* Page heading */}
        <header className="profile-header">
          <div>
            <span className="profile-eyebrow">ACCOUNT SETTINGS</span>
            <h1>My Profile</h1>
            <p className="profile-subtitle">
              View and manage your personal details.
            </p>
          </div>
        </header>

        {/* Success and error messages */}
        {message && (
          <div
            className={`profile-message ${
              messageType === "error" ? "error" : ""
            }`}
            role="status"
          >
            {message}
          </div>
        )}

        {/* Purple profile header */}
        <section className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt="Profile"
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar profile-avatar-placeholder">
                {getInitials()}
              </div>
            )}
          </div>

          <h2 className="profile-display-name">
            {profile.fullName || "Your Name"}
          </h2>

          <p className="profile-display-email">
            {profile.email || "Email not available"}
          </p>

          {!viewMode && (
            <div className="avatar-actions">
              <button
                type="button"
                className="upload-image-button"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Picture
              </button>

              {profile.profileImage && (
                <button
                  type="button"
                  className="remove-image-button"
                  onClick={handleRemoveImage}
                >
                  Remove Picture
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="profile-image-input"
                onChange={handleImageChange}
              />
            </div>
          )}
        </section>

        {/* View and Edit buttons */}
        <div className="profile-buttons">
          <button
            type="button"
            className={viewMode ? "active-btn" : "secondary-btn"}
            onClick={() => {
              setViewMode(true);
              showMessage("");
            }}
          >
            View Details
          </button>

          <button
            type="button"
            className={!viewMode ? "active-btn" : "secondary-btn"}
            onClick={() => {
              setViewMode(false);
              showMessage("");
            }}
          >
            Edit Details
          </button>
        </div>

        {/* View profile details */}
        {viewMode ? (
          <section className="profile-details">
            <div className="detail-item">
              <label>Full Name</label>
              <p>{profile.fullName || "Not added"}</p>
            </div>

            <div className="detail-item">
              <label>Email Address</label>
              <p>{profile.email || "Not added"}</p>
            </div>

            <div className="detail-item">
              <label>Phone Number</label>
              <p>{profile.phone || "Not added"}</p>
            </div>

            <div className="detail-item">
              <label>About Me</label>
              <p>{profile.bio || "Not added"}</p>
            </div>
          </section>
        ) : (
          /* Edit profile form */
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                maxLength={100}
                autoComplete="name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={profile.email}
                readOnly
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                maxLength={20}
                autoComplete="tel"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="bio">About Me</label>
              <textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Tell us a little about yourself..."
                rows={4}
                maxLength={500}
              />

              <small>{profile.bio.length}/500 characters</small>
            </div>

            <div className="profile-form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Details"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;