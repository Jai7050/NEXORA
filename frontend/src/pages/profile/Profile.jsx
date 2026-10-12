import { useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import "./Profile.css";

const PROFILE_KEY = "nexora_profile";

const emptyProfile = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  bio: "",
  website: "",
  avatar: "",
};

function readProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    return { ...emptyProfile, ...saved };
  } catch {
    return { ...emptyProfile };
  }
}

function getInitials(name) {
  const value = (name || "Player").trim();
  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
}

function Profile({ onLogout }) {
  const [profile, setProfile] = useState(readProfile);
  const [draft, setDraft] = useState(readProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [notice, setNotice] = useState("");

  const completion = useMemo(() => {
    const fields = ["fullName", "email", "phone", "location", "bio", "website"];
    const filled = fields.filter((field) => String(profile[field] || "").trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setNotice("Image must be smaller than 1.5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({ ...current, avatar: String(reader.result || "") }));
      setNotice("");
    };
    reader.onerror = () => setNotice("Could not read this image. Please try another.");
    reader.readAsDataURL(file);
  };

  const handleSave = (event) => {
    event.preventDefault();

    if (!draft.fullName.trim()) {
      setNotice("Please enter your full name.");
      return;
    }

    if (!draft.email.trim()) {
      setNotice("Please enter your email address.");
      return;
    }

    const cleaned = {
      ...draft,
      fullName: draft.fullName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      location: draft.location.trim(),
      bio: draft.bio.trim(),
      website: draft.website.trim(),
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(cleaned));
    setProfile(cleaned);
    setDraft(cleaned);
    setIsEditing(false);
    setNotice("Profile saved on this device.");
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
    setNotice("");
  };

  const removeAvatar = () => {
    setDraft((current) => ({ ...current, avatar: "" }));
  };

  const displayed = isEditing ? draft : profile;
  const initials = getInitials(displayed.fullName || displayed.email);

  return (
    <>
      <Navbar onLogout={onLogout} />

      <main className="profile-page">
        <section className="profile-heading">
          <div>
            <p className="profile-eyebrow">YOUR SPACE</p>
            <h1>My Profile</h1>
            <p className="profile-subtitle">
              Manage your personal details and make your Nexora profile yours.
            </p>
          </div>
          {!isEditing && (
            <button className="profile-primary-button" onClick={() => {
              setDraft(profile);
              setIsEditing(true);
              setNotice("");
            }}>
              Edit profile
            </button>
          )}
        </section>

        <section className="profile-layout">
          <aside className="profile-summary-card">
            <div className="profile-avatar-wrap">
              {displayed.avatar ? (
                <img className="profile-avatar-image" src={displayed.avatar} alt="Profile avatar" />
              ) : (
                <div className="profile-avatar-fallback" aria-label="Profile initials">{initials}</div>
              )}
              {isEditing && (
                <label className="profile-upload-button">
                  Change photo
                  <input type="file" accept="image/*" onChange={handleAvatarChange} />
                </label>
              )}
              {isEditing && displayed.avatar && (
                <button type="button" className="profile-remove-photo" onClick={removeAvatar}>
                  Remove photo
                </button>
              )}
            </div>

            <h2>{profile.fullName || "Your name"}</h2>
            <p className="profile-summary-email">{profile.email || "Add your email address"}</p>
            <span className="profile-member-badge">NEXORA MEMBER</span>

            <div className="profile-completion">
              <div className="profile-completion-label">
                <span>Profile completion</span>
                <strong>{completion}%</strong>
              </div>
              <div className="profile-progress-track">
                <div className="profile-progress-fill" style={{ width: `${completion}%` }} />
              </div>
              <p>Complete your details to personalize your profile.</p>
            </div>
          </aside>

          <section className="profile-details-card">
            <div className="profile-card-heading">
              <div>
                <h2>Personal information</h2>
                <p>Your details are saved in this browser for now.</p>
              </div>
              {!isEditing && <span className="profile-status-pill">View mode</span>}
            </div>

            {notice && (
              <div className={`profile-notice ${notice.startsWith("Profile saved") ? "success" : ""}`} role="status">
                {notice}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="profile-fields-grid">
                <div className="profile-field">
                  <label htmlFor="profile-fullName">Full name *</label>
                  <input id="profile-fullName" name="fullName" value={displayed.fullName} onChange={updateField} disabled={!isEditing} placeholder="Your full name" autoComplete="name" />
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-email">Email address *</label>
                  <input id="profile-email" type="email" name="email" value={displayed.email} onChange={updateField} disabled={!isEditing} placeholder="you@example.com" autoComplete="email" />
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-phone">Phone number</label>
                  <input id="profile-phone" type="tel" name="phone" value={displayed.phone} onChange={updateField} disabled={!isEditing} placeholder="+91 98765 43210" autoComplete="tel" />
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-location">Location</label>
                  <input id="profile-location" name="location" value={displayed.location} onChange={updateField} disabled={!isEditing} placeholder="City, country" autoComplete="address-level2" />
                </div>

                <div className="profile-field profile-field-full">
                  <label htmlFor="profile-website">Portfolio / website</label>
                  <input id="profile-website" type="url" name="website" value={displayed.website} onChange={updateField} disabled={!isEditing} placeholder="https://your-portfolio.com" />
                </div>

                <div className="profile-field profile-field-full">
                  <label htmlFor="profile-bio">About me</label>
                  <textarea id="profile-bio" name="bio" value={displayed.bio} onChange={updateField} disabled={!isEditing} rows="4" maxLength="300" placeholder="A few words about your goals, interests, or journey..." />
                  {isEditing && <span className="profile-character-count">{displayed.bio.length}/300</span>}
                </div>
              </div>

              {isEditing && (
                <div className="profile-form-actions">
                  <button type="button" className="profile-secondary-button" onClick={handleCancel}>Cancel</button>
                  <button type="submit" className="profile-primary-button">Save changes</button>
                </div>
              )}
            </form>
          </section>
        </section>

        <p className="profile-footnote">
          Frontend prototype: profile details are stored locally in this browser. They are not yet synced to your backend account.
        </p>
      </main>
    </>
  );
}

export default Profile;
