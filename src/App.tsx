import { useState, type FormEvent } from "react";
import {
  ArrowDownRight, ArrowRight, BadgeCheck, BookOpenCheck, BriefcaseBusiness,
  BusFront, Check, Clock3, HandHeart, HeartHandshake, House, Landmark,
  MapPin, Search, ShieldCheck, ShowerHead, Stethoscope, Utensils, UsersRound,
  Scale, type LucideIcon,
} from "lucide-react";

type Category = { name: string; description: string; icon: LucideIcon; query: string };

const categories: Category[] = [
  { name: "Emergency shelter", description: "Short-term places to stay and shelter access", icon: House, query: "Emergency shelter" },
  { name: "Food & groceries", description: "Food pantries, community meals, and groceries", icon: Utensils, query: "Food assistance" },
  { name: "Healthcare", description: "Medical, dental, and behavioral health services", icon: Stethoscope, query: "Healthcare" },
  { name: "Housing support", description: "Rental help, housing navigation, and prevention", icon: HeartHandshake, query: "Housing assistance" },
  { name: "Showers & laundry", description: "Hygiene facilities, showers, and clean clothing", icon: ShowerHead, query: "Showers and laundry" },
  { name: "Legal assistance", description: "Legal aid, documentation, and tenant support", icon: Scale, query: "Legal assistance" },
  { name: "Jobs & income", description: "Employment services and workforce support", icon: BriefcaseBusiness, query: "Employment assistance" },
  { name: "Transportation", description: "Transit help and transportation programs", icon: BusFront, query: "Transportation assistance" },
  { name: "Benefits & essentials", description: "Public benefits, identification, and basic needs", icon: Landmark, query: "Benefits and essential services" },
  { name: "Families & youth", description: "Family, child, and youth-focused support", icon: UsersRound, query: "Family and youth services" },
  { name: "Community support", description: "Community organizations and local programs", icon: HandHeart, query: "Community support" },
  { name: "Information & referrals", description: "Help understanding options and next steps", icon: BookOpenCheck, query: "Information and referrals" },
];

const steps = [
  { number: "01", title: "Start with what you need", description: "Choose a type of support. You do not need an account or a long explanation.", icon: Search },
  { number: "02", title: "Narrow it to your area", description: "Search by city, ZIP code, county, or another location you choose.", icon: MapPin },
  { number: "03", title: "Check before you go", description: "Review contact details, eligibility, hours, and the date information was checked.", icon: BadgeCheck },
];

