/* ==========================================================================
   曜石智能科技 · 全站通用脚本
   职责：导航、滚动进度条、当前项高亮、未完成页面拦截、
        进场动画、页脚年份、表单 Tab 切换
   依据：曜石智能科技_品牌规范与项目方案_V1.1.md §7.4 / §5.3
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     移动端导航（VI §7.4：fixed + 展开时锁定滚动）
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
     顶部滚动进度条（VI §7.4：2px 电光青）+ 页头阴影
     ====================================================================== */
  var progress = document.querySelector('.scroll-progress');
  var header = document.querySelector('.site-header');
  var ticking = false;

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;

    if (progress) progress.style.width = pct.toFixed(2) + '%';
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);

    ticking = false;
  }

  window.addEventListener(
    'scroll',
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );

  onScroll();

  /* ======================================================================
     当前页导航高亮（VI §9.1）
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
     轻提示 + 未完成页面拦截
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
    showToast(link.getAttribute('data-pending') || '该页面正在建设中');
  });

  /* ======================================================================
     Tab 切换（联系我们：咨询 / 评论 / 投诉）
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
     进场动画
     ====================================================================== */
  var revealables = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealables.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ======================================================================
     页脚年份
     ====================================================================== */
  var y = String(new Date().getFullYear());

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = y;
  });
})();