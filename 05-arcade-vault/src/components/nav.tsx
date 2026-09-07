"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isHomeActive = pathname === "/";
  const isLibraryActive = pathname.startsWith("/games");
  const isHallActive = pathname === "/hall-of-fame";
  const isAboutActive = pathname === "/about";
  const isAuthActive = pathname === "/sign-in";

  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo">
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={isHomeActive ? "active" : ""}>
            Home
          </Link>
          <Link href="/games" className={isLibraryActive ? "active" : ""}>
            Library
          </Link>
          <Link href="/hall-of-fame" className={isHallActive ? "active" : ""}>
            Hall of Fame
          </Link>
          <Link href="/about" className={isAboutActive ? "active" : ""}>
            About
          </Link>
        </div>
        <div className="spacer" />
        <div className="coin-counter">
          <span className="coin" />
          <span>CREDITS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={signOut}>
            {user.name} ▾
          </button>
        ) : (
          <Link href="/sign-in" className="btn auth-btn">
            Sign In
          </Link>
        )}
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menu">
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close} />
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENU
        </div>
        <Link href="/" onClick={close} className={isHomeActive ? "active" : ""}>
          Home
        </Link>
        <Link href="/games" onClick={close} className={isLibraryActive ? "active" : ""}>
          Library
        </Link>
        <Link href="/hall-of-fame" onClick={close} className={isHallActive ? "active" : ""}>
          Hall of Fame
        </Link>
        <Link href="/about" onClick={close} className={isAboutActive ? "active" : ""}>
          About
        </Link>
        <Link href="/sign-in" onClick={close} className={isAuthActive ? "active" : ""}>
          {user ? "Account" : "Sign In"}
        </Link>
        <div style={{ flex: 1 }} />
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CREDITS · 03
        </div>
      </aside>
    </>
  );
}
