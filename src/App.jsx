import { useEffect, useRef, useState } from 'react';
import { FaYoutube, FaPlay, FaArrowRight, FaArrowUpRightFromSquare, FaBars, FaXmark } from 'react-icons/fa6';
import { channel, projects, films, merch } from './content';

function External({ href, children, ...props }) { return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}<span className="sr-only"> (opens in a new tab)</span></a>; }

export function App() {
  const [menu, setMenu] = useState(false);
  const [filter, setFilter] = useState('All films');
  const [project, setProject] = useState(null);
  const [dropAlert, setDropAlert] = useState(false);
  const dialog = useRef(null);
  const close = () => { dialog.current?.close(); setProject(null); setDropAlert(false); };
  useEffect(() => {
    if (project || dropAlert) { dialog.current.showModal(); document.body.style.overflow = 'hidden'; }
    return () => { document.body.style.overflow = ''; };
  }, [project, dropAlert]);
  useEffect(() => {
    const key = e => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="opening" id="top">
      <header className="header">
        <a className="brand" href="#top" aria-label="DualBore Media home"><img src="/assets/channel-logo.jpg" alt="" width="100" height="100" /><span><strong>DUALBORE</strong><small>MEDIA · BUILDS & RIDES</small></span></a>
        <button className="menu-toggle" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} aria-controls="navigation" onClick={() => setMenu(!menu)}>{menu ? <FaXmark /> : <FaBars />}</button>
        <nav id="navigation" className={menu ? 'nav open' : 'nav'} aria-label="Main navigation">
          <a href="#shop" onClick={() => setMenu(false)}>Drop 01</a><a href="#films" onClick={() => setMenu(false)}>Films</a><a href="#garage" onClick={() => setMenu(false)}>The garage</a><a href="#about" onClick={() => setMenu(false)}>About</a>
          <External href={channel.url} className="button nav-youtube"><FaYoutube aria-hidden="true" /> YouTube</External>
        </nav>
      </header>
      <div id="main" tabIndex="-1"><section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy"><span className="hero-badge red-glow-sm">From the garage. For the ride.</span><h1 id="hero-title">Built.<br />Ridden.<br /><span>Repeat.</span></h1><p>Two-strokes, late nights, and whatever comes next. Real builds and rides from DualBore Media.</p><div className="hero-actions"><a href="#films" className="button red-glow"><FaYoutube aria-hidden="true" /> Watch the films</a><a href="#shop" className="button button-outline">Explore Drop 01 <FaArrowRight aria-hidden="true" /></a></div></div>
        <External href="https://www.youtube.com/watch?v=c7gF1jjT9YQ" className="hero-feature cyan-glow"><img src="/assets/rd400.jpg" alt="Yamaha RD400 from the DualBore Media hills ride" width="480" height="360" /><div className="hero-feature-caption"><span className="eyebrow">Two-stroke sessions</span><h2>Yamaha RD400</h2><span>Into the hills <FaArrowUpRightFromSquare aria-hidden="true" /></span></div><span className="hero-play"><FaPlay aria-hidden="true" /></span></External>
      </section></div>
    </div>
    <main>
    <section className="garage section" id="garage" aria-labelledby="garage-heading">
      <div className="section-bar"><h2 id="garage-heading">Featured builds</h2><span className="rule" /><p>Real projects. Real garage time.</p></div>
      <div className="project-grid">{projects.map(p => <button className="project" key={p.id} onClick={() => setProject(p)} aria-label={`Explore ${p.name}`}><div className="project-photo"><img src={p.image} alt={`${p.name} channel video thumbnail`} width="480" height="360" /><span className="explore">Explore build <FaArrowRight aria-hidden="true" /></span></div><div className="project-title"><h3>{p.name}</h3><p><span />{p.tag}</p></div></button>)}</div>
    </section>
    <section className="films section" id="films" aria-labelledby="film-heading">
      <div className="section-intro"><div><span className="eyebrow">From the channel</span><h2 id="film-heading">Garage time.<br />Screen time.</h2></div><p>The wins, the fixes, and the rides in between.<br />Straight from DualBore Media.</p></div>
      <div className="film-toolbar"><div className="filters" role="group" aria-label="Filter films">{['All films', 'Motorcycles', 'Cars', 'Pit bikes'].map(f => <button key={f} aria-pressed={filter === f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div><External href={`${channel.url}/videos`} className="text-link">All videos <FaArrowUpRightFromSquare aria-hidden="true" /></External></div>
      <p className="sr-only" role="status">{films.filter(f => filter === 'All films' || f.category === filter).length} films shown</p>
      <div className="film-grid">{films.filter(f => filter === 'All films' || f.category === filter).map(f => <External className="film" key={f.id} href={`https://www.youtube.com/watch?v=${f.id}`}><div className="film-image"><img src={f.image} width="480" height="360" loading="lazy" alt="" /><span className="play"><FaPlay aria-hidden="true" /></span></div><span className="eyebrow">{f.label}</span><h3>{f.title}</h3><span className="film-action">Watch on YouTube <FaArrowUpRightFromSquare aria-hidden="true" /></span></External>)}</div>
    </section>
    <section className="about section" id="about" aria-labelledby="about-heading"><div><span className="eyebrow">This is DualBore Media</span><h2 id="about-heading">Where garage work<br />meets wide-open<br /><span>throttle.</span></h2></div><div className="about-copy"><p>Two-stroke builds. Pit-bike races. GoPro rides. Modified cars. We’re here for the machines—and everything it takes to keep them moving.</p><p>From RD400 projects and SV1000 rides to N54 upgrades, follow the wins, failures, cold starts, and garage fixes that happen along the way.</p><External href={channel.url} className="button"><FaYoutube aria-hidden="true" /> Ride with us</External><External href={channel.community} className="text-link community">Join the YouTube community <FaArrowUpRightFromSquare aria-hidden="true" /></External></div></section>
    <section className="shop section" id="shop" aria-labelledby="shop-heading">
      <div className="shop-heading"><span className="eyebrow">Drop 01 · Coming soon</span><h2 id="shop-heading">Garage bred.<br /><span>Ride inspired.</span></h2></div>
      <div className="shop-copy"><p>The first DualBore designs, straight from the garage. A preview of what’s coming next.</p><button className="button red-glow-sm" onClick={() => setDropAlert(true)}>Drop 01 Alert <FaArrowRight aria-hidden="true" /></button></div>
      <div className="merch-grid">{merch.map(item => <article className="merch-card" key={item.id}>
        <div className="merch-image"><img src={item.image} alt={`${item.name} mockup preview`} width="1290" height="2796" loading="lazy" /><span className="drop-badge">Drop 01</span></div>
        <div className="merch-copy"><h3>{item.name}</h3><p>{item.detail}</p></div><span className="coming">Coming soon</span>
      </article>)}</div>
      <p className="shop-note">Design preview · Orders aren’t open yet. Watch the channel for updates.</p>
    </section>
    </main>
    <footer className="footer section"><a href="#top" className="footer-brand">DualBore Media</a><p>Built. Ridden. Repeat.</p><External href={channel.url} aria-label="DualBore Media on YouTube"><FaYoutube size={25} /></External><a href="#top">Back to top</a><small>© {new Date().getFullYear()} DualBore Media</small></footer>
    <dialog ref={dialog} onCancel={close} onClose={() => { setProject(null); setDropAlert(false); }} onClick={e => { if (e.target === dialog.current) close(); }} aria-labelledby={dropAlert ? 'drop-heading' : 'project-heading'}>
      {project && <div className="project-dialog"><button className="close-dialog" onClick={close} aria-label="Close build details" autoFocus><FaXmark /></button><img className="dialog-image" src={project.image} alt={`${project.name} channel video thumbnail`} /><div className="dialog-copy"><span className="eyebrow">Inside the garage · {project.category}</span><h2 id="project-heading">{project.name}</h2><p>{project.description}</p><ul>{project.details.map(d => <li key={d}>{d}</li>)}</ul><External className="button" href={`https://www.youtube.com/watch?v=${project.video}`}><FaYoutube aria-hidden="true" />{project.action}</External>{project.relatedVideo && <External className="text-link related-video" href={`https://www.youtube.com/watch?v=${project.relatedVideo}`}>Watch the POV ride <FaArrowUpRightFromSquare aria-hidden="true" /></External>}</div></div>}
      {dropAlert && <div className="drop-dialog dialog-copy"><button className="close-dialog" onClick={close} aria-label="Close drop alert" autoFocus><FaXmark /></button><span className="eyebrow">Drop 01 · Coming soon</span><h2 id="drop-heading">First out of<br /><span>the garage.</span></h2><p>Orders aren’t open yet. Subscribe to DualBore Media on YouTube and turn on channel notifications for drop announcements.</p><External className="button red-glow-sm" href={channel.url}><FaYoutube aria-hidden="true" /> Visit the channel</External><small>Updates are shared on YouTube. No email signup required.</small></div>}
    </dialog>
  </>;
}
