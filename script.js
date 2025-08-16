(() => {
  const $ = s => document.querySelector(s);

  const yesBtn     = $('#yesBtn');
  const noBtn      = $('#noBtn');
  const starsLayer = $('#stars');
  const overlay    = $('#overlay');
  const card       = $('#card');
  const msgEl      = $('#msg');
  const shareBtn   = $('#shareBtn');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let noClicks = 0;
  let yesScale = 1;
  let finished = false;

  /* ---------- Floating background hearts (lightweight) ---------- */
  const floatHearts = document.querySelector('.float-hearts');
  for (let i=0;i<24;i++){
    const el = document.createElement('div');
    el.className='h';
    el.textContent='❤';
    el.style.left = Math.random()*100 + 'vw';
    el.style.animationDuration = (6 + Math.random()*6) + 's';
    el.style.animationDelay = (Math.random()*6) + 's';
    el.style.opacity = .25 + Math.random()*.4;
    floatHearts.appendChild(el);
  }

  /* ---------- NO button behavior ---------- */
  const sweetLines = [
    'ถ้าไม่งั้น',
    'ได้หรอ',
    'ยังไหวชิวๆ',
    'ให้อีกสีกที ',
    'ไม่ได้นะฮาฟฟู่ว'
  ];
  let sweetIndex = 0;

  noBtn.addEventListener('click', () => {
    if (finished) return;

    noClicks++;
    yesScale = Math.min(1 + noClicks * 0.18, 2.3);
    yesBtn.style.transform = `scale(${yesScale})`;
    yesBtn.style.boxShadow = '0 10px 26px rgba(255,127,178,.35)';

    // ข้อความสุ่ม
    if (msgEl){
      msgEl.textContent = sweetLines[sweetIndex++ % sweetLines.length];
      msgEl.animate(
        [{transform:'scale(0.96)', opacity:.6},{transform:'scale(1)', opacity:1}],
        {duration:180, easing:'ease-out'}
      );
    }

    // สั่นเล็กน้อย
    try{ navigator.vibrate?.(40); }catch{}
    beep(520, 0.08);

    // เอฟเฟกต์สั่นปุ่ม "ไม่"
    noBtn.animate(
      [{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],
      {duration:200, easing:'ease-in-out'}
    );

    if (noClicks >= 5){
      noBtn.classList.add('fade-out');
      noBtn.style.pointerEvents='none';
      noBtn.setAttribute('aria-hidden','true');
    }
  });

  /* ปุ่ม “ไม่” หลบเมาส์/นิ้ว */
  let tx = 0, ty = 0;
  const radius = 120; // ระยะที่เริ่มหนี
  function maybeDodge(x, y){
    if (noBtn.style.pointerEvents === 'none' || finished) return;
    const r = noBtn.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top  + r.height/2;
    const dx = x - cx, dy = y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < radius){
      const angle = Math.atan2(dy, dx) + (Math.PI + (Math.random()-.5));
      const step  = 120 + Math.random()*120;
      tx += Math.cos(angle) * step;
      ty += Math.sin(angle) * step;

      // กันหลุดจอ
      const vw = window.innerWidth, vh = window.innerHeight;
      const pad = 24;
      const newRect = { left: r.left + tx, top: r.top + ty, right: r.right + tx, bottom: r.bottom + ty };
      if(newRect.left < pad) tx += (pad - newRect.left);
      if(newRect.right > vw - pad) tx -= (newRect.right - (vw - pad));
      if(newRect.top < pad) ty += (pad - newRect.top);
      if(newRect.bottom > vh - pad) ty -= (newRect.bottom - (vh - pad));
      noBtn.style.transform = `translate(${tx}px, ${ty}px)`;
    }
  }
  // หนีเมื่อ pointer เคลื่อน
  window.addEventListener('pointermove', e => maybeDodge(e.clientX, e.clientY), {passive:true});
  // หนีเมื่อแตะใกล้ ๆ บนมือถือ
  window.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if (t) maybeDodge(t.clientX, t.clientY);
  }, {passive:true});
  // รีเซ็ตเมื่อย่อ/หมุนจอ
  window.addEventListener('resize', () => { tx=0; ty=0; noBtn.style.transform=''; });

  /* ---------- YES button behavior ---------- */
  yesBtn.addEventListener('click', () => {
    if (finished) return;
    finished = true;

    // เสียงไล่โน้ต + สั่น
    [660, 880, 1320].forEach((f, k) => setTimeout(()=> beep(f, 0.09), k*110));
    try{ navigator.vibrate?.([30,50,30]); }catch{}

    if (!reduceMotion) startStarRain(8000); // ~8s

    // ซ่อนการ์ดคำถาม
    card.animate(
      [{opacity:1, filter:'blur(0px)'},{opacity:0, filter:'blur(2px)'}],
      {duration:600, fill:'forwards', easing:'ease'}
    );

    // เปิดโอเวอร์เลย์รูปคู่
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');

    // ล็อกสกอลล์และปิดการโต้ตอบอื่นๆ
    document.body.style.overflow = 'hidden';
    yesBtn.disabled = true; noBtn.disabled = true;
  });

  /* ---------- Star rain ---------- */
  function startStarRain(duration=6000){
    const start = performance.now();
    const makestar = () => {
      const now = performance.now();
      if (now - start < duration){
        spawnStar();
        const next = 40 + Math.random()*60; // ความถี่ดาว
        setTimeout(makestar, next);
      }
    };
    makestar();
  }
  function spawnStar(){
    const s = document.createElement('span');
    s.className='star';
    s.textContent = Math.random()<0.08 ? '✨' : '★';
    s.style.left = (Math.random()*100) + 'vw';
    const size = 14 + Math.random()*22;
    s.style.fontSize = size + 'px';
    const dur = 3 + Math.random()*3.5;
    s.style.animationDuration = dur + 's';
    s.style.opacity = .9;
    starsLayer.appendChild(s);
    setTimeout(()=> s.remove(), (dur+0.1)*1000);
  }

  /* ---------- Share button ---------- */
  if (shareBtn){
    shareBtn.addEventListener('click', async () => {
      const data = { title:'คืนดีกันไหม 💖', text:'หัวใจเราเต้นจังหวะเดียวกัน 💘', url: location.href };
      if (navigator.share){
        try{ await navigator.share(data); }catch{}
      }else{
        try{
          await navigator.clipboard?.writeText(location.href);
          shareBtn.textContent = 'คัดลอกลิงก์แล้ว ✓';
          setTimeout(()=> shareBtn.textContent = 'แชร์ 💌', 1500);
        }catch{}
      }
    });
  }

  /* ---------- Tiny WebAudio helper (single AudioContext) ---------- */
  let audioCtx;
  function getCtx(){
    if (!audioCtx){
      try{ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch{ audioCtx = null; }
    }
    return audioCtx;
  }
  function beep(freq=600, sec=0.1){
    const ctx = getCtx(); if(!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    o.connect(g); g.connect(ctx.destination);
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + sec);
    o.start(); o.stop(t0 + sec + 0.02);
  }
})();
