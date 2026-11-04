import * as THREE from 'three';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);
const mobile = () => innerWidth < 960;

/* ---------- rolagem suave ---------- */
let lenis;
if (window.Lenis) {
  lenis = new Lenis({ lerp: 0.085 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis ? (lenis.start(), lenis).scrollTo(id, { offset: -40 }) : document.querySelector(id).scrollIntoView({ behavior: 'smooth' }); }
}));

/* ---------- cabeçalho / cursor ---------- */
const header = document.querySelector('.header');
addEventListener('scroll', () => header.classList.toggle('is-scrolled', scrollY > 30), { passive: true });
const nav = document.getElementById('nav');
document.getElementById('burger').addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
document.getElementById('ano').textContent = new Date().getFullYear();
const glow = document.querySelector('.cursor-glow');
addEventListener('pointermove', e => gsap.to(glow, { left: e.clientX, top: e.clientY, duration: .6, ease: 'power3.out' }));

/* ---------- hero ---------- */
const tl = gsap.timeline({ delay: .15 });
tl.from('.hero__img img', { scale: 1.3, opacity: 0, duration: 2, ease: 'expo.out' }, 0)
  .from('.hero__title .split', { y: 80, rotateX: -70, opacity: 0, transformPerspective: 800, transformOrigin: '50% 100%', duration: 1.2, stagger: .14, ease: 'expo.out' }, .2)
  .to('.hero .reveal-up', { opacity: 1, y: 0, duration: 1, stagger: .1, ease: 'expo.out' }, .5);
gsap.to('.hero__img img', { scale: 1.15, yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
gsap.to('.hero__content', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true } });

