"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStoredSession } from "./lib/useStoredSession";
import api from "./lib/api";
import { CAMPUS_DIRECTORY } from "./lib/campuses";
import {
  Brand,
  Icon,
  MarketplaceHeader,
  ListingCard,
  FeedState,
} from "@/components/Marketplace";
import "./home.css";

const categories = [
  {
    title: "Electronics",
    detail: "Your next upgrade",
    photo: "photo-1496181133206-80ce9b88a853",
  },
  {
    title: "Textbooks",
    detail: "Ready for the semester",
    photo: "photo-1495446815901-a7297e633e8d",
  },
  {
    title: "Fashion",
    detail: "Find your own style",
    photo: "photo-1542291026-7eec264c27ff",
  },
  {
    title: "Furniture",
    detail: "Make your space yours",
    photo: "photo-1598300042247-d088f8ab3a91",
  },
];
const photo = (id, width = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
export default function HomePage() {
  const isAuthed = useStoredSession();
  const [type, setType] = useState("products");
  const [feed, setFeed] = useState({ status: "loading", items: [] });
  const [attempt, setAttempt] = useState(0);
  const [universitySearch, setUniversitySearch] = useState("");
  const [campusState, setCampusState] = useState("All");
  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/${type}`, {
        params: { limit: 8, sort: "newest" },
        signal: controller.signal,
      })
      .then((res) => {
        const items = res.data?.[type] ?? res.data?.data ?? res.data;
        if (!Array.isArray(items))
          throw new Error("Unexpected listing response");
        const validItems = items.filter(
          (item) => item && (item.id || item._id),
        );
        setFeed({
          status: validItems.length ? "ready" : "empty",
          items: validItems,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFeed({ status: "error", items: [] });
      });
    return () => controller.abort();
  }, [type, attempt]);
  const sellHref = isAuthed ? "/dashboard" : "/register";
  const campusStates = Object.fromEntries(
    CAMPUS_DIRECTORY.map((c) => [c.abbr, c.state]),
  );
  const [showAllCampuses, setShowAllCampuses] = useState(false);
  const matchingCampuses = CAMPUS_DIRECTORY.filter(
    (c) =>
      [c.abbr, c.name, c.city].some((value) =>
        value.toLowerCase().includes(universitySearch.toLowerCase()),
      ) &&
      (campusState === "All" || c.state === campusState),
  );
  const visibleCampuses = (
    showAllCampuses ? matchingCampuses : matchingCampuses.slice(0, 12)
  ).map((c) => c.abbr);
  return (
    <div className="ap-home">
      <a className="ap-skip" href="#main">
        Skip to content
      </a>
      <MarketplaceHeader isAuthed={isAuthed} />
      <main id="main">
        <section className="ap-hero">
          <div className="ap-container ap-hero-grid">
            <div className="ap-hero-copy">
              <p className="ap-eyebrow">
                <span /> THE CAMPUS MARKETPLACE
              </p>
              <h1>
                Good finds.
                <br />
                Great skills.
                <br />
                <em>Right on campus.</em>
              </h1>
              <p className="ap-hero-description">
                From your next textbook to your next side hustle. Buy, sell and
                discover what students around you have to offer.
              </p>
              <form action="/products" className="ap-search" role="search">
                <Icon name="search" />
                <label className="ap-sr-only" htmlFor="marketplace-search">
                  Search products
                </label>
                <input
                  id="marketplace-search"
                  name="q"
                  placeholder="What are you looking for?"
                  type="search"
                />
                <button type="submit" aria-label="Search marketplace">
                  <Icon name="arrow" />
                </button>
              </form>
              <p className="ap-popular">
                Try <Link href="/products?q=laptop">a laptop</Link>,{" "}
                <Link href="/products?category=Textbooks">textbooks</Link> or{" "}
                <Link href="/services">a creative skill</Link>
              </p>
              <div className="ap-hero-actions">
                <Link className="ap-button ap-button-green" href="/products">
                  Browse marketplace <Icon />
                </Link>
                <Link className="ap-text-link" href={sellHref}>
                  Start selling <Icon />
                </Link>
              </div>
            </div>
            <div
              className="ap-hero-visual"
              aria-label="Everyday campus essentials"
            >
              <div className="ap-visual-label">
                A little of everything.
                <br />
                <span>A lot closer to you.</span>
              </div>
              <div
                className="ap-hero-photo ap-photo-main"
                role="img"
                aria-label="A laptop for study and creative work"
              />
              <div
                className="ap-hero-photo ap-photo-books"
                role="img"
                aria-label="Books for your next chapter"
              />
              <div className="ap-visual-note">
                <Icon name="pin" />
                <span>
                  Campus life,
                  <br />
                  <strong>all in one place.</strong>
                </span>
              </div>
              <span className="ap-visual-caption">
                STUDY. CREATE. MAKE IT YOURS.
              </span>
            </div>
          </div>
        </section>
        <div className="ap-intro-strip">
          <div className="ap-container">
            <span>Made for life between lectures.</span>
            <p>
              Everyday essentials <span>·</span> Student skills <span>·</span>{" "}
              New opportunities
            </p>
          </div>
        </div>
        <section
          className="ap-container ap-section"
          aria-labelledby="categories-heading"
        >
          <div className="ap-section-heading">
            <div>
              <p className="ap-eyebrow">FIND YOUR THING</p>
              <h2 id="categories-heading">What’s on your list?</h2>
            </div>
            <Link className="ap-text-link" href="/products">
              All categories <Icon />
            </Link>
          </div>
          <div className="ap-category-grid">
            {categories.map((c) => (
              <Link
                href={`/products?category=${c.title}`}
                className="ap-category"
                key={c.title}
              >
                <div
                  className="ap-category-photo"
                  style={{ backgroundImage: `url(${photo(c.photo)})` }}
                />
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.detail}</p>
                </div>
                <Icon />
              </Link>
            ))}
          </div>
          <div className="ap-discovery-links">
            <Link href="/services">
              <Icon name="book" />
              <span>
                Got a project? <strong>Find a student with the skills.</strong>
              </span>
              <Icon />
            </Link>
            <Link href="/jobs">
              <Icon name="work" />
              <span>
                Ready for what’s next?{" "}
                <strong>Explore campus opportunities.</strong>
              </span>
              <Icon />
            </Link>
          </div>
        </section>
        <section className="ap-feed-section" aria-labelledby="listings-heading">
          <div className="ap-container ap-section">
            <div className="ap-section-heading">
              <div>
                <p className="ap-eyebrow">THE MARKETPLACE</p>
                <h2 id="listings-heading">Discover something good.</h2>
                <p>Useful finds and local talent, a little closer to home.</p>
              </div>
              <Link href={`/${type}`} className="ap-text-link">
                View all {type} <Icon />
              </Link>
            </div>
            <div
              className="ap-feed-filters"
              role="group"
              aria-label="Listing type"
            >
              {["products", "services", "jobs"].map((t) => (
                <button
                  key={t}
                  aria-pressed={type === t}
                  className={type === t ? "active" : ""}
                  onClick={() => {
                    if (t !== type) {
                      setFeed({ status: "loading", items: [] });
                      setType(t);
                    }
                  }}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {feed.status === "ready" ? (
              <div className="ap-listing-grid">
                {feed.items.map((item) => (
                  <ListingCard
                    key={item.id || item._id}
                    item={item}
                    type={type}
                  />
                ))}
              </div>
            ) : (
              <FeedState
                status={feed.status}
                onRetry={() => {
                  setFeed({ status: "loading", items: [] });
                  setAttempt((a) => a + 1);
                }}
              />
            )}
          </div>
        </section>
        <section className="ap-container ap-section ap-how" id="how-it-works">
          <div>
            <p className="ap-eyebrow">LESS HASSLE. MORE POSSIBILITY.</p>
            <h2>
              A campus connection.
              <br />A simple beginning.
            </h2>
            <p>
              Something you need. Something you can offer.
              <br />
              There’s a place for both here.
            </p>
            <Link href={sellHref} className="ap-text-link">
              Get started <Icon />
            </Link>
          </div>
          <div className="ap-steps">
            {[
              {
                title: "Find what you need",
                text: "Browse products, discover services or explore jobs. Start with your campus and see what catches your eye.",
              },
              {
                title: "Have a conversation",
                text: "Ask the seller about the details, condition and availability. Agree on a price and how you’ll meet.",
              },
              {
                title: "Give your hustle a home",
                text: "Create a seller account, add clear photos and an honest description, and put your products or skills out there.",
              },
            ].map((s, i) => (
              <div key={s.title} className="ap-step">
                <span>0{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
            <p className="ap-meeting-note">
              Meeting in person? Choose a busy public spot on campus and inspect
              items before paying.
            </p>
          </div>
        </section>
        <section className="ap-campus-section">
          <div className="ap-container ap-section">
            <div className="ap-section-heading">
              <div>
                <p className="ap-eyebrow">CLOSER IS BETTER</p>
                <h2>Start with your campus.</h2>
                <p>Explore your university’s marketplace.</p>
              </div>
              <div className="ap-campus-controls">
                <label className="ap-sr-only" htmlFor="campus-search">
                  Find a campus
                </label>
                <input
                  id="campus-search"
                  value={universitySearch}
                  onChange={(e) => setUniversitySearch(e.target.value)}
                  placeholder="Find your campus"
                  type="search"
                />
                <label className="ap-sr-only" htmlFor="campus-state">
                  Filter campuses by state
                </label>
                <select
                  id="campus-state"
                  value={campusState}
                  onChange={(e) => setCampusState(e.target.value)}
                >
                  <option value="All">All states</option>
                  {[...new Set(Object.values(campusStates))].sort().map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ap-campus-links">
              {visibleCampuses.map((c) => (
                <Link key={c} href={`/university/${encodeURIComponent(c)}`}>
                  {c}
                  <Icon />
                </Link>
              ))}
            </div>
            {matchingCampuses.length > 12 && (
              <button
                className="ap-button ap-button-outline"
                aria-expanded={showAllCampuses}
                onClick={() => setShowAllCampuses((v) => !v)}
              >
                {showAllCampuses ? "Show fewer campuses" : "Show more campuses"}
              </button>
            )}
            {!visibleCampuses.length && (
              <p role="status">
                No campuses match your search. Try another name or state.
              </p>
            )}
          </div>
        </section>
        <section className="ap-container ap-sell-section">
          <div>
            <p className="ap-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
            <h2>
              A good find for someone.
              <br />A fresh start for you.
            </h2>
            <p>Pass on what you no longer need. Put your skills to work.</p>
          </div>
          <Link href={sellHref} className="ap-button ap-button-light">
            Start selling <Icon />
          </Link>
        </section>
      </main>
      <footer className="ap-container ap-footer">
        <div>
          <Brand />
          <p>A little closer. A lot more possible.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/products">Products</Link>
          <Link href="/services">Services</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href={isAuthed ? "/dashboard" : "/register"}>
            {isAuthed ? "My account" : "Create an account"}
          </Link>
        </nav>
        <div className="ap-footer-bottom">
          <span>© {new Date().getFullYear()} AfriPlate</span>
          <span>Made for Nigerian campus life.</span>
        </div>
      </footer>
    </div>
  );
}
