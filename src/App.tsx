
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  HeartHandshake,
  MapPin,
  Search,
  ShieldCheck,
  Utensils,
  House,
  Stethoscope,
  BriefcaseBusiness,
  Bus,
  ShowerHead,
  Scale,
  HandHeart,
} from "lucide-react";

const categories = [
  { name: "Emergency shelter", detail: "A safe place to stay", icon: House },
  { name: "Food assistance", detail: "Meals and food pantries", icon: Utensils },
  { name: "Healthcare", detail: "Medical and behavioral care", icon: Stethoscope },
  { name: "Housing support", detail: "Housing and rental assistance", icon: HeartHandshake },
  { name: "Showers & laundry", detail: "Hygiene and essential facilities", icon: ShowerHead },
  { name: "Legal assistance", detail: "Know your rights and options", icon: Scale },
  { name: "Employment", detail: "Jobs and workforce support", icon: BriefcaseBusiness },
  { name: "Transportation", detail: "Transit and travel assistance", icon: Bus },
];

export default function App() {
  const [need, setNeed] = useState("");
  const [place, setPlace] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (need.trim()) params.set("need", need.trim());
    if (place.trim()) params.set("location", place.trim());

    window.history.replaceState(null, "", `/?${params.toString()}`);
    document.getElementById("search-feedback")?.focus();
  }

  function chooseCategory(category: string) {
    setNeed(category);
    document.getElementById("resource-search")?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/" aria-label="HavenOS home">
          <span className="brand-mark">
            <HeartHandshake size={21} />
          </span>
          <span>
            Haven<span className="brand-accent">OS</span>
          </span>
        </a>

        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#resource-types">Explore services</a>
          <a className="nav-emergency" href="tel:211">Call 211</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            A clearer path to support
          </div>

          <h1>
            Find support.
            <br />
            <em>Find your next step.</em>
          </h1>

          <p className="hero-description">
            Start with what you need today. Explore local services for shelter,
            food, healthcare, housing, and the essentials of moving forward.
          </p>

          <form className="search-panel" onSubmit={handleSearch}>
            <label htmlFor="resource-search">
              What do you need help with?
            </label>

            <div className="search-input-wrap">
              <Search size={19} aria-hidden="true" />
              <input
                id="resource-search"
                value={need}
                onChange={(event) => setNeed(event.target.value)}
                placeholder="Try “emergency shelter” or “food pantry”"
              />
            </div>

            <label htmlFor="location-search">
              Where should we look?
            </label>

            <div className="location-row">
              <div className="location-input-wrap">
                <MapPin size={18} aria-hidden="true" />
                <input
                  id="location-search"
                  value={place}
                  onChange={(event) => setPlace(event.target.value)}
                  placeholder="City, ZIP code, or county"
                />
              </div>

              <button type="submit">
                Find resources <ArrowRight size={17} />
              </button>
            </div>

            <p className="privacy-note">
              No account required. Sharing your location is optional.
            </p>

            <p
              className="search-feedback"
              id="search-feedback"
              tabIndex={-1}
            >
              Search interface preview — live resource search is the next
              build phase.
            </p>
          </form>

          <div className="hero-assurance">
            <ShieldCheck size={17} />
            <span>
              Clear labels distinguish verified services from unconfirmed
              listings.
            </span>
          </div>
        </div>

        <div
          className="hero-visual"
          aria-label="Abstract illustration of a sunrise over a calm landscape"
        >
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-sun" />
          <div className="visual-horizon" />

          <div className="visual-card">
            <span className="visual-card-icon">
              <HandHeart size={19} />
            </span>
            <div>
              <strong>One step at a time.</strong>
              <span>Start with what matters today.</span>
            </div>
          </div>

          <div className="visual-caption">
            A resource navigator built around people.
          </div>
        </div>
      </section>

      <section className="resource-section" id="resource-types">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Start where you are</span>
            <h2>What would help right now?</h2>
          </div>

          <p>
            Choose a service to begin. Search by location or type of support.
          </p>
        </div>

        <div className="category-grid">
          {categories.map(({ name, detail, icon: Icon }, index) => (
            <button
              className="category-card"
              key={name}
              onClick={() => chooseCategory(name)}
              type="button"
            >
              <span className="category-top">
                <span className="category-number">
                  0{index + 1}
                </span>
                <Icon size={20} />
              </span>

              <span className="category-name">{name}</span>
              <span className="category-detail">{detail}</span>
              <ArrowRight className="category-arrow" size={17} />
            </button>
          ))}
        </div>
      </section>

      <section className="principles" id="how-it-works">
        <div>
          <span className="eyebrow">Designed for real-world use</span>
          <h2>
            Useful information.
            <br />
            <em>Without extra barriers.</em>
          </h2>
        </div>

        <div className="principle-list">
          <article>
            <strong>01 / Accessible</strong>
            <p>
              Explore resources without creating an account or sharing more
              personal information than necessary.
            </p>
          </article>

          <article>
            <strong>02 / Transparent</strong>
            <p>
              See whether a listing is verified, when its information was
              last checked, and where it came from.
            </p>
          </article>

          <article>
            <strong>03 / Practical</strong>
            <p>
              Get clear contact details and next steps so you can check with
              a provider before making a trip.
            </p>
          </article>
        </div>
      </section>

      <footer className="footer">
        <a className="brand" href="/">
          <span className="brand-mark">
            <HeartHandshake size={19} />
          </span>
          <span>
            Haven<span className="brand-accent">OS</span>
          </span>
        </a>

        <p>
          Always contact providers directly to confirm current services,
          hours, eligibility, costs, and availability. A listing is not a
          guarantee of an open bed or available appointment.
        </p>

        <span className="footer-note">
          A clearer path to support.
        </span>
      </footer>
    </main>
  );
}
