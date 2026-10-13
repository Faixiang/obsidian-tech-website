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
     跑马灯速度反算（报告 §5 / 计划书 §9.5）
     ----------------------------------------------------------------------
     轨道已由 CSS 固定为 flex:0 0 auto + width:max-content，宽度不再随
     视口伸缩，故「duration = 一份内容宽 ÷ 目标速度」与视口无关。
     内容复制两份（副本 aria-hidden="true"），逐帧位移量恒为一份内容宽
     （--mq-shift 由 JS 反算为负百分比，向左位移），循环回溯无跳变；
     「轨道宽 − 一份内容宽」小于容器可见宽时自动补足副本（保持偶数份）。
     目标速度唯一来源：CSS 变量 --mq-speed-*（12 / 8 / 40 px/s）。
     ====================================================================== */
  var OBSIDIAN_MARQUEE = (function marquee() {
    var ctx = document.documentElement;
    var items = [];
    var rafId = 0;
    var booted = false;

    /* 三条轨道：选择器 + duration 变量名 + 目标速度变量名 */
    var SPECS = [
      {
        sels: ['[data-nb-ticker]', '.nb-ticker-track'],
        varName: '--ticker-nb', speedVar: '--mq-speed-nb', speedFallback: 8
      },
      {
        sels: ['[data-hero-ticker]', '.hero-ticker-track'],
        varName: '--ticker-hero', speedVar: '--mq-speed-hero', speedFallback: 40
      },
      {
        sels: ['.ann-bar__track'],
        varName: '--ticker-ann', speedVar: '--mq-speed-ann', speedFallback: 12
      }
    ];

    function pick(spec) {
      for (var i = 0; i < spec.sels.length; i++) {
        var el = document.querySelector(spec.sels[i]);
        if (el && el !== document.body && el !== document.documentElement) return el;
      }
      return null;
    }

    function specOf(el) {
      for (var i = 0; i < SPECS.length; i++) {
        for (var j = 0; j < SPECS[i].sels.length; j++) {
          if (el.matches && el.matches(SPECS[i].sels[j])) return SPECS[i];
        }
      }
      return null;
    }

    function speedOf(spec) {
      var v = parseFloat(
        window.getComputedStyle(ctx).getPropertyValue(spec.speedVar)
      );
      return v > 0 ? v : spec.speedFallback;
    }

    /* 建结构：原内容包进 .mq-frame → 再复制一份 aria-hidden 的副本 */
    function build(el, spec) {
      if (!el || el.dataset.mqReady === '1') return null;

      var kids = Array.prototype.slice.call(el.children);
      if (!kids.length) return null;

      var cs = window.getComputedStyle(el);
      var gapPx = parseFloat(cs.columnGap) || 0;

      /* ① 轨道不被拉伸/压缩，只按内容自然宽排版；间距改为逐项 margin
            （含每份末尾那一项），使复制后的接缝间距与其他间距一致；
            首缩进保留在轨道自身 padding-left，不进入「一份内容宽」丈量，
            避免接缝处出现双倍间距 */
      el.style.flex = '0 0 auto';
      el.style.width = 'max-content';
      el.style.gap = '0px';

      kids.forEach(function (k) {
        if (gapPx) k.style.marginRight = gapPx + 'px';
      });

      var frame = document.createElement('div');
      frame.className = 'mq-frame';
      frame.style.cssText =
        'display:flex;flex:0 0 auto;width:max-content;align-items:center;';
      kids.forEach(function (k) { frame.appendChild(k); });

      var clone = frame.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');

      var inner = document.createElement('div');
      inner.className = 'mq-inner';
      inner.style.cssText =
        'display:flex;flex:0 0 auto;width:max-content;align-items:center;';
      inner.appendChild(frame);
      inner.appendChild(clone);
      el.appendChild(inner);

      el.dataset.mqReady = '1';

      var item = {
        el: el, frame: frame, inner: inner,
        varName: spec.varName, speed: speedOf(spec)
      };
      el.__mqItem = item;
      return item;
    }

    /* 丈量：临时把容器压到 1px，分别读「一份内容宽」与轨道实际宽 */
    function measure(item) {
      var el = item.el;
      var host = el.parentNode;
      var prevWidth = host.style.width;
      var prevAnim = el.style.animation;

      el.style.animation = 'none';
      host.style.width = '1px';

      var one = item.frame.getBoundingClientRect().width;
      var track = item.inner.getBoundingClientRect().width;

      host.style.width = prevWidth;
      el.style.animation = prevAnim;

      return { one: one, track: track };
    }

    /* ③ 位移量恒为一份内容宽，故无缝条件是
          「轨道宽 − 一份内容宽 ≥ 容器可见宽」；不满足时补足副本
          （每次补 2 份，保持偶数份），避免循环末段右侧露白 */
    function padUp(item, m) {
      var visible = item.el.parentNode.clientWidth || 0;
      var padded = false;
      var guard = 0;

      while (m.one > 0 && (m.track - m.one) < visible && guard < 12) {
        for (var k = 0; k < 2; k++) {
          var extra = item.frame.cloneNode(true);
          extra.setAttribute('aria-hidden', 'true');
          item.inner.appendChild(extra);
          m.track += m.one;
        }
        padded = true;
        guard++;
      }
      return padded;
    }

    /* ④ 重置动画：flash 一次使新的 duration 立即生效，位移基准归零 */
    function restart(item) {
      var el = item.el;
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    }

    function apply(item, m, padded) {
      if (!(m.one > 0)) return;

      var duration = m.one / item.speed;
      var changed = padded || !item.lastDuration ||
        Math.abs(item.lastDuration - duration) > 0.01;

      /* duration = 一份内容宽 ÷ 目标速度（秒），实测速度严格等于目标值；
         --mq-shift = 负的「一份内容宽」像素值（向左位移）—— 逐帧位移恒等
         于一份内容宽，与轨道 padding-left / 副本份数 / 视口宽度均无关，
         故循环闭合处零跳变。

         v1.3 修正：旧实现写 `-(one / track * 100)%`，而 translateX(%) 的
         基准是元素自身 border-box（轨道 padding-left:24px 被计入被除数），
         实际循环位移 = 一份宽 + 约 6px，导致 nb（78s）/ hero（29.35s）
         每周期在闭合处瞬跳约 6px、速度同源偏高 0.5%~0.95%。 */
      ctx.style.setProperty(item.varName, duration.toFixed(2) + 's');
      item.el.style.setProperty('--mq-shift', (-m.one).toFixed(2) + 'px');
      item.lastDuration = duration;

      if (changed) restart(item);
    }

    function refreshItem(item) {
      var m = measure(item);
      var padded = padUp(item, m);
      apply(item, m, padded);
    }

    function runAll() {
      if (!items.length || document.hidden) return;
      items.forEach(refreshItem);
    }

    function schedule() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = 0;
        runAll();
      });
    }

    function init() {
      if (booted || reduceMotion) return;
      booted = true;

      SPECS.forEach(function (spec) {
        var el = pick(spec);
        if (!el) return;
        var item = build(el, spec);
        if (item) items.push(item);
      });

      runAll();
    }

    /* 内容被动态改写后：重建结构 → 重算 duration → 重置动画 */
    function refresh(el, html) {
      if (!el) return;

      if (el.__mqItem) {
        var idx = items.indexOf(el.__mqItem);
        if (idx >= 0) items.splice(idx, 1);
        el.__mqItem = null;
      }
      delete el.dataset.mqReady;

      if (typeof html === 'string') el.innerHTML = html;

      /* 内联样式还原，避免与重新包装后的取值叠加 */
      el.style.flex = '0 0 auto';
      el.style.width = 'max-content';
      el.style.gap = '';
      el.style.paddingLeft = '';

      var spec = specOf(el);
      var item = spec ? build(el, spec) : null;
      if (item) {
        items.push(item);
        refreshItem(item);
      }
    }

    function boot() {
      init();
      schedule();
      window.addEventListener('resize', schedule);
      window.addEventListener('orientationchange', schedule);
    }

    function onLoad(fn) {
      if (document.readyState === 'complete') fn();
      else window.addEventListener('load', fn);
    }

    /* 时机：load 之后 + 字体就绪之后各算一次，读数最准 */
    onLoad(function () {
      boot();
      if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        document.fonts.ready.then(function () {
          if (booted) schedule();
          else boot();
        });
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) schedule();
    });

    return {
      refresh: refresh,
      recalc: schedule
    };
  })();

  window.OBSIDIAN_MARQUEE = OBSIDIAN_MARQUEE;

  /* ======================================================================
     全息展台扫描线行程（v1.3）
     ----------------------------------------------------------------------
     扫描线绝对定位于 .holo-showcase（该元素无 overflow:hidden，位移需
     限制在面板高度内），故其扫描行程必须等于面板实际高度。这里把高度
     写入 --holo-scan-travel，使 holo-scan 真正从上扫到下，而不是只摆动
     8px。周期与 holo-float 统一为 8s、同相位起止，消除 3s/8s 异周期
     持续错位带来的"抖动/呼吸不均"观感。
     ====================================================================== */
  (function holoScan() {
    var showcase = document.querySelector('.holo-showcase');
    if (!showcase) return;

    function sync() {
      var travel = showcase.getBoundingClientRect().height;
      if (travel > 0) {
        showcase.style.setProperty('--holo-scan-travel', travel.toFixed(2) + 'px');
      }
    }

    function schedule() {
      window.requestAnimationFrame(sync);
    }

    if (document.readyState === 'complete') sync();
    else window.addEventListener('load', sync);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
  })();

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
        if (ticker) {
          /* 内容改写后重算 duration 并重置动画（计划书 §9.5.2） */
          if (OBSIDIAN_MARQUEE && OBSIDIAN_MARQUEE.refresh) {
            OBSIDIAN_MARQUEE.refresh(ticker, payload.ticker);
          } else {
            ticker.innerHTML = payload.ticker;
          }
        }

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