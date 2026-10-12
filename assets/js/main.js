/* ==========================================================================
   曜石智能科技 · 全站通用脚本
   --------------------------------------------------------------------------
   质感参数依据：康陶集团官网_视觉与交互复刻设计参数报告.md §5
     - 粒子：N=70，速度 (Math.random()-0.5)*0.25，5 色池，rAF驱动
     - 过渡：统一 ease，卡片 0.4s
     - 锚点：拦截 a[href^="#"] → scrollIntoView({behavior:'smooth'})
     - 时钟：日期固定 + 实时时分，每分钟刷新
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ======================================================================
     粒子背景（报告 §4/§5）
     ====================================================================== */
  (function particles() {
    var canvas = document.getElementById('particles');
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* 报告 §5：颜色池 5 色 */
    var COLORS = [
      [0, 212, 184],   /* 青 */
      [0, 160, 200],   /* 深青 */
      [123, 47, 255],  /* 紫 */
      [200, 168, 75],  /* 金 */
      [255, 45, 85]    /* 红 */
    ];

    var N = 70;
    var pts = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init() {
      resize();
      pts = [];
      for (var i = 0; i < N; i++) {
        pts.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          /* 报告 §5：速度 ±0.125 */
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.6 + 0.4,
          c: COLORS[(Math.random() * COLORS.length) | 0]
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];

        p.x += p.vx;
        p.y += p.vy;

        /* 边界回弹 */
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',0.7)';
        ctx.fill();

        /* 近距离连线 */
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j];
          var dx = p.x - q.x;
          var dy = p.y - q.y;
          var d = Math.sqrt(dx * dx + dy * dy);

          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(0,212,184,' + (0.12 * (1 - d / 130)).toFixed(3) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      window.requestAnimationFrame(frame);
    }

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(init, 200);
    });

    init();
    frame();
  })();

  /* ======================================================================
     移动端导航（双固定条 → 展开占位 nav-total）
     ====================================================================== */
  var toggle = document.querySelector('.nav__toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-locked', open);
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-locked');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-locked');
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-locked');
      }
    });
  }

  /* ======================================================================
     当前页导航高亮
     ====================================================================== */
  var here = location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav__link').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === here || (here === '' && href === 'index.html')) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ======================================================================
     锚点平滑滚动（报告 §5：拦截默认行为 → scrollIntoView）
     ====================================================================== */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var id = link.getAttribute('href');
    if (!id || id === '#') return;

    var target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

    /* 同步 hash 但不跳动 */
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* ======================================================================
     新闻演播室：频道切换 + 实时时钟
     ====================================================================== */
  (function newsDesk() {
    var wrap = document.querySelector('[data-nb-channels]');
    if (!wrap) return;

    var btns = wrap.querySelectorAll('[data-nb-ch]');
    var leadTitle = document.querySelector('[data-nb-lead-title]');
    var leadDesc = document.querySelector('[data-nb-lead-desc]');
    var ticker = document.querySelector('[data-nb-ticker]');
    var channel = document.querySelector('[data-nb-channel]');

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ch = btn.getAttribute('data-nb-ch');

        btns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });

        var payload = window.OBSIDIAN_NEWS && window.OBSIDIAN_NEWS[ch];
        if (!payload) return;

        if (channel) channel.textContent = payload.label;
        if (leadTitle) leadTitle.textContent = payload.lead.title;
        if (leadDesc) leadDesc.textContent = payload.lead.desc;
        if (ticker) ticker.innerHTML = payload.ticker;

        /* 報告 §6.4：每頻道獨立列表 */
        var list = document.getElementById('nbList');
        if (list) {
          list.innerHTML = payload.list.map(function (row) {
            return '<li class="nb-item"><span class="nb-item-date">' + row[0] +
              '</span><span class="nb-item-title">' + row[1] + '</span></li>';
          }).join('');
        }
      });
    });

    /* 时钟：日期固定 + 实时时分，每分钟刷新（报告 §2/§5） */
    var clock = document.querySelector('[data-nb-ts]');
    if (!clock) return;

    var WORLD_DATE = '2077.05.28';

    function tick() {
      var d = new Date();
      function pad(n) { return n < 10 ? '0' + n : String(n); }
      clock.textContent =
        WORLD_DATE + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    tick();
    setInterval(tick, 60000);
  })();

  /* ======================================================================
     通用 Tab 切换（联系我们）
     ====================================================================== */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var btns = group.querySelectorAll('[data-tab]');

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab');

        btns.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.classList.toggle('is-active--danger', active && b.hasAttribute('data-danger'));
          b.setAttribute('aria-selected', String(active));
        });

        document.querySelectorAll('[data-panel]').forEach(function (panel) {
          panel.classList.toggle('is-active', panel.getAttribute('data-panel') === target);
        });
      });
    });
  });

  /* ======================================================================
     进场动画（报告 §5：fadeUp，逐个延迟）
     ====================================================================== */
  (function reveal() {
    var items = document.querySelectorAll('[data-reveal]');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) {
        el.style.animation = 'none';
        el.style.opacity = '1';
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal'), 10) || 0;
        el.style.animationDelay = delay + 'ms';
        el.classList.add('is-visible');
        io.unobserve(el);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ======================================================================
     Toast
     ====================================================================== */
  var toast = document.querySelector('.toast');

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-in');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove('is-in');
    }, 2600);
  }

  window.OBSIDIAN_TOAST = showToast;

  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-pending]');
    if (!link) return;
    e.preventDefault();
    showToast(link.getAttribute('data-pending') || '該頁面正在建設中');
  });

  /* ======================================================================
     页脚年份
     ====================================================================== */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();