"use client";
import CartEntry from "./CartEntry";
import { usePathname } from "next/navigation";
import AccountLinks from "./AccountLinks";
import { listingCampus } from "../app/lib/listingCampus";
import { useState } from "react";
import Link from "next/link";
import "./marketplace-header.css";

export function Icon({ name = "arrow", ...props }) {
  const paths = {
    plus: "M12 5v14M5 12h14",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 7v6m-3-3h6",
    bag: "M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2",
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "m6 6 12 12M6 18 18 6",
    book: "M12 5v16M3 3l9 2 9-2v16l-9 2-9-2V3",
    home: "m3 10 9-7 9 7v11h-6v-7H9v7H3V10",
    user: "M20 21a8 8 0 0 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    chat: "M21 11a9 9 0 0 1-9 9H3l1-5a9 9 0 1 1 17-4",
    work: "M3 7h18v14H3V7Zm5 0V3h8v4M3 12h18M10 12v3h4v-3",
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.arrow} />
    </svg>
  );
}
export function Brand() {
  return (
    <Link href="/" className="ap-brand" aria-label="AfriPlate home">
      <span className="ap-brand-mark">
        <Icon name="bag" />
      </span>
      Afri<span>Plate</span>
      <span className="ap-brand-dot">.</span>
    </Link>
  );
}
export function MarketplaceHeader() {
  const pathname = usePathname();
  const showCart = pathname === "/" || /^\/products(?:\/|$)/.test(pathname);
  const [open, setOpen] = useState(false);
  return (
    <header className="ap-header">
      <div className="ap-container ap-header-inner">
        <Brand />
        <nav aria-label="Main navigation" className="ap-desktop-nav">
          <Link href="/products">Products</Link>
          <Link href="/services">Services</Link>
          <Link href="/jobs">Jobs</Link>
        </nav>
        <div className="ap-header-actions">
          {showCart && <CartEntry/>}
          <AccountLinks variant="home" />
          <button
            type="button"
            className="ap-menu-button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="ap-mobile-menu"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="ap-mobile-menu"
          className="ap-mobile-menu"
          aria-label="Mobile navigation"
        >
          <Link href="/products" onClick={() => setOpen(false)}>Products</Link>
          <Link href="/services" onClick={() => setOpen(false)}>Services</Link>
          <Link href="/jobs" onClick={() => setOpen(false)}>Jobs</Link>
          <AccountLinks variant="menu" onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
}
export function ListingCard({ item, type = "products" }) {
  const [failed, setFailed] = useState(false);
  const photo = item.images?.[0] || item.image;
  const seller =
    item.seller_name ||
    [item.seller_first_name, item.seller_last_name].filter(Boolean).join(" ") ||
    (type === "jobs" ? item.company || item.poster_name : "");
  const campus = listingCampus(item);
  const price = type === "jobs" ? item.budget : item.price;
  return (
    <Link
      href={`/${type}/${encodeURIComponent(item.id || item._id)}`}
      className="ap-listing"
    >
      <div className="ap-listing-photo">
        {typeof photo === "string" && photo && !failed ? (
          <img
            src={photo}
            alt={item.title || item.name || "Listing"}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="ap-photo-empty">
            <Icon name="bag" />
            <span>No photo provided</span>
          </div>
        )}
        {item.category && (
          <span className="ap-listing-category">{item.category}</span>
        )}
      </div>
      <div className="ap-listing-body">
        <h3>{item.title || item.name || "Untitled listing"}</h3>
        <p className="ap-price">
          {price !== null &&
          price !== undefined &&
          price !== "" &&
          Number.isFinite(Number(price))
            ? `₦${Number(price).toLocaleString("en-NG")}`
            : "Ask for price"}
        </p>
        <p className="ap-listing-campus">
          <Icon name="pin" />
          {campus || "Campus not provided"}
        </p>
        {seller && <p className="ap-seller">Listed by {seller}</p>}
      </div>
    </Link>
  );
}
export function FeedState({ status, onRetry }) {
  if (status === "loading")
    return (
      <div
        role="status"
        aria-label="Loading listings"
        className="ap-listing-grid"
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="ap-skeleton">
            <div />
            <span />
            <span />
          </div>
        ))}
      </div>
    );
  return (
    <div className="ap-feed-state" role="status">
      <span className="ap-state-icon">
        <Icon name="bag" />
      </span>
      <h3>
        {status === "error"
          ? "The marketplace is taking a moment."
          : "A little quiet here, for now."}
      </h3>
      <p>
        {status === "error"
          ? "We couldn’t load listings. Please try again in a moment."
          : "There are no listings to show yet. Your next campus find could be here soon."}
      </p>
      {status === "error" && (
        <button className="ap-button ap-button-outline" onClick={onRetry}>
          Try again <Icon />
        </button>
      )}
    </div>
  );
}
