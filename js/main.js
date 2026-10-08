/* ═══════════════════════════════════════════════════════════
   Check-in  →  Flight Information  →  The Island
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, reduced ? Math.min(ms, 120) : ms));

  const DEFAULTS = { name: 'Traveler', famous: 'Curious Visitor', island: 'Far Far Away' };
  let visitor = { ...DEFAULTS };

  /* ── stage switching ─────────────────────────────────── */
  const stages = {
    checkin: $('#stage-checkin'),
    flight:  $('#stage-flight'),
    site:    $('#stage-site'),
  };

  async function showStage(next) {
    const from = $$('.stage').find(s => s.classList.contains('is-active'));
    if (from) {
      from.classList.remove('is-active');
      await wait(550);
      from.hidden = true;
    }
    const to = stages[next];
    to.hidden = false;
    void to.offsetHeight;      // force a reflow so the fade actually transitions
    to.classList.add('is-active');
    document.body.classList.toggle('is-locked', next !== 'site');
  }

  /* ═══════════════════════════════════════════════════════
     STAGE 1 — check-in
     ═══════════════════════════════════════════════════════ */
  const dialogueText = $('#dialogueText');
  const dialogueNext = $('#dialogueNext');
  const form         = $('#checkinForm');
  const formError    = $('#formError');

  const SCRIPT = [
    'Welcome…to the check-in counter for your Deserted Island Getaway Package!',
    'Before we get you on that plane, could we trouble you for a few details?',
  ];

  let typing = false;
  let line = 0;
  let skipPause = null;        // set while a read-beat is running

  /* Like wait(), but a click or keypress can cut it short. */
  function pause(ms) {
    return new Promise(resolve => {
      const done = () => { clearTimeout(timer); skipPause = null; resolve(); };
      const timer = setTimeout(done, reduced ? 200 : ms);
      skipPause = done;
    });
  }

  /* Types one line out, character by character. Clicking mid-type finishes it. */
  function type(text) {
    return new Promise(resolve => {
      typing = true;
      dialogueNext.classList.remove('is-on');
      dialogueText.textContent = '';

      if (reduced) { dialogueText.textContent = text; typing = false; resolve(); return; }

      let i = 0;
      const caret = document.createElement('span');
      caret.className = 'caret';
      dialogueText.append(caret);

      const tick = setInterval(() => {
        if (!typing) {                       // skipped ahead
          clearInterval(tick);
          dialogueText.textContent = text;
          resolve();
          return;
        }
        caret.before(text[i++]);
        // a beat after sentence punctuation, like the games do
        if (i >= text.length) {
          clearInterval(tick);
          caret.remove();
          typing = false;
          resolve();
        }
      }, 28);
    });
  }

  async function advance() {
    if (typing) { typing = false; return; }   // first click completes the line
    if (skipPause) { skipPause(); return; }   // second click skips the read-beat
    if (line >= SCRIPT.length) return;

    await type(SCRIPT[line]);
    line++;

    if (line < SCRIPT.length) {
      dialogueNext.classList.add('is-on');
    } else {
      // Give the last line room to be read before the form slides in.
      dialogueNext.classList.add('is-on');
      await pause(3000);
      dialogueNext.classList.remove('is-on');

      form.hidden = false;
      $('#fName').focus({ preventScroll: true });
    }
  }

  $('#dialogue').addEventListener('click', ev => {
    if (ev.target.closest('.fields')) return;  // don't advance while filling the form
    advance();
  });

  addEventListener('keydown', ev => {
    if (!stages.checkin.classList.contains('is-active')) return;
    if (form.hidden && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); advance(); }
  });

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const name   = $('#fName').value.trim();
    const famous = $('#fFamous').value.trim();
    const island = $('#fIsland').value.trim();

    if (!name || !famous || !island) {
      formError.hidden = false;
      [$('#fName'), $('#fFamous'), $('#fIsland')].find(i => !i.value.trim()).focus();
      return;
    }
    formError.hidden = true;
    board({ name, famous, island });
  });

  $('#skipIntro').addEventListener('click', () => board(DEFAULTS, true));

  /* ═══════════════════════════════════════════════════════
     STAGE 2 — flight information
     ═══════════════════════════════════════════════════════ */
  async function board(data, fast = false) {
    visitor = data;
    sessionStorage.setItem('nook.visitor', JSON.stringify(visitor));

    $('#outName').textContent   = visitor.name;
    $('#outFamous').textContent = visitor.famous;
    $('#outIsland').textContent = visitor.island;

    await showStage('flight');
    await flightSequence(fast);
    landOnIsland();
  }

  async function flightSequence(fast) {
    const hops = $$('#track .node--hop');   // ordered left → right in the DOM
    const goal = $('#track .node--goal');
    const hint = $('#flightHint');
    const beat = fast || reduced ? 260 : 900;

    await wait(beat * 0.7);

    // the glow travels right → left, toward "Starting Descent"
    for (let i = hops.length - 1; i >= 0; i--) {
      hops.forEach(h => h.classList.remove('is-lit'));
      hops[i].classList.add('is-lit');
      hint.textContent = i > 1 ? 'Cruising…' : 'Approaching the island…';
      await wait(beat);
    }

    hops.forEach(h => h.classList.remove('is-lit'));
    goal.classList.add('is-lit');
    hint.textContent = 'Starting descent…';
    await wait(beat * 1.3);
  }

  /* ═══════════════════════════════════════════════════════
     STAGE 3 — the island
     ═══════════════════════════════════════════════════════ */
  async function landOnIsland() {
    $('#greetName').textContent = visitor.name;
    $('#greetIsle').textContent = visitor.island;
    $('#chipName').textContent  = visitor.name;
    $('#chipIsle').textContent  = visitor.island;
    document.title = `jwadehyun`;

    await showStage('site');
    initSite();
  }

  let siteReady = false;
  function initSite() {
    if (siteReady) return;
    siteReady = true;

    const scroller = $('#scroller');
    const panels   = $$('.panel', scroller);
    const navLinks = $$('[data-nav]');
    const dotLinks = $$('[data-dot]');
    const cue      = $('.scroll-cue');
    let current = 0;

    /* active section */
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        current = panels.indexOf(e.target);
        const id = e.target.id;
        navLinks.forEach(a => a.classList.toggle('is-active', a.dataset.nav === id));
        dotLinks.forEach(a => a.classList.toggle('is-active', a.dataset.dot === id));
      });
    }, { root: scroller, threshold: 0.55 });
    panels.forEach(p => spy.observe(p));

    /* reveals, staggered per panel */
    if (!reduced) {
      const reveal = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const group = $$('[data-reveal]', e.target.closest('.panel'));
          e.target.style.setProperty('--d', `${group.indexOf(e.target) * 80}ms`);
          e.target.classList.add('is-in');
          obs.unobserve(e.target);
        });
      }, { root: scroller, threshold: 0.15 });
      $$('[data-reveal]', scroller).forEach(el => reveal.observe(el));
    }

    /* hide the scroll cue once you've left the hero */
    scroller.addEventListener('scroll', () => {
      cue.classList.toggle('is-hidden', scroller.scrollTop > 60);
    }, { passive: true });

    const goTo = i => panels[Math.max(0, Math.min(panels.length - 1, i))]
      .scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });

    [...navLinks, ...dotLinks, cue, $('.brand')].forEach(a =>
      a.addEventListener('click', ev => {
        const target = $(a.getAttribute('href'));
        if (!target) return;
        ev.preventDefault();
        goTo(panels.indexOf(target));
      }));

    addEventListener('keydown', ev => {
      if (!stages.site.classList.contains('is-active')) return;
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;

      switch (ev.key) {
        case 'ArrowDown': case 'PageDown': case ' ':
          ev.preventDefault(); goTo(current + 1); break;
        case 'ArrowUp': case 'PageUp':
          ev.preventDefault(); goTo(current - 1); break;
        case 'Home': ev.preventDefault(); goTo(0); break;
        case 'End':  ev.preventDefault(); goTo(panels.length - 1); break;
        default:
          if (/^[1-4]$/.test(ev.key)) { ev.preventDefault(); goTo(+ev.key - 1); }
      }
    });

    /* "check in again" */
    $('#visitorChip').addEventListener('click', () => {
      sessionStorage.removeItem('nook.visitor');
      location.reload();
    });
  }

  /* ═══════════════════════════════════════════════════════
     Boot — returning visitors this session skip the counter
     ═══════════════════════════════════════════════════════ */
  const saved = sessionStorage.getItem('nook.visitor');
  if (saved) {
    try {
      visitor = { ...DEFAULTS, ...JSON.parse(saved) };
      stages.checkin.classList.remove('is-active');
      stages.checkin.hidden = true;
      landOnIsland();
    } catch { advance(); }
  } else {
    advance();
  }
})();