/* ================= PARTÍCULAS 3D QUE SE TRANSFORMAM ================= */
(function morphScene() {
  const canvas = document.getElementById('morph');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
  camera.position.z = 9;

  const N = mobile() ? 5000 : 9000;
  const A = new Float32Array(N * 3), B = new Float32Array(N * 3), C = new Float32Array(N * 3), R = new Float32Array(N);
  // A: esfera (fibonacci)
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
    const rad = 2.3 + (Math.random() - .5) * .08;
    A.set([Math.cos(th) * r * rad, y * rad, Math.sin(th) * r * rad], i * 3);
    R[i] = Math.random();
  }
  // B: nó toroidal (conexões)
  const knot = new THREE.TorusKnotGeometry(1.6, .5, 400, 32, 2, 3).attributes.position;
  for (let i = 0; i < N; i++) {
    const k = Math.floor(Math.random() * knot.count);
    B.set([knot.getX(k) + (Math.random() - .5) * .06, knot.getY(k) + (Math.random() - .5) * .06, knot.getZ(k) + (Math.random() - .5) * .06], i * 3);
  }
  // C: balão de conversa com "digitando..."
  const W = 4.4, H = 2.8, rr = .7;
  const inBubble = (x, y) => {
    const dx = Math.max(Math.abs(x) - (W / 2 - rr), 0), dy = Math.max(Math.abs(y) - (H / 2 - rr), 0);
    return dx * dx + dy * dy <= rr * rr;
  };
  for (let i = 0; i < N; i++) {
    let x, y, z;
    const t = Math.random();
    if (t < .22) { // três pontos
      const d = Math.floor(Math.random() * 3), u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1), rad = .32;
      x = (d - 1) * 1.1 + Math.sin(v) * Math.cos(u) * rad; y = Math.sin(v) * Math.sin(u) * rad; z = Math.cos(v) * rad + .3;
    } else if (t < .3) { // rabinho
      const s = Math.random(), w = (1 - s) * .55;
      x = -1.3 - s * .7 + (Math.random() - .5) * w; y = -H / 2 - s * .8; z = (Math.random() - .5) * .3;
    } else { // contorno + preenchimento
      do { x = (Math.random() - .5) * W; y = (Math.random() - .5) * H; } while (!inBubble(x, y));
      const edge = !inBubble(x * 1.09, y * 1.12);
      z = edge ? (Math.random() - .5) * .5 : (Math.random() - .5) * .12 - .15;
      if (!edge && Math.random() < .6) { i--; continue; }
    }
    C.set([x, y + .2, z], i * 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(A.slice(), 3));
  geo.setAttribute('aA', new THREE.BufferAttribute(A, 3));
  geo.setAttribute('aB', new THREE.BufferAttribute(B, 3));
  geo.setAttribute('aC', new THREE.BufferAttribute(C, 3));
  geo.setAttribute('aR', new THREE.BufferAttribute(R, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uM: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uMouse: { value: new THREE.Vector3(99, 99, 0) } },
    vertexShader: `
      attribute vec3 aA; attribute vec3 aB; attribute vec3 aC; attribute float aR;
      uniform float uT; uniform float uM; uniform float uPx; uniform vec3 uMouse;
      varying float vR; varying float vY;
      void main(){
        float m1 = smoothstep(0.0,1.0,clamp(uM,0.0,1.0));
        float m2 = smoothstep(0.0,1.0,clamp(uM-1.0,0.0,1.0));
        vec3 p = mix(mix(aA,aB,m1),aC,m2);
        float wob = sin(uT*1.5 + aR*40.0)*0.04 + sin(uM*3.14159)*0.25*(aR-0.5);
        p += normalize(p+0.0001)*wob;
        vec4 mv = modelViewMatrix*vec4(p,1.0);
        vec4 wp = modelMatrix*vec4(p,1.0);
        float d = distance(wp.xy, uMouse.xy);
        mv.xy += normalize(wp.xy-uMouse.xy+0.0001)*smoothstep(1.2,0.0,d)*0.35;
        gl_Position = projectionMatrix*mv;
        gl_PointSize = (2.0 + aR*3.0) * uPx * (9.0 / -mv.z);
        vR = aR; vY = p.y;
      }`,
    fragmentShader: `
      varying float vR; varying float vY;
      void main(){
        float d = length(gl_PointCoord-0.5);
        if(d>0.5) discard;
        vec3 g = vec3(0.0,0.96,0.63), pk = vec3(1.0,0.24,0.55), o = vec3(1.0,0.54,0.24);
        vec3 col = mix(g, pk, smoothstep(-2.0,2.4,vY + (vR-0.5)*1.5));
        col = mix(col, o, step(0.93,vR));
        gl_FragColor = vec4(col, smoothstep(0.5,0.0,d)*0.9);
      }`
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);

  // anel orbital
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, .006, 8, 200), new THREE.MeshBasicMaterial({ color: 0x00f5a0, transparent: true, opacity: .35 }));
  ring.rotation.x = 1.2; scene.add(ring);
  const ring2 = ring.clone(); ring2.material = ring.material.clone(); ring2.material.color.set(0xff3d8b); ring2.scale.setScalar(1.15); ring2.rotation.set(1.9, .4, 0); scene.add(ring2);

  const st = { m: 0, p: 0 };
  const texts = document.querySelectorAll('.btext'), dots = document.querySelectorAll('.brain__dots i');
  ScrollTrigger.create({
    trigger: '.brain', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: s => {
      const p = s.progress;
      gsap.to(st, { m: Math.min(2, Math.max(0, (p - .12) / .76 * 2)), p, duration: .8, ease: 'power2.out', overwrite: true });
      const idx = p < .38 ? 0 : p < .72 ? 1 : 2;
      texts.forEach((t, i) => t.classList.toggle('is-on', i === idx));
      dots.forEach((t, i) => t.classList.toggle('is-on', i === idx));
    }
  });

  const mouse = new THREE.Vector2(), ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    pts.position.set(mobile() ? 0 : 2.4, mobile() ? 1.4 : 0, 0);
    pts.scale.setScalar(mobile() ? .72 : 1);
    ring.position.copy(pts.position); ring2.position.copy(pts.position);
  }
  addEventListener('resize', resize); resize();

  let vis = false;
  new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(canvas);
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!vis) return;
    const t = clock.getElapsedTime();
    mat.uniforms.uT.value = t; mat.uniforms.uM.value = st.m;
    const bubble = Math.max(0, st.m - 1);
    pts.rotation.y = (t * .15 + st.p * Math.PI * 2) * (1 - bubble) + Math.sin(t * .5) * .25 * bubble;
    pts.rotation.x = Math.sin(t * .3) * .15 * (1 - bubble);
    ring.rotation.z = t * .2; ring2.rotation.z = -t * .15;
    ring.material.opacity = ring2.material.opacity = .35 * (1 - bubble * .7);
    ray.setFromCamera(mouse, camera);
    if (ray.ray.intersectPlane(plane, hit)) mat.uniforms.uMouse.value.copy(hit);
    camera.position.x += (mouse.x * .5 - camera.position.x) * .05;
    camera.position.y += (mouse.y * .3 - camera.position.y) * .05;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  })();
})();

