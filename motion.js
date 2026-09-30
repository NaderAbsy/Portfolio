/* Nader Absy — motion layer.
   Loaded before script.js so headings are split before the reveal
   observer marks them visible. Does nothing under reduced motion. */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.hasAttribute('data-motion')) return;

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------- split headings into characters ---------- */
  /* Screen readers get the original text via aria-label; the spans are presentational. */
  function split(el) {
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    var c = 0;
    text.split(' ').forEach(function (word, wi, words) {
      var w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      Array.from(word).forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch;
        s.style.setProperty('--c', c++);
        w.appendChild(s);
      });
      el.appendChild(w);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.classList.add('split');
  }
  document.querySelectorAll('.hero h1, .section-title').forEach(split);

  /* ---------- stagger indexes for list children ---------- */
  document.querySelectorAll('.tags, .bullets').forEach(function (list) {
    Array.from(list.children).forEach(function (li, i) { li.style.setProperty('--i', i); });
  });

  /* ---------- role line decodes from noise ---------- */
  var role = document.querySelector('.hero-role');
  if (role) {
    var glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=<>/\\';
    var walker = document.createTreeWalker(role, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push({ node: walker.currentNode, text: walker.currentNode.nodeValue });
    var total = nodes.reduce(function (n, x) { return n + x.text.length; }, 0);
    role.setAttribute('aria-label', role.textContent.replace(/\s+/g, ' ').trim());
    var start = null, delay = 650, duration = 1100;
    var tick = function (t) {
      if (start === null) start = t;
      var p = clamp((t - start - delay) / duration, 0, 1);
      var settled = Math.floor(p * total), k = 0;
      nodes.forEach(function (x) {
        var out = '';
        for (var i = 0; i < x.text.length; i++, k++) {
          var ch = x.text[i];
          out += (k < settled || ch === ' ') ? ch : glyphs[(Math.random() * glyphs.length) | 0];
        }
        x.node.nodeValue = out;
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- hero constellation ---------- */
  var hero = document.querySelector('.hero');
  var canvas = document.querySelector('.hero-canvas');
  if (hero && canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [], accent = '#2f6df6', running = false, heroVisible = true;
    var mouse = { x: -9999, y: -9999, active: false };
    var LINK = 130, REACH = 190;

    var readAccent = function () {
      accent = getComputedStyle(root).getPropertyValue('--accent').trim() || accent;
    };
    var rgba = function (a) {
      var m = accent.replace('#', '');
      if (m.length === 3) m = m.replace(/./g, '$&$&');
      var n = parseInt(m, 16);
      return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
    };

    var resize = function () {
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var want = Math.round(clamp(W * H / 13000, 28, 95));
      while (pts.length < want) {
        pts.push({ x: Math.random() * W, y: Math.random() * H,
                   vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
                   r: Math.random() * 1.6 + .8 });
      }
      pts.length = want;
    };

    var frame = function () {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (mouse.active) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < REACH && d > .1) {
            var f = (1 - d / REACH) * .6;
            p.vx += dx / d * f * .12; p.vy += dy / d * f * .12;
          }
        }
        p.vx *= .985; p.vy *= .985;
        // keep a minimum drift so the field never goes still
        if (Math.abs(p.vx) + Math.abs(p.vy) < .12) { p.vx += (Math.random() - .5) * .05; p.vy += (Math.random() - .5) * .05; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
      }
      ctx.lineWidth = 1;
      for (i = 0; i < pts.length; i++) {
        var a = pts[i];
        for (var j = i + 1; j < pts.length; j++) {
          var b = pts[j], ddx = a.x - b.x, ddy = a.y - b.y, dd = ddx * ddx + ddy * ddy;
          if (dd < LINK * LINK) {
            ctx.strokeStyle = rgba((1 - Math.sqrt(dd) / LINK) * .35);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (mouse.active) {
          var mx = a.x - mouse.x, my = a.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
          if (md < REACH * 1.2) {
            ctx.strokeStyle = rgba((1 - md / (REACH * 1.2)) * .6);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
        ctx.fillStyle = rgba(.75);
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    };

    var setRunning = function () {
      var should = heroVisible && !document.hidden;
      if (should && !running) { running = true; requestAnimationFrame(frame); }
      else if (!should) running = false;
    };

    readAccent(); resize();
    new MutationObserver(readAccent).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
    else window.addEventListener('resize', resize);
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; setRunning(); }).observe(hero);
    document.addEventListener('visibilitychange', setRunning);

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    });
    hero.addEventListener('pointerleave', function () { mouse.active = false; });
    setRunning();
  }

  /* ---------- hero photo tilts toward the pointer ---------- */
  var photo = document.querySelector('.hero-photo img');
  if (photo && finePointer && hero) {
    hero.addEventListener('pointermove', function (e) {
      var r = photo.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      var y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      photo.style.setProperty('--rx', clamp(x * 30, -14, 14) + 'deg');
      photo.style.setProperty('--ry', clamp(-y * 30, -14, 14) + 'deg');
    });
    hero.addEventListener('pointerleave', function () {
      photo.style.setProperty('--rx', '0deg'); photo.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- card tilt + spotlight ---------- */
  if (finePointer) {
    document.querySelectorAll('.skill-card, .project-card, .contact-card, .fact-card, .feature-card').forEach(function (card) {
      card.classList.add('tilt');
      var raf = 0, ev = null;
      var apply = function () {
        raf = 0;
        var r = card.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
        var max = clamp(1800 / r.width, 1.5, 7);
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        card.style.transform = 'perspective(900px) rotateX(' + ((.5 - py) * max * 2).toFixed(2) +
          'deg) rotateY(' + ((px - .5) * max * 2).toFixed(2) + 'deg) translateY(-4px)';
      };
      card.addEventListener('pointerenter', function () {
        card.style.transitionDelay = '0ms';  // drop the reveal stagger so tilt responds instantly
        card.classList.add('tilting');
      });
      card.addEventListener('pointermove', function (e) { ev = e; if (!raf) raf = requestAnimationFrame(apply); });
      card.addEventListener('pointerleave', function () {
        if (raf) cancelAnimationFrame(raf), raf = 0;
        card.classList.remove('tilting');
        card.style.transform = '';
      });
    });

    /* ---------- magnetic buttons ---------- */
    document.querySelectorAll('.hero .btn, .socials a, .icon-btn').forEach(function (el) {
      el.classList.add('magnetic');
      el.addEventListener('pointerenter', function () { el.style.transitionDelay = '0ms'; });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (x * .3).toFixed(1) + 'px,' + (y * .4).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    /* ---------- cursor follower ---------- */
    var ring = document.createElement('div'), dot = document.createElement('div');
    ring.className = 'cursor-ring'; dot.className = 'cursor-dot';
    ring.setAttribute('aria-hidden', 'true'); dot.setAttribute('aria-hidden', 'true');
    document.body.append(ring, dot);
    var tx = -100, ty = -100, rx = -100, ry = -100, following = false;
    var follow = function () {
      rx = lerp(rx, tx, .18); ry = lerp(ry, ty, .18);
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
      if (Math.abs(rx - tx) > .1 || Math.abs(ry - ty) > .1) requestAnimationFrame(follow);
      else following = false;
    };
    var interactive = 'a, button, .tilt, .tags li, [role="button"]';
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      root.classList.add('cursor-on');
      root.classList.toggle('cursor-hover', !!(e.target.closest && e.target.closest(interactive)));
      if (!following) { following = true; requestAnimationFrame(follow); }
    });
    document.addEventListener('pointerdown', function () { root.classList.add('cursor-down'); });
    document.addEventListener('pointerup', function () { root.classList.remove('cursor-down'); });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) root.classList.remove('cursor-on'); });
  }

  /* ---------- scroll-driven: progress, timeline, parallax ---------- */
  var bar = document.querySelector('.scroll-progress');
  var timeline = document.querySelector('.timeline');
  var tlItems = timeline ? Array.from(timeline.querySelectorAll('.timeline-item')) : [];
  var tlLine = null;
  if (timeline) {
    tlLine = document.createElement('span');
    tlLine.className = 'timeline-progress';
    tlLine.setAttribute('aria-hidden', 'true');
    timeline.prepend(tlLine);
  }
  var aboutImg = document.querySelector('.about-photo img');
  var aurora = document.querySelector('.hero-aurora');

  var scheduled = false;
  var onScroll = function () {
    scheduled = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var p = clamp((vh * .65 - r.top) / r.height, 0, 1);
      tlLine.style.setProperty('--tl', p.toFixed(4));
      var reach = r.top + p * r.height;
      tlItems.forEach(function (it) {
        it.classList.toggle('lit', it.getBoundingClientRect().top + 12 <= reach);
      });
    }

    if (aboutImg) {
      var ar = aboutImg.parentElement.getBoundingClientRect();
      if (ar.bottom > 0 && ar.top < vh) {
        var t = (ar.top + ar.height / 2 - vh / 2) / vh;
        aboutImg.style.setProperty('--par', (t * -40).toFixed(1) + 'px');
      }
    }

    if (aurora && y < vh * 1.5) aurora.style.setProperty('--hero-shift', (y * .35).toFixed(1) + 'px');
  };
  window.addEventListener('scroll', function () {
    if (!scheduled) { scheduled = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
