/* Dreams v2: local hover highlights and section controls. No tracking or submissions. */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  function initialize() {
    var roots = document.querySelectorAll('#dreams-agent-embed, #dreams-client-embed');
    if (!roots.length) return false;
    roots.forEach(function (root) {
      if (root.dataset.dreamsEnhancementsReady === 'true') return;
      root.dataset.dreamsEnhancementsReady = 'true';
      var agent = root.id === 'dreams-agent-embed';
      var selector = agent
        ? '.an-step, .an-context-row article, .an-example, .an-bonus-example, .an-month-example, .an-calc-controls, .an-calc-result'
        : '.cl-record-grid article, .cl-case-grid article, .cl-fit-grid article, .cl-process-grid article, .cl-calc-controls, .cl-calc-result';
      var finePointer = typeof window.matchMedia === 'function'
        ? window.matchMedia('(hover: hover) and (pointer: fine)') : {matches:false};
      var reducedMotion = typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
      root.querySelectorAll(selector).forEach(function (card) {
        card.classList.add('dreams-glow-card');
        var frame = 0;
        var x = 50, y = 50;
        card.addEventListener('pointermove', function (event) {
          if (!finePointer.matches || reducedMotion.matches) return;
          var rect = card.getBoundingClientRect();
          x = event.clientX - rect.left;
          y = event.clientY - rect.top;
          if (frame) return;
          frame = window.requestAnimationFrame(function () {
            frame = 0;
            card.style.setProperty('--dreams-glow-x', x+'px');
            card.style.setProperty('--dreams-glow-y', y+'px');
          });
        }, {passive:true});
        card.addEventListener('pointerleave', function () {
          if (frame) window.cancelAnimationFrame(frame);
          frame = 0;
          card.style.removeProperty('--dreams-glow-x');
          card.style.removeProperty('--dreams-glow-y');
        }, {passive:true});
      });
      var navigator = root.querySelector('.dreams-section-nav');
      var sections = Array.from(root.querySelectorAll('main > section'));
      if (!navigator || !sections.length) return;
      var previous = navigator.querySelector('[data-dreams-previous]');
      var next = navigator.querySelector('[data-dreams-next]');
      var toggle = navigator.querySelector('[data-dreams-nav-toggle]');
      var counter = navigator.querySelector('[data-dreams-current]');
      var dots = navigator.querySelector('[data-dreams-nav-dots]');
      var buttons = Array.from(dots.querySelectorAll('[data-dreams-section-index]'));
      var mobile = typeof window.matchMedia === 'function'
        ? window.matchMedia('(max-width: 850px)') : {matches:false};
      var current = -1;
      var scrollFrame = 0;
      function setExpanded(expanded) {
        dots.hidden = !expanded;
        toggle.setAttribute('aria-expanded', String(expanded));
        navigator.classList.toggle('is-collapsed', !expanded);
      }
      function setCurrent(index) {
        index = Math.max(0, Math.min(index, sections.length-1));
        if (index === current) return;
        current = index;
        counter.textContent = String(index+1).padStart(2,'0');
        toggle.setAttribute('aria-label', 'Section '+(index+1)+' of '+sections.length+'. Toggle section choices');
        buttons.forEach(function (button, i) {
          if (i === index) button.setAttribute('aria-current', 'step');
          else button.removeAttribute('aria-current');
        });
        previous.disabled = index === 0;
        next.disabled = index === sections.length-1;
      }
      function moveTo(index) {
        index = Math.max(0, Math.min(index, sections.length-1));
        setCurrent(index);
        sections[index].scrollIntoView({behavior:reducedMotion.matches ? 'auto' : 'smooth', block:'start'});
        if (mobile.matches) setExpanded(false);
      }
      previous.addEventListener('click', function () { moveTo(current-1); });
      next.addEventListener('click', function () { moveTo(current+1); });
      buttons.forEach(function (button) {
        button.addEventListener('click', function () { moveTo(Number(button.dataset.dreamsSectionIndex)); });
      });
      toggle.addEventListener('click', function () { setExpanded(toggle.getAttribute('aria-expanded') !== 'true'); });
      navigator.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { setExpanded(false); toggle.focus(); }
      });
      function syncPosition() {
        scrollFrame = 0;
        var threshold = Math.min(220, (window.innerHeight || 800)*0.28);
        var index = 0;
        sections.forEach(function (section, i) {
          if (section.getBoundingClientRect().top <= threshold) index = i;
        });
        setCurrent(index);
      }
      function scheduleSync() {
        if (!scrollFrame) scrollFrame = window.requestAnimationFrame(syncPosition);
      }
      window.addEventListener('scroll', scheduleSync, {passive:true});
      window.addEventListener('resize', scheduleSync, {passive:true});
      function changeViewport() { setExpanded(!mobile.matches); scheduleSync(); }
      if (mobile.addEventListener) mobile.addEventListener('change', changeViewport);
      else if (mobile.addListener) mobile.addListener(changeViewport);
      setExpanded(!mobile.matches);
      setCurrent(0);
      syncPosition();
      navigator.hidden = false;
    });
    return true;
  }
  function ready() {
    if (initialize()) return;
    var observer = new MutationObserver(function () { if (initialize()) observer.disconnect(); });
    observer.observe(document.body, {childList:true, subtree:true});
    window.setTimeout(function () { observer.disconnect(); },30000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true});
  else ready();
}());
