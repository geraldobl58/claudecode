// ===== nav.jsx =====
const { useState } = React;

function Nav({ route, navigate, user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const isActive = (name) => route.name === name || (name === "library" && route.name === "detail") || (name === "library" && route.name === "player");
  const go = (r) => { setOpen(false); navigate(r); };

  return (
    <React.Fragment>
      <nav className="av-nav">
        <div className="logo" onClick={() => go({ name: "library" })}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">ARCADE <span className="neon-magenta">VAULT</span></div>
        </div>
        <div className="links">
          <a className={isActive("library") ? "active" : ""} onClick={() => go({ name: "library" })}>Library</a>
          <a className={isActive("hall") ? "active" : ""} onClick={() => go({ name: "hall" })}>Hall of Fame</a>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CREDITS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={onSignOut}>{user.name} ▾</button>
        ) : (
          <button className="btn auth-btn" onClick={() => go({ name: "auth" })}>Sign In</button>
        )}
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menu">≡</button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={() => setOpen(false)}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENU</div>
        <a className={isActive("library") ? "active" : ""} onClick={() => go({ name: "library" })}>Library</a>
        <a className={isActive("hall") ? "active" : ""} onClick={() => go({ name: "hall" })}>Hall of Fame</a>
        <a className={isActive("auth") ? "active" : ""} onClick={() => go({ name: "auth" })}>{user ? "Account" : "Sign In"}</a>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>CREDITS · 03</div>
      </aside>
    </React.Fragment>
  );
}

window.Nav = Nav;
