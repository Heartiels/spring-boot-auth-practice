import { useEffect, useState } from "react";
import { ApiError, getProfile, login, register } from "./api.js";

const TOKEN_KEY = "login-practice.jwt";

function readStoredToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export default function App() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(readStoredToken);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState({ type: "idle", message: "" });

  useEffect(() => {
    if (!token) {
      setProfile(null);
      return;
    }

    let active = true;
    getProfile(token)
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setStatus({ type: "error", message: "Your session is invalid or expired." });
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "loading", message: mode === "login" ? "Signing in..." : "Creating account..." });

    try {
      const authenticate = mode === "login" ? login : register;
      const result = await authenticate(username.trim(), password);
      localStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      setPassword("");
      setStatus({ type: "success", message: mode === "login" ? "Signed in successfully." : "Account created." });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "The backend is unavailable.";
      setStatus({ type: "error", message });
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setStatus({ type: "idle", message: "" });
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setProfile(null);
    setStatus({ type: "idle", message: "" });
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">AF</div>
        <div>
          <p className="eyebrow">Full-stack authentication practice</p>
          <h1>Auth Flow Lab</h1>
        </div>
      </header>

      <section className="workspace" aria-live="polite">
        <div className="flow-panel">
          <p className="section-label">Request path</p>
          <ol className="flow-list">
            <li><span>01</span>React form</li>
            <li><span>02</span>Spring Boot API</li>
            <li><span>03</span>BCrypt and MySQL</li>
            <li><span>04</span>JWT protected profile</li>
          </ol>
          <div className="security-note">
            <strong>Current security state</strong>
            <p>{token ? "A JWT is stored for authenticated API calls." : "No browser session is currently authenticated."}</p>
          </div>
        </div>

        <div className="auth-panel">
          {profile ? (
            <div className="profile-view">
              <p className="section-label">Protected response</p>
              <h2>Welcome, {profile.username}</h2>
              <p>The browser sent your JWT in the Authorization header and the backend verified it.</p>
              <dl>
                <div><dt>User ID</dt><dd>{profile.userId}</dd></div>
                <div><dt>Username</dt><dd>{profile.username}</dd></div>
                <div><dt>Endpoint</dt><dd>/api/profile</dd></div>
              </dl>
              <button className="secondary-button" type="button" onClick={logout}>Sign out</button>
            </div>
          ) : (
            <>
              <div className="mode-tabs" role="tablist" aria-label="Authentication mode">
                <button className={mode === "login" ? "active" : ""} type="button" role="tab" aria-selected={mode === "login"} onClick={() => switchMode("login")}>Sign in</button>
                <button className={mode === "register" ? "active" : ""} type="button" role="tab" aria-selected={mode === "register"} onClick={() => switchMode("register")}>Create account</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-heading">
                  <p className="section-label">{mode === "login" ? "Existing user" : "New user"}</p>
                  <h2>{mode === "login" ? "Sign in to continue" : "Create your account"}</h2>
                </div>
                <label htmlFor="username">Username</label>
                <input id="username" name="username" autoComplete="username" minLength="3" maxLength="50" required value={username} onChange={(event) => setUsername(event.target.value)} />

                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength="6" maxLength="100" required value={password} onChange={(event) => setPassword(event.target.value)} />

                {status.message ? <p className={`status-message ${status.type}`} role="status">{status.message}</p> : null}
                <button className="primary-button" type="submit" disabled={status.type === "loading"}>{mode === "login" ? "Sign in" : "Create account"}</button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