/* ================= CELULAR 3D + CONVERSA ================= */
(function phoneDemo() {
  const phone = document.getElementById('phone');
  const msgs = [...document.querySelectorAll('#chat .msg')];
  const typing = document.getElementById('typing');
  let shown = -1;
  const render = n => {
    if (n === shown) return; shown = n;
    msgs.forEach((m, i) => {
      if (i < n) { if (!m.classList.contains('show')) { m.classList.add('show'); requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add('vis'))); } }
      else m.classList.remove('show', 'vis');
    });
    const next = msgs[n];
    typing.textContent = next && next.classList.contains('msg--out') && n > 0 ? 'digitando…' : 'online';
  };
  gsap.set(phone, { rotateY: -38, rotateX: 18, rotateZ: -6 });
  ScrollTrigger.create({
    trigger: '.demo', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: s => {
      const p = s.progress;
      gsap.to(phone, { rotateY: -38 + Math.min(p * 3, 1) * 38 + Math.max(0, p - .8) * 60, rotateX: 18 - Math.min(p * 3, 1) * 18, rotateZ: -6 + Math.min(p * 3, 1) * 6, duration: .6, ease: 'power2.out', overwrite: 'auto' });
      render(Math.min(msgs.length, Math.floor(Math.max(0, p - .1) / .75 * (msgs.length + .5))));
    }
  });
  ['.fc1', '.fc2', '.fc3'].forEach((c, i) => gsap.fromTo(c, { y: 120 + i * 60, opacity: 0 }, { y: -60 - i * 40, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.demo', start: 'top 60%', end: 'bottom bottom', scrub: true } }));
})();

/* ---------- contadores ---------- */
document.querySelectorAll('[data-count]').forEach(el => {
  const end = +el.dataset.count, dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '', o = { v: 0 };
  ScrollTrigger.create({ trigger: el, start: 'top 95%', once: true, onEnter: () =>
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => el.textContent = o.v.toFixed(dec).replace('.', ',') + suf }) });
});

/* ---------- bento ---------- */
gsap.utils.toArray('.tile').forEach((t, i) => gsap.from(t, { y: 80, opacity: 0, rotateX: 12, transformPerspective: 900, duration: 1.1, ease: 'expo.out', delay: (i % 3) * .08, scrollTrigger: { trigger: t, start: 'top 90%' } }));
document.querySelectorAll('.glow').forEach(el => el.addEventListener('pointermove', e => {
  const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
}));
gsap.utils.toArray('.head').forEach(h => gsap.from(h.children, { y: 40, opacity: 0, duration: 1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } }));

