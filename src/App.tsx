import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Brand, Bolt, Arrow } from './components/Brand'
import { products, regions, faqs } from './data'
import { useExperience, useReducedMotion } from './useExperience'

import Rulebreaker from './components/Rulebreaker'
const image = (name: string) => `/images/${name}.webp`
const mail = 'info@voldenergy.in'
const whatsapp = 'https://wa.me/918010865535'

export default function App() {
  const root = useRef<HTMLElement>(null)
  const menu = useRef<HTMLDialogElement>(null)
  const detail = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState(0)

  const [menuOpen, setMenuOpen] = useState(false)
  const [region, setRegion] = useState('Maharashtra')
  const [enquiryType, setEnquiryType] = useState('Trade partnership')
  const [emailStatus, setEmailStatus] = useState('')
  const reduced = useReducedMotion()
  const product = products[selected]
  useExperience(root, reduced)

  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])

  const closeMenu = () => { menu.current?.close(); setMenuOpen(false) }
  const openMenu = () => { menu.current?.showModal(); setMenuOpen(true) }
  const composeEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = `Name: ${form.get('name')}\nEmail: ${form.get('email')}\nCity / territory: ${form.get('city')}\nEnquiry: ${enquiryType}\n\n${form.get('message')}`
    window.location.href = `mailto:${mail}?subject=${encodeURIComponent(`VOLD — ${enquiryType}`)}&body=${encodeURIComponent(body)}`
    setEmailStatus('Your email draft is ready to open. Send it from your email app, or contact info@voldenergy.in directly.')
  }

  return <main ref={root} style={{ '--accent': product.color } as CSSProperties}>
    <a className="skip-link" href="#range">Skip to the range</a>
    <header className="site-header">
      <a href="#top" aria-label="VOLD home"><Brand /></a>
      <nav className="desktop-nav" aria-label="Main navigation"><a href="#range">The range</a><a href="#story">Our story</a><a href="#find">Find VOLD</a></nav>
      <div className="header-actions"><a className="button button-small button-white" href="#contact">Stock VOLD <Arrow diagonal /></a><button className="menu-trigger" onClick={openMenu} aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={menuOpen}><span /><span /></button></div>
    </header>

    <dialog className="menu-dialog" ref={menu} onClose={() => setMenuOpen(false)} aria-label="Site navigation" data-lenis-prevent>
      <div className="menu-head"><Brand /><button className="close-button" onClick={closeMenu} aria-label="Close navigation">×</button></div>
      <nav aria-label="Mobile navigation">{[['The range', 'range'], ['Our story', 'story'], ['Find VOLD', 'find'], ['Stock VOLD', 'contact']].map(([label, id], i) => <a key={id} href={`#${id}`} onClick={closeMenu}><span className="mono">0{i + 1}</span>{label}<Arrow diagonal /></a>)}</nav>
      <p className="mono">Born in India. Made to stand out.</p>
    </dialog>

    <Rulebreaker key={reduced ? 'calm' : 'full'} reduced={reduced} />

    <section id="range" className="new-range section-pad" aria-labelledby="range-heading">
      <div className="section-top"><span className="eyebrow">03 / THE ACTUAL BAD INFLUENCE</span><span className="mono">THE MESS WAS VIRTUAL. THE DRINKS ARE REAL.</span></div>
      <div className="section-heading" data-reveal><h2 id="range-heading">GOOD TASTE.<br /><span className="outline-text">BAD INFLUENCE.</span></h2><p className="body-copy">Four personalities. All a little VOLD.<br />Pick the one that feels like you.</p></div>
      <div className="drink-lineup">{products.map((item, i) => <button key={item.id} className="drink-card" onClick={() => { setSelected(i); detail.current?.showModal() }} style={{ '--drink': item.color } as CSSProperties} aria-label={`Discover ${item.name}`}><span className="drink-top mono"><span>0{i + 1}</span><span>{item.category}</span><Arrow diagonal /></span><span className="drink-slogan" aria-hidden="true">{[['STAY', 'LOUD.'], ['BITE', 'BACK.'], ['FEEL', 'THE HEAT.'], ['MIX', 'IT UP.']][i].map((line, index) => <span key={index}>{line}</span>)}</span><img src={image(item.image)} alt={`VOLD ${item.name} 250 ml can`} loading="lazy" width="180" height="420" /><span className="drink-name"><strong>{item.name}</strong><span className="mono">250 ML / {i < 2 ? 'ENERGY' : 'MIXER'} <span>+</span></span></span></button>)}</div>
      <div className="range-footnote mono"><span>INDEPENDENT ENERGY. BORN IN INDIA.</span><a href="#find">FIND YOUR NEXT VOLD <Arrow /></a></div>
    </section>

    <div className="manifesto-strip" aria-hidden="true"><div className="marquee-track">{Array.from({ length: 4 }, (_, i) => <span key={i}>NO RULES. JUST VOLD. <Bolt /> BRING YOUR OWN ENERGY. <Bolt /></span>)}</div></div>

    <section id="formats" className="formats section-pad" aria-labelledby="formats-heading">
      <div className="section-top" data-reveal><span className="eyebrow">04 / EVERY VERSION OF YOU</span><span className="mono">ONE BRAND. DIFFERENT PLANS.</span></div>
      <div className="section-heading" data-reveal><h2 id="formats-heading">SAME ATTITUDE.<br /><span className="outline-text">DIFFERENT SHAPE.</span></h2><p className="body-copy">The quick stop. The long night.<br />The table with your name on it.<br />There’s a VOLD for that.</p></div>
      <div className="format-grid">{[
        { name: 'The original carry.', type: 'SLIM CAN', volume: '250 ML', img: 'can_classic', text: 'Cold from the fridge. Ready when you are.', cls: 'can-format' },
        { name: 'Take it further.', type: 'PET BOTTLE', volume: '250 ML', img: 'pet_classic', text: 'Light, resealable, and along for the ride.', cls: 'pet-format' },
        { name: 'Make an occasion.', type: 'GLASS BOTTLE', volume: '275 ML', img: 'glass_classic_up', text: 'A proper pour for your table or bar.', cls: 'glass-format' },
      ].map((item, i) => <article key={item.type} className={`format-item ${item.cls}`} data-reveal><div className="format-label mono"><span>0{i + 1} / {item.type}</span><span>{item.volume}</span></div><div className="format-visual"><span className="format-watermark" aria-hidden="true">{['GO.', 'MOVE.', 'STAY.'][i]}</span><img src={image(item.img)} alt={`VOLD ${item.type.toLowerCase()}`} loading="lazy" width="220" height="420" /></div><h3>{item.name}</h3><p>{item.text}</p><a href="#contact" className="format-link" aria-label={`Enquire about ${item.type.toLowerCase()}`}><Arrow diagonal /></a></article>)}</div>
      <p className="format-note mono">Formats vary by product and region. Ask us what’s available near you.</p>
    </section>

    <section className="culture" aria-labelledby="culture-heading">
      <div className="culture-heading section-pad" data-reveal><span className="eyebrow">05 / OUT IN THE WORLD</span><h2 id="culture-heading">LIFE DOESN’T<br />DO <span className="accent-text">ORDINARY.</span></h2><p className="body-copy">Neither should your drink.</p></div>
      <div className="culture-grid"><figure className="culture-large"><img src={image('sky_cheers')} alt="Friends raising VOLD mixers into the blue sky" loading="lazy" width="1100" height="724" /><figcaption className="mono"><span>GOOD COMPANY. GREAT TASTE.</span><span>VOLD / IN THE WILD</span></figcaption></figure><figure className="culture-small"><img src={image('classic_jeans')} alt="A chilled VOLD Classic can on the go" loading="lazy" width="655" height="1000" /><figcaption><Bolt /><span>TAKE YOUR<br />ENERGY WITH YOU.</span></figcaption></figure></div>
    </section>

    <section id="story" className="story section-pad" aria-labelledby="story-heading">
      <div className="section-top" data-reveal><span className="eyebrow">06 / HOMEGROWN. FULLY CHARGED.</span><span className="mono">PUNE → EVERYWHERE NEXT</span></div>
      <div className="story-intro" data-reveal><h2 id="story-heading">BORN HERE.<br /><span className="outline-text">GOING PLACES.</span></h2><div><p className="story-lead">India has its own rhythm.<br />We made a drink to match.</p><p className="body-copy">VOLD began in Pune in 2022 with a simple idea: make something with a personality of its own. An independent spirit, a bold first sip, and a place in your everyday.</p><a className="text-button" href="#contact">Be part of what’s next <Arrow diagonal /></a></div></div>
      <div className="story-proof"><a className="pitch-image" href="https://youtu.be/71We4gJr06g" target="_blank" rel="noreferrer" aria-label="Watch the VOLD Shark Tank India pitch on YouTube"><img src={image('st1')} alt="VOLD presenting on Shark Tank India" loading="lazy" width="900" height="506" /><span className="play-button" aria-hidden="true">▶</span><span className="mono">WATCH THE PITCH <Arrow diagonal /></span></a><div className="story-milestones"><span className="eyebrow">A LITTLE BACKSTORY</span><div><strong>2022</strong><p>A bold idea.<small>VOLD is founded in Pune.</small></p></div><div><strong>2023</strong><p>The first sip.<small>Our first products hit the shelves.</small></p></div><div><strong>2024</strong><p>A bigger stage.<small>Shark Tank India. Season 3.</small></p></div></div></div>
    </section>

    <section id="find" className="find section-pad" aria-labelledby="find-heading">
      <div data-reveal><span className="eyebrow">07 / CLOSER THAN YOU THINK</span><h2 id="find-heading">FIND YOUR<br /><span className="outline-text">NEXT VOLD.</span></h2><p className="body-copy">From neighbourhood shelves to your favourite hangouts.<br />Let’s find your next cold one.</p></div>
      <div className="find-panel" data-reveal><label className="mono" htmlFor="region">YOUR REGION</label><select id="region" value={region} onChange={event => setRegion(event.target.value)}>{regions.map(name => <option key={name}>{name}</option>)}<option>Somewhere else</option></select><p>Tell the team your city and favourite flavour to check local availability.</p><a className="button button-white" href={`${whatsapp}?text=${encodeURIComponent(`Hi VOLD, I'd like to check availability in ${region}. My city is: `)}`} target="_blank" rel="noreferrer">Ask about availability <Arrow diagonal /></a><span className="mono helper">OPENS WHATSAPP · AVAILABILITY CONFIRMED BY THE TEAM</span></div>
    </section>

    <section className="faq section-pad" aria-labelledby="faq-heading"><div data-reveal><span className="eyebrow">THE GOOD-TO-KNOWS</span><h2 id="faq-heading">A LITTLE<br /><span className="outline-text">CLARITY.</span></h2></div><div className="faq-list">{faqs.map((item, i) => <details key={item.q}><summary><span className="mono">0{i + 1}</span>{item.q}<span className="faq-plus" aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></section>

    <section id="contact" className="contact section-pad" aria-labelledby="contact-heading"><div className="contact-copy" data-reveal><span className="eyebrow">08 / LET’S MAKE SOME NOISE</span><h2 id="contact-heading">YOUR SHELF.<br />OUR <span>ENERGY.</span></h2><p>Run a store, a bar, or an entire territory?<br />There’s room for you in the VOLD story.</p><a className="contact-email" href={`mailto:${mail}`}>{mail} <Arrow diagonal /></a><a className="mono contact-phone" href="tel:+918010865535">+91 80108 65535</a><div className="contact-location mono">PUNE / MUMBAI / INDIA</div></div><form className="enquiry-form" onSubmit={composeEmail}><div className="form-top"><span className="mono">START A CONVERSATION</span><Arrow diagonal /></div><label htmlFor="enquiry">I’m here for<select id="enquiry" name="enquiry" value={enquiryType} onChange={event => setEnquiryType(event.target.value)}><option>Trade partnership</option><option>Retail / bar enquiry</option><option>Product availability</option><option>Something else</option></select></label><div className="form-row"><label htmlFor="name">Your name<input id="name" name="name" autoComplete="name" placeholder="Full name" required maxLength={100} /></label><label htmlFor="email">Email address<input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required maxLength={180} /></label></div><label htmlFor="city">City / territory<input id="city" name="city" autoComplete="address-level2" placeholder="Where do you make things happen?" required maxLength={150} /></label><label htmlFor="message">Tell us a little more<textarea id="message" name="message" placeholder="Your business, the products you’re interested in, or just say hello." rows={3} required maxLength={1500} /></label><button className="button button-black" type="submit">Create email enquiry <Arrow diagonal /></button><p className="form-help">Opens a draft in your email app. You send it when you’re ready.</p><p className="form-status" role="status">{emailStatus}</p></form></section>

    <footer className="site-footer section-pad"><div className="footer-top"><span className="mono">INDEPENDENT SPIRIT. UNMISTAKABLE ENERGY.</span><a href="#top" className="mono">BACK TO THE TOP ↑</a></div><a className="footer-brand" href="#top" aria-label="VOLD home"><Brand /></a><div className="footer-bottom"><span>© {new Date().getFullYear()} Vold Energy Asia Pvt. Ltd.</span><span>NO RULES. JUST VOLD.</span><a href={`mailto:${mail}`}>LET’S TALK <Arrow diagonal /></a></div></footer>

    <dialog className="product-dialog" ref={detail} onClick={event => { if (event.target === event.currentTarget) detail.current?.close() }} aria-labelledby="product-dialog-title" data-lenis-prevent><div className="product-dialog-inner"><button className="close-button" onClick={() => detail.current?.close()} aria-label="Close product details">×</button><div className="dialog-product"><img src={image(product.image)} alt={`VOLD ${product.name} can`} /></div><div className="dialog-copy"><span className="eyebrow">{product.category}</span><h2 id="product-dialog-title">{product.name}</h2><p>{product.description}</p><ul>{product.details.map(spec => <li key={spec}>{spec}</li>)}</ul><p className="helper">{product.note}</p><a href="#find" className="button button-accent" onClick={() => detail.current?.close()}>Find VOLD <Arrow /></a></div></div></dialog>
  </main>
}