function readSearchParam(key: string) {
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

export default function App() {
  const [need, setNeed] = useState(() => readSearchParam("need"));
  const [place, setPlace] = useState(() => readSearchParam("location"));
  const [searchMessage, setSearchMessage] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!place.trim()) {
      setSearchMessage("Add a city, ZIP code, or county to define your search area.");
      document.getElementById("location-search")?.focus();
      return;
    }
    const params = new URLSearchParams();
    if (need.trim()) params.set("need", need.trim());
    params.set("location", place.trim());
    window.history.replaceState(null, "", `/?${params.toString()}`);
    setSearchMessage("Your search details are ready. Live local listings will appear here once the resource directory is connected.");
  }

  function chooseCategory(category: string) {
    setNeed(category);
    setSearchMessage("");
    document.getElementById("search")?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => document.getElementById("resource-search")?.focus(), 350);
  }

  function clearSearch() {
    setNeed("");
    setPlace("");
    setSearchMessage("");
    window.history.replaceState(null, "", window.location.pathname);
  }

  return (
    <main>
      <div className="announcement">
        <span className="announcement-mark"><ShieldCheck size={14} /></span>
        <span>Built to make local support easier to find — and easier to verify.</span>
        <a href="#trust">How information is handled <ArrowRight size={13} /></a>
      </div>

      <header className="topbar">
        <a className="brand" href="/" aria-label="HavenOS home">
          <span className="brand-mark"><HeartHandshake size={21} strokeWidth={2.1} /></span>
          <span className="brand-word">Haven<span>OS</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#explore">Explore support</a>
          <a href="#how-it-works">How it works</a>
          <a href="#trust">Our standards</a>
        </nav>
        <a className="nav-emergency" href="tel:211"><span className="nav-emergency-dot" />Call 211<ArrowDownRight className="arrow-up-right" size={15} /></a>
      </header>

      <section className="hero" id="search" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A clearer starting point</div>
          <h1 id="hero-title">Finding help<br />shouldn't be <em>another hurdle.</em></h1>
          <p className="hero-description">Find a place to start. Explore support for housing, food, healthcare, and everyday essentials — with clear information about what is known and what still needs to be confirmed.</p>

          <form className="search-panel" onSubmit={handleSearch}>
            <div className="search-panel-heading">
              <div><span className="search-kicker">YOUR NEXT STEP STARTS HERE</span><h2>What are you looking for?</h2></div>
              <span className="search-panel-icon"><Search size={20} /></span>
            </div>
            <label htmlFor="resource-search">Type of support <span>Optional</span></label>
            <div className="search-input-wrap">
              <Search size={18} aria-hidden="true" />
              <input id="resource-search" value={need} onChange={(event) => { setNeed(event.target.value); setSearchMessage(""); }} placeholder="e.g. emergency shelter, food pantry" list="support-options" />
              <datalist id="support-options">{categories.map((category) => <option key={category.name} value={category.query} />)}</datalist>
            </div>
            <label htmlFor="location-search">Where should we look? <span>Required</span></label>
            <div className="location-row">
              <div className="location-input-wrap"><MapPin size={18} aria-hidden="true" /><input id="location-search" value={place} onChange={(event) => { setPlace(event.target.value); setSearchMessage(""); }} placeholder="City, ZIP code, or county" autoComplete="postal-code" /></div>
              <button className="search-submit" type="submit">Find support <ArrowRight size={17} /></button>
            </div>
            <div className="search-foot"><span><ShieldCheck size={14} /> No account required</span><span><MapPin size={14} /> You choose what location to share</span></div>
            {searchMessage && <div className="search-message" role="status" aria-live="polite"><ShieldCheck size={16} /><span>{searchMessage}</span>{place.trim() && <button type="button" className="clear-search" onClick={clearSearch}>Clear</button>}</div>}
          </form>
          <div className="hero-note"><span className="hero-note-icon"><HeartHandshake size={17} /></span><p><strong>Start with one thing.</strong> You can explore other options whenever you're ready.</p></div>
        </div>

        <div className="hero-art" aria-label="Decorative illustration of a path through a landscape">
          <div className="art-topline"><span>THE PATH FORWARD</span><span className="art-live-dot" /> A STEP AT A TIME</div>
          <div className="art-sky"><div className="art-sun" /><div className="art-ring ring-a" /><div className="art-ring ring-b" /><div className="art-cloud cloud-a" /><div className="art-cloud cloud-b" /></div>
          <div className="art-hill hill-back" /><div className="art-hill hill-front" /><div className="art-path" />
          <div className="art-pin pin-one"><span><House size={15} /></span></div><div className="art-pin pin-two"><span><HandHeart size={15} /></span></div>
          <div className="art-card art-card-top"><span className="art-card-symbol"><MapPin size={16} /></span><span><strong>Your location</strong><small>Chosen by you</small></span><Check size={15} /></div>
          <div className="art-card art-card-bottom"><span className="art-card-symbol"><BadgeCheck size={16} /></span><span><strong>Clear information</strong><small>Know what to check next</small></span></div>
          <div className="art-caption">A little more clarity. One next step.</div>
          <div className="art-stamp"><span>H</span><small>HERE<br />TO HELP</small></div>
        </div>
      </section>

      <section className="quick-strip" aria-label="HavenOS principles">
        <div><ShieldCheck size={17} /><span>Transparency over guesswork</span></div><div><HeartHandshake size={17} /><span>People before paperwork</span></div><div><MapPin size={17} /><span>Local information, your choice</span></div><div><Clock3 size={17} /><span>Check details before you travel</span></div>
      </section>

      <section className="explore-section" id="explore" aria-labelledby="explore-title">
        <div className="section-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> Find a place to begin</div><h2 id="explore-title">What would help <em>today?</em></h2></div><p>There is no right order. Choose the kind of support that matters most right now.</p></div>
        <div className="category-grid">
          {categories.map(({ name, description, icon: Icon, query }, index) => <button className="category-card" key={name} onClick={() => chooseCategory(query)} type="button"><span className="category-index">{String(index + 1).padStart(2, "0")}</span><span className="category-icon"><Icon size={21} strokeWidth={1.8} /></span><span className="category-name">{name}</span><span className="category-description">{description}</span><span className="category-action">Explore <ArrowDownRight className="arrow-up-right" size={15} /></span></button>)}
        </div>
        <p className="category-footnote"><span className="tiny-star">✳</span> Not sure what to choose? Start with the search above and use your own words.</p>
      </section>

      <section className="how-section" id="how-it-works" aria-labelledby="how-title">
        <div className="how-heading"><div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> Simple by design</div><h2 id="how-title">Less searching in circles.<br /><em>More clarity about what's next.</em></h2><p>HavenOS is being built around the practical details people need before they make a call, travel across town, or ask for help.</p><a className="text-link text-link-light" href="#trust">Our information standards <ArrowRight size={16} /></a></div>
        <div className="step-list">{steps.map(({ number, title, description, icon: Icon }) => <article className="step-card" key={number}><div className="step-top"><span>{number}</span><Icon size={20} /></div><h3>{title}</h3><p>{description}</p><div className="step-rule"><span /></div></article>)}</div>
      </section>

      <section className="trust-section" id="trust" aria-labelledby="trust-title">
        <div className="trust-heading"><div className="eyebrow"><span className="eyebrow-line" /> Information you can evaluate</div><h2 id="trust-title">Trust should be <em>visible.</em></h2><p>A listing should never ask you to take its word for everything. HavenOS is being designed to show where information came from, when it was checked, and what has not been confirmed.</p></div>
        <div className="trust-grid">
          <article className="trust-card"><span className="trust-icon"><BadgeCheck size={20} /></span><h3>Verification status</h3><p>Understand whether a service has been confirmed, is awaiting review, or still needs checking.</p><span className="trust-label"><span className="status-dot status-green" /> Status shown clearly</span></article>
          <article className="trust-card"><span className="trust-icon"><Clock3 size={20} /></span><h3>Last checked</h3><p>See when information was last reviewed so you can judge whether it may need reconfirmation.</p><span className="trust-label"><Clock3 size={13} /> Date matters</span></article>
          <article className="trust-card"><span className="trust-icon"><BookOpenCheck size={20} /></span><h3>Source information</h3><p>Know where a listing's details originated instead of treating every directory entry as equal.</p><span className="trust-label"><ShieldCheck size={13} /> Traceable information</span></article>
        </div>
        <div className="trust-callout"><span className="trust-callout-icon"><ShieldCheck size={21} /></span><p><strong>A listing is not a promise of availability.</strong> Services, hours, eligibility, costs, and open beds can change. Contact the provider directly before travelling or making plans.</p></div>
      </section>

      <section className="community-section" aria-labelledby="community-title">
        <div className="community-mark"><HandHeart size={26} /></div>
        <div className="community-copy"><div className="eyebrow"><span className="eyebrow-line" /> Built with communities</div><h2 id="community-title">Good information takes <em>all of us.</em></h2><p>Providers and community members can help keep resource information accurate. Contributions are intended to be reviewed before changes become public.</p></div>
        <div className="community-aside"><span className="review-pill"><ShieldCheck size={14} /> Review before publishing</span><p>Provider submissions and correction workflows are part of the next build phase.</p><a className="text-link" href="#how-it-works">See how HavenOS is designed <ArrowRight size={16} /></a></div>
      </section>

      <section className="emergency-band" aria-label="Immediate support"><div className="emergency-symbol"><HeartHandshake size={21} /></div><div><strong>Need help finding local services right now?</strong><p>In the United States, 211 can connect you with local community resources.</p></div><a href="tel:211">Call 211 <ArrowRight size={16} /></a></section>

      <footer className="footer"><div className="footer-main"><a className="brand brand-footer" href="/" aria-label="HavenOS home"><span className="brand-mark"><HeartHandshake size={20} /></span><span className="brand-word">Haven<span>OS</span></span></a><p>A clearer path to support.<br />A more transparent way to find it.</p></div><div className="footer-links"><a href="#explore">Explore support</a><a href="#how-it-works">How it works</a><a href="#trust">Information standards</a><a href="tel:211">Call 211</a></div><div className="footer-bottom"><span>HavenOS · Built around people, not paperwork.</span><span>Always confirm services and availability directly with providers.</span></div></footer>
    </main>
  );
}