/* ---------- fluxo ---------- */
const path = document.getElementById('flowPath');
if (path) {
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  const ftl = gsap.timeline({ scrollTrigger: { trigger: '.flow__line', start: 'top 75%', end: 'bottom 45%', scrub: 1 } });
  ftl.to(path, { strokeDashoffset: 0, ease: 'none', duration: 4 }, 0);
  document.querySelectorAll('.node').forEach((n, i) => {
    ftl.to(n.querySelector('span'), { scale: 1, duration: .4, ease: 'back.out(3)' }, i * 1.1)
       .from(n.querySelectorAll('h4,p'), { y: 20, opacity: 0, duration: .5 }, i * 1.1);
  });
}

/* ---------- preços ---------- */
gsap.utils.toArray('.price').forEach((p, i) => gsap.from(p, { y: 100, opacity: 0, rotateY: (i - 1) * -20, transformPerspective: 1000, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.prices', start: 'top 85%' }, delay: i * .1 }));
document.querySelectorAll('#billing button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#billing button').forEach(x => x.classList.toggle('is-on', x === b));
  document.querySelectorAll('.price__v b').forEach(v => {
    const o = { n: +v.textContent }, to = +v.dataset[b.dataset.b];
    gsap.to(o, { n: to, duration: .8, ease: 'power3.out', onUpdate: () => v.textContent = Math.round(o.n) });
    gsap.fromTo(v, { rotateX: 90 }, { rotateX: 0, duration: .6, ease: 'back.out(2)' });
  });
}));

/* ---------- cadastro ---------- */
gsap.from('.signup__bg img', { scale: 1.3, ease: 'none', scrollTrigger: { trigger: '.signup', start: 'top bottom', end: 'bottom top', scrub: true } });
const mask = v => {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  return v;
};
const tel = document.getElementById('s-tel');
tel.addEventListener('input', () => tel.value = mask(tel.value));
const form = document.getElementById('signupForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const f = form.elements, err = document.getElementById('signupError');
  form.querySelectorAll('input').forEach(i => i.classList.remove('bad'));
  const fail = (i, m) => { i.classList.add('bad'); i.focus(); err.textContent = m; gsap.fromTo(form, { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)' }); };
  if (f.nome.value.trim().length < 3) return fail(f.nome, 'Informe seu nome completo.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) return fail(f.email, 'E-mail inválido.');
  if (f.telefone.value.replace(/\D/g, '').length < 10) return fail(f.telefone, 'Telefone inválido. Inclua o DDD.');
  if (f.senha.value.length < 6) return fail(f.senha, 'A senha deve ter no mínimo 6 caracteres.');
  if (f.senha.value !== f.senha2.value) return fail(f.senha2, 'As senhas não são iguais.');
  err.textContent = '';
  const btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Enviando…';
  setTimeout(() => { form.reset(); form.querySelector('.form__body').hidden = true; form.querySelector('.form__ok').hidden = false; }, 1200);
});

/* ---------- popup login ---------- */
const modal = document.getElementById('loginModal');
const open = () => { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); setTimeout(() => document.getElementById('l-user').focus(), 300); };
const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); };
document.querySelectorAll('[data-open-login]').forEach(b => b.addEventListener('click', open));
modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
addEventListener('keydown', e => e.key === 'Escape' && close());
const login = document.getElementById('loginForm');
login.addEventListener('submit', e => {
  e.preventDefault();
  const u = document.getElementById('l-user'), p = document.getElementById('l-pass'), err = document.getElementById('loginError');
  if (!u.value.trim() || !p.value) { err.textContent = 'Informe login e senha.'; return; }
  const btn = login.querySelector('button'); btn.disabled = true; btn.textContent = 'Autenticando…'; err.textContent = '';
  setTimeout(() => {
    btn.disabled = false; btn.textContent = 'Entrar'; p.value = '';
    err.textContent = 'Login ou senha incorretos.';
    gsap.fromTo('.modal__card', { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)' });
  }, 1300);
});

addEventListener('load', () => ScrollTrigger.refresh());
