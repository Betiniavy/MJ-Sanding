/* ========= Tiny, accessible slider =========
  Usage: <div class="slider" data-autoplay="5000" data-per-view="3" data-loop="true">
           <div class="slider-track">
             <div class="slide"> ... </div>
             ...
           </div>
           <button class="slider-prev" aria-label="Previous slide">‹</button>
           <button class="slider-next" aria-label="Next slide">›</button>
           <div class="slider-dots" aria-label="Slide navigation"></div>
         </div>
*/
(function(){
  const sliders = document.querySelectorAll('.slider');
  sliders.forEach(initSlider);

  function initSlider(root){
    const track = root.querySelector('.slider-track');
    const slides = Array.from(root.querySelectorAll('.slide'));
    const prevBtn = root.querySelector('.slider-prev');
    const nextBtn = root.querySelector('.slider-next');
    const dotsWrap = root.querySelector('.slider-dots');

    if(!track || slides.length === 0) return;

    const perView = Math.max(1, parseInt(root.dataset.perView || '1', 10));
    const autoplayMs = parseInt(root.dataset.autoplay || '0', 10) || 0;
    const loop = String(root.dataset.loop || 'true') === 'true';

    let index = 0;
    let timer = null;
    let isPointerDown = false;
    let startX = 0;
    let scrollStart = 0;

    // Build dots
    const pages = Math.max(1, Math.ceil(slides.length / perView));
    const dots = [];
    if (dotsWrap){
      dotsWrap.innerHTML = '';
      for(let i=0;i<pages;i++){
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Go to slide ${i+1}`);
        b.addEventListener('click', ()=>goTo(i, true));
        dotsWrap.appendChild(b);
        dots.push(b);
      }
    }

    function clamp(i){
      if(loop){
        if(i < 0) return pages - 1;
        if(i >= pages) return 0;
        return i;
      }
      return Math.max(0, Math.min(pages - 1, i));
    }

    function goTo(i, user){
      index = clamp(i);
      const percent = -(100 / perView) * index;
      track.style.transform = `translateX(${percent}%)`;
      updateDots();
      if (user) restart();
    }

    function updateDots(){
      dots.forEach((d, i)=>d.classList.toggle('is-active', i===index));
      dots.forEach((d, i)=>d.setAttribute('aria-pressed', i===index ? 'true' : 'false'));
    }

    function next(){ goTo(index + 1); }
    function prev(){ goTo(index - 1); }

    // Autoplay
    function start(){
      if(!autoplayMs) return;
      stop();
      timer = setInterval(next, autoplayMs);
    }
    function stop(){ if(timer){ clearInterval(timer); timer=null; } }
    function restart(){ stop(); start(); }

    // Pointer drag (basic)
    function onPointerDown(e){
      isPointerDown = true;
      startX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      scrollStart = index;
      root.classList.add('is-dragging');
      stop();
    }
    function onPointerMove(e){
      if(!isPointerDown) return;
      const x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const dx = x - startX;
      const width = root.clientWidth || 1;
      const deltaPages = dx / width;
      const target = scrollStart - deltaPages;
      const percent = -(100 / perView) * target;
      track.style.transition = 'none';
      track.style.transform = `translateX(${percent}%)`;
    }
    function onPointerUp(e){
      if(!isPointerDown) return;
      isPointerDown = false;
      root.classList.remove('is-dragging');
      track.style.transition = '';
      const x = e.changedTouches ? e.changedTouches[0].clientX : (e.clientX || 0);
      const dx = x - startX;
      const threshold = root.clientWidth * 0.12;
      if (dx > threshold) prev();
      else if (dx < -threshold) next();
      else goTo(index);
      start();
    }

    // Buttons
    prevBtn?.addEventListener('click', ()=>goTo(index - 1, true));
    nextBtn?.addEventListener('click', ()=>goTo(index + 1, true));

    // Keyboard
    root.addEventListener('keydown', (e)=>{
      if(e.key === 'ArrowLeft') { e.preventDefault(); prev(); restart(); }
      if(e.key === 'ArrowRight'){ e.preventDefault(); next(); restart(); }
    });

    // Hover/focus pause
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    // Pointer events
    root.addEventListener('pointerdown', onPointerDown, {passive:true});
    window.addEventListener('pointermove', onPointerMove, {passive:true});
    window.addEventListener('pointerup', onPointerUp, {passive:true});
    root.addEventListener('touchstart', onPointerDown, {passive:true});
    root.addEventListener('touchmove', onPointerMove, {passive:true});
    root.addEventListener('touchend', onPointerUp, {passive:true});

    // Init
    goTo(0);
    start();
  }
})();

/* ========= Shared header bits (matches your other pages) ========= */
(function(){
  // Year
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();

  // Mobile menu
  const toggle = document.querySelector('.ps-toggle');
  const wrap = document.getElementById('ps-navwrap');
  if (toggle && wrap){
    const setOpen = (open) => {
      wrap.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open && matchMedia('(max-width:900px)').matches ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => setOpen(!wrap.classList.contains('open')));
    wrap.addEventListener('click', (e)=>{ if(e.target.tagName === 'A') setOpen(false); });
    window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') setOpen(false); });
  }

  // Solid header after small scroll (only when a hero exists)
  const header = document.querySelector('.ps-header');
  const hero = document.querySelector('.hero');
  function onScroll(){
    const threshold = (hero?.offsetHeight || 0) * 0.1;
    if (window.scrollY > threshold) header?.classList.add('is-solid');
    else header?.classList.remove('is-solid');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});
})();
