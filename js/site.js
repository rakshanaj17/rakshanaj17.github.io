(function () {
  document.documentElement.classList.add("js");
  // Email is assembled at runtime so scrapers don't find it in the page source
  var addr = ["rakshana.jpk", "gmail.com"].join("@");
  document.querySelectorAll("[data-mail]").forEach(function (a) { a.href = "mailto:" + addr; });
  var pal = new URLSearchParams(location.search).get("palette");
  if (pal) document.documentElement.setAttribute("data-palette", pal);

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", false);
    }
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Scroll reveal + active nav link
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  if ("IntersectionObserver" in window) {
    var links = {};
    document.querySelectorAll(".nav a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].removeAttribute("aria-current"); });
          links[en.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(links).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  // Background stars: drifting dots joined by faint lines, tinted with the accent colour
  var canvas = document.getElementById("stars");
  var ctx = canvas && canvas.getContext("2d");
  if (ctx) {
    var dots = [], w = 0, h = 0, raf = null, color = "";
    var LINK = 140;
    var boost = 1;
    var readColor = function () {
      color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#d6336c";
    };
    var rgba = function (a) {
      var c = color.replace("#", "");
      if (c.length === 3) c = c.replace(/./g, "$&$&");
      return "rgba(" + parseInt(c.substr(0, 2), 16) + "," + parseInt(c.substr(2, 2), 16) + "," + parseInt(c.substr(4, 2), 16) + "," + a + ")";
    };
    var resize = function () {
      var dpr = window.devicePixelRatio || 1;
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(40, Math.max(14, (w * h) / 30000)));
      dots = [];
      for (var k = 0; k < count; k++) {
        dots.push({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 });
      }
      draw(false);
    };
    var mouse = { x: -999, y: -999, on: false };
    var draw = function (step) {
      ctx.clearRect(0, 0, w, h);
      if (step) dots = dots.filter(function (d) { return d.life === undefined || d.life > 0; });
      var fade = function (d) { return d.life === undefined ? 1 : Math.min(1, d.life / 60); };
      for (var a = 0; a < dots.length; a++) {
        var p = dots[a];
        if (step) {
          if (p.life !== undefined) { p.life--; p.vx *= 0.985; p.vy *= 0.985; }
          p.x += p.vx * boost; p.y += p.vy * boost;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          if (mouse.on) {
            var mx = mouse.x - p.x, my = mouse.y - p.y;
            if (mx * mx + my * my < 22500) { p.x += mx * 0.012; p.y += my * 0.012; }
          }
        }
        ctx.fillStyle = rgba(0.75 * fade(p));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        for (var b = a + 1; b < dots.length; b++) {
          var q = dots[b], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = rgba(0.3 * (1 - d / LINK) * Math.min(fade(p), fade(q)));
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        if (mouse.on) {
          var cx = p.x - mouse.x, cy = p.y - mouse.y, cd = Math.sqrt(cx * cx + cy * cy);
          if (cd < LINK * 1.2) {
            ctx.strokeStyle = rgba(0.45 * (1 - cd / (LINK * 1.2)) * fade(p));
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }
    };
    var loop = function () { draw(true); raf = requestAnimationFrame(loop); };
    var start = function () { if (!raf && !reduceMotion) raf = requestAnimationFrame(loop); };
    var stop = function () { if (raf) { cancelAnimationFrame(raf); raf = null; } };

    readColor();
    resize();
    start();
    window.addEventListener("resize", resize);
    if (!reduceMotion) {
      window.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
      });
      document.documentElement.addEventListener("mouseleave", function () { mouse.on = false; });
      document.addEventListener("pointerdown", function (e) {
        if (e.target.closest("a, button")) return;
        for (var n = 0; n < 8 && dots.length < 120; n++) {
          var ang = Math.random() * 6.2832, sp = 1 + Math.random() * 1.8;
          dots.push({ x: e.clientX, y: e.clientY, r: 1.5 + Math.random() * 1.8,
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 150 });
        }
      });
    }
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var recolor = function () { readColor(); draw(false); };
    if (mq.addEventListener) mq.addEventListener("change", recolor);
    window.__starBoost = function (n, ms) { boost = n; setTimeout(function () { boost = 1; }, ms); };
  }


  // Small delights
  var toast = document.querySelector(".toast");
  var toastTimer;
  var say = function (msg, ms) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, ms || 3500);
  };

  var duck = document.querySelector(".duck");
  var tips = [
    "quack. have u tried explaining it out loud",
    "quack. is it a bug or just how it works now",
    "quack. what did u expect to happen tho",
    "quack. did u actualy read the logs",
    "quack. go get coffee, the bug isnt going anywhere"
  ];
  var t = 0;
  duck.addEventListener("click", function () {
    say(tips[t++ % tips.length]);
    duck.classList.remove("waddle"); void duck.offsetWidth; duck.classList.add("waddle");
    // one full cycle of tips opens the terminal
    if (t % tips.length === 0 && window.__openTerm) setTimeout(window.__openTerm, reduceMotion ? 0 : 1600);
  });

  // Konami code: send the stars into overdrive
  var seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"], pos = 0;
  document.addEventListener("keydown", function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
    if (pos === seq.length) {
      pos = 0;
      say("Debug mode unlocked ✨ the stars are very excited.");
      if (window.__starBoost && !reduceMotion) window.__starBoost(8, 5000);
    }
  });

  // Click the portrait to cycle through photos
  var portrait = document.querySelector(".portrait");
  if (portrait) {
    var pimg = portrait.querySelector("img");
    var shots = [
      ["images/portraits/linkedin.jpg", "50% 20%"],
      ["images/portraits/me.jpg", "50% 20%"],
      ["images/portraits/me2.jpg", "50% 25%"]
    ];
    var si = 0, preloaded = false;
    var preload = function () {
      if (preloaded) return; preloaded = true;
      shots.forEach(function (x) { new Image().src = x[0]; });
    };
    portrait.addEventListener("pointerenter", preload);
    portrait.addEventListener("click", function () {
      preload();
      si = (si + 1) % shots.length;
      portrait.classList.add("swapping");
      setTimeout(function () {
        var show = function () { portrait.classList.remove("swapping"); };
        pimg.onload = show;
        pimg.style.objectPosition = shots[si][1];
        pimg.src = shots[si][0];
        setTimeout(show, 1200);
      }, reduceMotion ? 0 : 250);
    });
  }

  // Click the location line for a Chicago fact
  var loc = document.querySelector(".location");
  if (loc) {
    var facts = [
      "Chicago dyes its river green every St. Patrick's Day.",
      "Cloud Gate (\u201Cthe Bean\u201D) is made of 168 stainless steel plates, polished until the seams disappear.",
      "In 1900, Chicago reversed the flow of its river.",
      "The Home Insurance Building (1885) is often called the world's first skyscraper, and it was in Chicago.",
      "Chicago has 77 official community areas, each with its own character."
    ];
    var fi = Math.floor(Math.random() * facts.length);
    loc.addEventListener("click", function () {
      say("Chicago fact: " + facts[fi++ % facts.length], 5500);
    });
  }

  // Type "sudo hire rakshana" anywhere for a mock terminal
  var term = document.querySelector(".term");
  if (term) {
    var termBody = term.querySelector(".term-body");
    var cmd = "sudo hire rakshana", progress = "", termTimers = [], lastFocus = null;
    var lines = [
      "$ sudo hire rakshana",
      "[sudo] password for recruiter: ********",
      "Authenticating... <span class=\"term-ok\">ok</span>",
      "Checking skills...",
      "  search <span class=\"term-ok\">\u2713</span>  nlp <span class=\"term-ok\">\u2713</span>  agentic ai <span class=\"term-ok\">\u2713</span>  evaluation <span class=\"term-ok\">\u2713</span>  coffee <span class=\"term-ok\">\u2713</span>",
      "Permission granted. Let's talk.",
      "Next: <a href=\"mailto:" + addr + "\">" + addr + "</a>"
    ];
    var closeTerm = function () {
      termTimers.forEach(clearTimeout); termTimers = [];
      term.hidden = true;
      if (lastFocus) lastFocus.focus();
    };
    var openTerm = function () {
      lastFocus = document.activeElement;
      termBody.innerHTML = "";
      term.hidden = false;
      term.querySelector(".term-close").focus();
      lines.forEach(function (ln, idx) {
        var add = function () { termBody.insertAdjacentHTML("beforeend", ln + "\n"); };
        if (reduceMotion) add(); else termTimers.push(setTimeout(add, idx * 550));
      });
    };
    window.__openTerm = openTerm;
    term.querySelector(".term-close").addEventListener("click", closeTerm);
    term.addEventListener("click", function (e) { if (e.target === term) closeTerm(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !term.hidden) { closeTerm(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      var k = e.key.toLowerCase();
      if (cmd.indexOf(progress + k) === 0) progress += k;
      else progress = cmd.charAt(0) === k ? k : "";
      if (progress.length > 1 && k === " ") e.preventDefault();
      if (progress === cmd) { progress = ""; openTerm(); }
    });
  }

  // Tab title when you wander off
  var title = document.title;
  document.addEventListener("visibilitychange", function () {
    document.title = document.hidden ? "HACKED (not) 🐞" : title;
  });

  if (window.console) {
    console.log("%c\n████    ███   █  █    ████  █   █   ███   █   █   ███\n█   █  █   █  █ █    █      █   █  █   █  ██  █  █   █\n████   █████  ██      ███   █████  █████  █ █ █  █████\n█  █   █   █  █ █        █  █   █  █   █  █  ██  █   █\n█   █  █   █  █  █   ████   █   █  █   █  █   █  █   █\n", "color:#d6336c;font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.15");
    console.log("%chey, fellow dev \ud83d\udc4b poking around? say hi: " + addr, "color:#d6336c;font-weight:600;font-size:13px");
  }

  // Rotating hero line (static first phrase if reduced motion)
  var el = document.querySelector(".txt-rotate");
  if (el && !reduceMotion) {
    var phrases = JSON.parse(el.getAttribute("data-rotate"));
    var i = 0, text = "", deleting = false;
    var tick = function () {
      var full = phrases[i];
      text = deleting ? full.substring(0, text.length - 1) : full.substring(0, text.length + 1);
      el.innerHTML = '<span class="rot">' + text + "</span>";
      var delay = deleting ? 35 : 70;
      if (!deleting && text === full) { delay = 1800; deleting = true; }
      else if (deleting && text === "") { deleting = false; i = (i + 1) % phrases.length; delay = 400; }
      setTimeout(tick, delay);
    };
    tick();
  }
})();
