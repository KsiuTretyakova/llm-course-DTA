/* ==========================================================================
   РУШІЙ СТОРІНКИ: навігація, слайди, робочий зошит, вправи.
   Змінювати не потрібно. Відкриття занять — у файлі config.js.
   ========================================================================== */
(function(){
'use strict';
var C = window.COURSE;
var KEY = 'dta-llm-course-v3-book';
var S = {act:{}, seen:{}, chk:{}, txt:{}, student:{}, last:null};
try { var raw = localStorage.getItem(KEY); if (raw) { var p = JSON.parse(raw); if (p && typeof p === 'object') S = Object.assign(S, p); } } catch(e) {}
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {} }

function h(tag, attrs){
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    var v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.slice(0,2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (var i = 2; i < arguments.length; i++) add(e, arguments[i]);
  return e;
}
function add(e, kid){
  if (kid == null || kid === false) return;
  if (Array.isArray(kid)) { kid.forEach(function(k){ add(e, k); }); return; }
  e.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(String(kid)) : kid);
}
function btn(label, cls, onclick, extra){ var a = Object.assign({type:'button', class:'btn ' + (cls||''), onclick:onclick}, extra||{}); return h('button', a, label); }
function fbEl(){ return h('div', {class:'fb', role:'status', 'aria-live':'polite'}); }
function setFb(fb, kind, html){ fb.className = 'fb ' + kind; fb.innerHTML = html; }
function pct(x){ var v = x * 100; if (v === 0) return '0%'; if (v < 1) return v.toFixed(1).replace('.', ',') + '%'; return Math.round(v) + '%'; }
function fmt(n){ return Math.round(n).toLocaleString('uk-UA').replace(/\u00a0/g, ' '); }
function money(n){ return '$' + (n < 100 ? n.toFixed(2).replace('.', ',') : fmt(n)); }
var LET = ['А','Б','В','Г','Д','Е','Є','Ж'];
var OKS = ['Правильно.'];
var BADS = ['Неправильно.'];
var fbn = 0;
function okWord(){ return OKS[(fbn++) % OKS.length]; }
function badWord(){ return BADS[(fbn++) % BADS.length]; }
var MARK = '<svg class="mark" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M12 34 C 10 14, 60 6, 110 7 C 160 8, 194 16, 192 32 C 190 50, 140 56, 96 55 C 46 54, 6 48, 10 30 C 12 20, 30 14, 52 12"/></svg>';
function markOk(el){ if (!el.querySelector('.mark')) el.insertAdjacentHTML('beforeend', MARK); }

function done(id, s, m){
  if (!id) return;
  var prev = S.act[id];
  if (!prev || s >= prev.s) S.act[id] = {s:s, m:m};
  save(); renderRail();
}
function taskWidgets(t){ return t.w ? (Array.isArray(t.w) ? t.w : [t.w]) : []; }
function lessonActs(L){ var ids = []; (L.book || []).forEach(function(t){ taskWidgets(t).forEach(function(w){ if (w.id && w.count !== false && ids.indexOf(w.id) < 0) ids.push(w.id); }); }); return ids; }
function lessonProgress(L){ var a = lessonActs(L); var d = a.filter(function(id){ return S.act[id]; }).length; return {d:d, t:a.length}; }

/* ---------------- widgets ---------------- */
var W = {};
function mount(cfg){
  var f = W[cfg.type];
  var box = h('div', {class:'w w-' + cfg.type});
  if (cfg.intro) box.appendChild(h('p', {class:'w-intro', html:cfg.intro}));
  var api = {
    reset: function(){ box.replaceWith(mount(cfg)); }
  };
  box.appendChild(f ? f(cfg, api) : h('p', null, 'Невідомий тип вправи'));
  return box;
}

/* single question */
function question(q, onAnswer){
  var wrap = h('div', {class:'qbox'});
  wrap.appendChild(h('p', {class:'q', html:q.q}));
  var list = h('div', {class:'opts'});
  var fb = fbEl();
  var locked = false;
  q.options.forEach(function(o, i){
    var b = h('button', {type:'button', class:'opt', onclick:function(){
      if (locked) return; locked = true;
      var ok = i === q.correct;
      Array.prototype.forEach.call(list.children, function(c){ c.disabled = true; });
      b.classList.add(ok ? 'is-ok' : 'is-bad');
      var right = list.children[q.correct];
      right.classList.add('is-ok'); markOk(right);
      setFb(fb, ok ? 'ok' : 'bad', '<b>' + (ok ? okWord() : badWord()) + '</b> ' + (q.explain || ''));
      onAnswer(ok);
    }}, h('span', {class:'k'}, LET[i]), h('span', {html:o}));
    list.appendChild(b);
  });
  wrap.appendChild(list); wrap.appendChild(fb);
  return wrap;
}
W.mcq = function(c, api){
  var root = h('div');
  var again = btn('Спробувати ще раз', 'ghost small', api.reset); again.hidden = true;
  root.appendChild(question(c, function(ok){ done(c.id, ok ? 1 : 0, 1); again.hidden = false; }));
  root.appendChild(again);
  return root;
};
W.quiz = function(c, api){
  var root = h('div');
  var n = c.questions.length, answered = 0, right = 0;
  var res = h('div', {class:'score', hidden:true});
  c.questions.forEach(function(q, i){
    var block = question(Object.assign({}, q, {q:'<span class="muted">' + (i+1) + ' / ' + n + '.</span> ' + q.q}), function(ok){
      answered++; if (ok) right++;
      if (answered === n) {
        done(c.id, right, n);
        res.hidden = false; res.innerHTML = '';
        res.appendChild(h('span', {class:'big'}, right + '/' + n));
        res.appendChild(h('span', null, c.verdict ? c.verdict(right, n) : (right === n ? 'Усі відповіді правильні.' : 'Перегляньте пояснення до неправильних відповідей і пройдіть ще раз.')));
        res.appendChild(btn('Пройти ще раз', 'ghost small', api.reset));
        res.scrollIntoView && res.scrollIntoView({block:'nearest', behavior:'smooth'});
      }
    });
    block.style.marginBottom = '18px';
    root.appendChild(block);
  });
  root.appendChild(res);
  return root;
};
W.multi = function(c, api){
  var root = h('div');
  root.appendChild(h('p', {class:'q', html:c.q}));
  if (c.text) root.appendChild(h('div', {class:'prompt'}, c.text));
  var sel = {};
  var list = h('div', {class:'opts'});
  var fb = fbEl();
  var check = btn('Перевірити', 'blue', function(){
    var allOk = true;
    Array.prototype.forEach.call(list.children, function(b, i){
      b.disabled = true;
      var should = c.correct.indexOf(i) >= 0, chosen = !!sel[i];
      b.classList.remove('sel');
      if (should && chosen) { b.classList.add('is-ok'); markOk(b); }
      else if (!should && chosen) { b.classList.add('is-bad'); allOk = false; }
      else if (should && !chosen) { b.classList.add('is-missed'); allOk = false; }
    });
    setFb(fb, allOk ? 'ok' : 'bad', '<b>' + (allOk ? okWord() : badWord()) + '</b> ' + c.explain);
    done(c.id, allOk ? 1 : 0, 1); check.hidden = true; again.hidden = false;
  });
  var again = btn('Спробувати ще раз', 'ghost small', api.reset); again.hidden = true;
  c.options.forEach(function(o, i){
    var b = h('button', {type:'button', class:'opt', 'aria-pressed':'false', onclick:function(){ sel[i] = !sel[i]; b.classList.toggle('sel', sel[i]); b.setAttribute('aria-pressed', String(!!sel[i])); }}, h('span', {class:'k'}, '□'), h('span', {html:o}));
    list.appendChild(b);
  });
  root.appendChild(h('p', {class:'muted small'}, 'Можна обрати кілька варіантів.'));
  root.appendChild(list); root.appendChild(fb); root.appendChild(h('div', {class:'row'}, check, again));
  return root;
};
W.classify = function(c, api){
  var fields = c.fields || [{label:'', options:c.options}];
  var root = h('div');
  var picks = c.items.map(function(){ return fields.map(function(){ return -1; }); });
  var rows = h('div', {class:'cls'});
  var fb = fbEl();
  var check = btn('Перевірити', 'blue', null); check.disabled = true;
  var again = btn('Спробувати ще раз', 'ghost small', api.reset); again.hidden = true;
  function upd(){ check.disabled = !picks.every(function(p){ return p.every(function(x){ return x >= 0; }); }); }
  c.items.forEach(function(it, ii){
    var row = h('div', {class:'cls-row'});
    row.appendChild(h('div', {class:'cls-text', html:it.text}));
    fields.forEach(function(f, fi){
      var fr = h('div', {class:'cls-field'});
      if (f.label) fr.appendChild(h('span', {class:'fl'}, f.label));
      f.options.forEach(function(o, oi){
        var p = h('button', {type:'button', class:'pill', 'aria-pressed':'false', onclick:function(){
          picks[ii][fi] = oi;
          Array.prototype.forEach.call(fr.querySelectorAll('.pill'), function(x){ x.setAttribute('aria-pressed', 'false'); });
          p.setAttribute('aria-pressed', 'true'); upd();
        }}, o);
        fr.appendChild(p);
      });
      row.appendChild(fr);
    });
    rows.appendChild(row);
  });
  check.addEventListener('click', function(){
    var score = 0;
    c.items.forEach(function(it, ii){
      var ans = Array.isArray(it.a) ? it.a : [it.a];
      var row = rows.children[ii];
      var ok = ans.every(function(a, fi){ return picks[ii][fi] === a; });
      if (ok) score++;
      row.classList.add(ok ? 'ok' : 'bad');
      var fieldEls = row.querySelectorAll('.cls-field');
      Array.prototype.forEach.call(fieldEls, function(fr, fi){
        var pills = fr.querySelectorAll('.pill');
        Array.prototype.forEach.call(pills, function(p, oi){ p.disabled = true; if (oi === ans[fi] && picks[ii][fi] !== ans[fi]) p.classList.add('right'); });
      });
      var right = fields.map(function(f, fi){ return f.options[ans[fi]]; }).join(' — ');
      row.appendChild(h('div', {class:'cls-ex', html:(ok ? '<b>Так.</b> ' : '<b>Правильно: ' + right + '.</b> ') + (it.why || '')}));
    });
    done(c.id, score, c.items.length);
    setFb(fb, score === c.items.length ? 'ok' : 'info', '<b>Результат: ' + score + ' з ' + c.items.length + '.</b> ' + (c.after || ''));
    check.hidden = true; again.hidden = false;
  });
  root.appendChild(rows); root.appendChild(fb); root.appendChild(h('div', {class:'row'}, check, again));
  return root;
};
W.order = function(c, api){
  var root = h('div');
  var n = c.steps.length;
  var shuffled = c.shuffle.map(function(i){ return {i:i, t:c.steps[i]}; });
  var seq = [];
  var list = h('div', {class:'ord'});
  var fb = fbEl();
  var check = btn('Перевірити', 'blue', null); check.disabled = true;
  var clear = btn('Почати спочатку', 'ghost small', function(){ api.reset(); });
  shuffled.forEach(function(s){
    var no = h('span', {class:'no'}, '·');
    var b = h('button', {type:'button', onclick:function(){
      var at = seq.indexOf(s.i);
      if (at >= 0) return;
      seq.push(s.i); no.textContent = String(seq.length); b.classList.add('picked'); b.setAttribute('aria-label', 'Крок ' + seq.length + ': ' + s.t);
      check.disabled = seq.length !== n;
    }}, no, h('span', {html:s.t}));
    s.el = b; s.no = no;
    list.appendChild(b);
  });
  check.addEventListener('click', function(){
    var score = 0;
    shuffled.forEach(function(s){
      var pos = seq.indexOf(s.i);
      var ok = pos === s.i;
      if (ok) score++;
      s.el.classList.add(ok ? 'ok' : 'bad'); s.el.disabled = true;
    });
    done(c.id, score, n);
    var right = '<ol style="margin:8px 0 0">' + c.steps.map(function(t){ return '<li>' + t + '</li>'; }).join('') + '</ol>';
    setFb(fb, score === n ? 'ok' : 'bad', '<b>' + (score === n ? 'Усе на своїх місцях.' : 'На своєму місці ' + score + ' з ' + n + '.') + '</b> ' + (score === n ? (c.explain || '') : 'Правильний порядок:' + right + (c.explain ? '<p style="margin-top:8px">' + c.explain + '</p>' : '')));
    check.hidden = true;
  });
  root.appendChild(h('p', {class:'muted small'}, 'Натискайте кроки в тому порядку, у якому їх слід виконувати.'));
  root.appendChild(list); root.appendChild(fb); root.appendChild(h('div', {class:'row'}, check, clear));
  return root;
};
W.numeric = function(c, api){
  var root = h('div');
  root.appendChild(h('p', {class:'q', html:c.q}));
  var inp = h('input', {type:'text', inputmode:'decimal', 'aria-label':'Ваша відповідь', placeholder:'Ваша відповідь'});
  var fb = fbEl();
  var hints = h('div', {class:'hints'});
  var shown = 0, solved = false, revealed = false;
  var hintBtn = btn('Підказка', 'ghost small', function(){
    if (shown < c.hints.length) { hints.appendChild(h('div', {class:'hint', html:'<b>Крок ' + (shown+1) + '.</b> ' + c.hints[shown]})); shown++; }
    if (shown >= c.hints.length) hintBtn.hidden = true;
  });
  var showBtn = btn('Показати розв’язок', 'ghost small', function(){ revealed = true; setFb(fb, 'info', c.explain); if (!solved) done(c.id, 0, 1); });
  function check(){
    var v = parseFloat(String(inp.value).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, ''));
    if (isNaN(v)) { setFb(fb, 'bad', 'Введіть число.'); return; }
    if (Math.abs(v - c.answer) <= (c.tol || 0)) {
      solved = true; setFb(fb, 'ok', '<b>' + okWord() + '</b> ' + c.explain); if (!revealed) done(c.id, 1, 1); else done(c.id, 0, 1);
    } else {
      var msg = (c.wrong && c.wrong[String(Math.round(v))]) || 'Спробуйте ще раз або відкрийте підказку.';
      setFb(fb, 'bad', '<b>' + badWord() + '</b> ' + msg);
    }
  }
  inp.addEventListener('keydown', function(e){ if (e.key === 'Enter') check(); });
  root.appendChild(h('div', {class:'num-in'}, inp, c.unit ? h('span', null, c.unit) : null, btn('Перевірити', 'blue', check)));
  root.appendChild(hints); root.appendChild(fb);
  root.appendChild(h('div', {class:'row'}, hintBtn, showBtn));
  return root;
};
W.flip = function(c){
  var grid = h('div', {class:'flips'});
  var opened = {};
  c.cards.forEach(function(card, i){
    var b = h('button', {type:'button', class:'flip', 'aria-pressed':'false'});
    function draw(){
      var on = b.getAttribute('aria-pressed') === 'true';
      b.innerHTML = '';
      if (!on) { b.appendChild(h('span', {class:'ft', html:card.f})); if (card.sub) b.appendChild(h('span', {class:'muted small', html:card.sub})); b.appendChild(h('span', {class:'fh'}, 'Натисніть, щоб перевернути')); }
      else { b.appendChild(h('span', {class:'ft', html:card.f})); b.appendChild(h('span', {html:card.b})); }
    }
    b.addEventListener('click', function(){ b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); draw(); opened[i] = 1; if (Object.keys(opened).length === c.cards.length) done(c.id, 1, 1); });
    draw(); grid.appendChild(b);
  });
  return grid;
};
W.tabs = function(c){
  var root = h('div');
  var bar = h('div', {class:'tabs', role:'tablist'});
  var panel = h('div', {class:'tabpanel', role:'tabpanel'});
  var seen = {};
  c.tabs.forEach(function(t, i){
    var b = h('button', {type:'button', role:'tab', 'aria-selected': i === 0 ? 'true' : 'false', onclick:function(){ sel(i); }}, t.label);
    bar.appendChild(b);
  });
  function sel(i){
    Array.prototype.forEach.call(bar.children, function(b, j){ b.setAttribute('aria-selected', String(i === j)); });
    panel.innerHTML = c.tabs[i].html; seen[i] = 1;
    if (c.id && Object.keys(seen).length === c.tabs.length) done(c.id, 1, 1);
  }
  root.appendChild(bar); root.appendChild(panel); sel(0);
  return root;
};
W.reveal = function(c){
  var root = h('div', {class:'rev'});
  var seen = {};
  c.items.forEach(function(it, i){
    var a = h('div', {class:'ra', html:it.a, hidden:true});
    var b = btn('Показати відповідь', 'ghost small', function(){ a.hidden = false; b.hidden = true; seen[i] = 1; if (Object.keys(seen).length === c.items.length) done(c.id, 1, 1); });
    root.appendChild(h('div', {class:'rev-item'}, h('div', {html:it.q}), h('div', {style:'margin-top:8px'}, b), a));
  });
  return root;
};
W.checklist = function(c){
  var st = S.chk[c.id] || [];
  var root = h('div', {class:'chk'});
  c.items.forEach(function(t, i){
    var inp = h('input', {type:'checkbox'});
    inp.checked = !!st[i];
    inp.addEventListener('change', function(){ st[i] = inp.checked; S.chk[c.id] = st; save(); if (c.items.every(function(_, j){ return st[j]; })) done(c.id, 1, 1); });
    root.appendChild(h('label', null, inp, h('span', {html:t})));
  });
  return root;
};
W.copy = function(c){
  var root = h('div');
  var pre = h('div', {class:'prompt'}, c.text);
  var ok = h('span', {class:'copy-ok', role:'status', 'aria-live':'polite'});
  var b = btn('Скопіювати', 'blue small', function(){
    function fallback(){ try { var r = document.createRange(); r.selectNodeContents(pre); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); ok.textContent = 'Скопійовано'; } catch(e) { ok.textContent = 'Виділіть текст і скопіюйте вручну'; } }
    try { navigator.clipboard.writeText(c.text).then(function(){ ok.textContent = 'Скопійовано'; }, fallback); } catch(e) { fallback(); }
    done(c.id, 1, 1);
  });
  root.appendChild(pre); root.appendChild(h('div', {class:'row'}, b, ok));
  return root;
};

/* next word */
W.nextword = function(c, api){
  var root = h('div');
  var words = [c.start], node = 'root', last = null;
  var sent = h('p', {class:'nw-sent', 'aria-live':'polite'});
  var opts = h('div', {class:'nw-opts'});
  var fb = fbEl();
  var tools = h('div', {class:'row'});
  function draw(){
    sent.innerHTML = words.map(function(w, i){ return i === 0 ? w : '<span class="nw-new">' + w + '</span>'; }).join(' ') + (node ? ' <span class="caret" aria-hidden="true">▍</span>' : '.');
    opts.innerHTML = ''; tools.innerHTML = '';
    if (!node) {
      setFb(fb, last && last.odd ? 'bad' : 'ok', last && last.odd ? c.oddText : c.endText);
      tools.appendChild(btn('Скласти інше речення', 'ghost small', api.reset));
      done(c.id, 1, 1); return;
    }
    var n = c.nodes[node];
    n.opts.forEach(function(o){
      var b = h('button', {type:'button', class:'nw-opt', onclick:function(){ choose(o); }},
        h('span', {class:'nw-w'}, o.w), h('span', {class:'bar'}, h('span', {style:'width:' + Math.max(o.p, .6) + '%'})), h('span', {class:'nw-p'}, String(o.p).replace('.', ',') + '%'));
      opts.appendChild(b);
    });
    if (n.rest) opts.appendChild(h('p', {class:'muted small', style:'margin:0'}, 'Інші слова разом: ' + String(n.rest).replace('.', ',') + '%'));
    tools.appendChild(btn('Нехай ШІ обере найімовірніше', 'ghost small', function(){ var best = n.opts.slice().sort(function(a, b){ return b.p - a.p; })[0]; choose(best); }));
  }
  function choose(o){ words.push(o.w); last = o; node = o.next || null; draw(); }
  root.appendChild(sent); root.appendChild(opts); root.appendChild(fb); root.appendChild(tools);
  draw();
  return root;
};
/* tokens */
W.tokens = function(c){
  var root = h('div');
  var bar = h('div', {class:'tabs'});
  var box = h('div', {class:'toks', 'aria-live':'polite'});
  var cnt = h('p', {class:'small muted'});
  var cmp = h('div');
  c.sets.forEach(function(s, i){ bar.appendChild(h('button', {type:'button', 'aria-selected': i === 0 ? 'true' : 'false', onclick:function(){ sel(i); }}, s.label)); });
  var seen = {};
  function sel(i){
    Array.prototype.forEach.call(bar.children, function(b, j){ b.setAttribute('aria-selected', String(i === j)); });
    var s = c.sets[i]; box.innerHTML = '';
    s.tokens.forEach(function(t, k){ box.appendChild(h('span', {class:'t' + (k % 5)}, t)); });
    cnt.textContent = s.text.length + ' символів → ' + s.tokens.length + ' токенів';
    seen[i] = 1; if (Object.keys(seen).length === c.sets.length) { done(c.id, 1, 1); showCmp(); }
  }
  function showCmp(){
    cmp.innerHTML = '';
    var max = Math.max.apply(null, c.sets.map(function(s){ return s.tokens.length; }));
    c.sets.forEach(function(s){
      cmp.appendChild(h('div', {class:'cmp'}, h('span', null, s.label), h('span', {class:'bar'}, h('span', {style:'width:' + (s.tokens.length / max * 100) + '%'})), h('b', null, String(s.tokens.length))));
    });
    cmp.appendChild(h('p', {class:'small muted', html:c.note}));
  }
  root.appendChild(bar); root.appendChild(box); root.appendChild(cnt); root.appendChild(cmp);
  sel(0);
  return root;
};
/* temperature */
W.temperature = function(c){
  var root = h('div');
  var T = 1;
  var val = h('span', {class:'temp-val'});
  var range = h('input', {type:'range', min:'0.1', max:'2', step:'0.1', value:'1', 'aria-label':'Температура'});
  var bars = h('div', {class:'nw-opts'});
  var gen = h('div', {class:'gen', 'aria-live':'polite'});
  var note = h('p', {class:'small muted'});
  function probs(){ var z = c.logits.map(function(l){ return l / T; }); var m = Math.max.apply(null, z); var e = z.map(function(x){ return Math.exp(x - m); }); var s = e.reduce(function(a, b){ return a + b; }, 0); return e.map(function(x){ return x / s; }); }
  function draw(){
    val.textContent = T.toFixed(1).replace('.', ',');
    var p = probs(); bars.innerHTML = '';
    c.words.forEach(function(w, i){
      bars.appendChild(h('div', {class:'nw-opt', style:'cursor:default'}, h('span', null, w), h('span', {class:'bar'}, h('span', {style:'width:' + Math.max(p[i] * 100, .4) + '%'})), h('span', {class:'nw-p'}, pct(p[i]))));
    });
  }
  range.addEventListener('input', function(){ T = parseFloat(range.value); draw(); });
  var presets = h('div', {class:'row'});
  c.presets.forEach(function(pr){ presets.appendChild(btn(pr.label, 'ghost small', function(){ T = pr.t; range.value = String(pr.t); draw(); })); });
  var g = btn('Згенерувати 20 продовжень', 'blue small', function(){
    var p = probs(); gen.innerHTML = ''; var odd = 0;
    for (var k = 0; k < 20; k++) {
      var r = Math.random(), acc = 0, pick = p.length - 1;
      for (var i = 0; i < p.length; i++) { acc += p[i]; if (r <= acc) { pick = i; break; } }
      if (pick === c.odd) odd++;
      gen.appendChild(h('span', {class: pick === c.odd ? 'odd' : ''}, c.words[pick]));
    }
    var uniq = {}; Array.prototype.forEach.call(gen.children, function(s){ uniq[s.textContent] = 1; });
    note.textContent = 'Різних продовжень: ' + Object.keys(uniq).length + ' з 20' + (odd ? '. «' + c.words[c.odd] + '» з’явився ' + odd + ' раз(и) — так виглядає «надто творча» відповідь.' : '.');
    done(c.id, 1, 1);
  });
  root.appendChild(h('div', {class:'temp-ctl'}, h('span', null, 'Температура'), range, val));
  root.appendChild(presets);
  root.appendChild(h('p', {class:'nw-sent', style:'font-size:22px;margin-top:16px !important'}, c.prefix + ' …'));
  root.appendChild(bars); root.appendChild(h('div', {class:'row'}, g)); root.appendChild(gen); root.appendChild(note);
  draw();
  return root;
};
/* prompt builder */
W.builder = function(c){
  var root = h('div');
  var on = {task:true};
  var ing = h('div', {class:'ing'});
  var pre = h('div', {class:'prompt', 'aria-live':'polite'});
  var meter = h('div', {class:'meter'});
  var out = h('div');
  c.parts.forEach(function(p){
    var b = h('button', {type:'button', 'aria-pressed': on[p.k] ? 'true' : 'false', onclick:function(){ on[p.k] = !on[p.k]; b.setAttribute('aria-pressed', String(!!on[p.k])); draw(); }}, (on[p.k] ? '' : '') + p.label);
    ing.appendChild(b);
  });
  function draw(){
    var lines = c.parts.filter(function(p){ return on[p.k]; }).map(function(p){ return p.line; });
    pre.textContent = lines.length ? lines.join('\n') + '\n\n[8 відгуків]' : '[8 відгуків]';
    var score = !on.task ? 0 : on.rules ? 8 : on.examples ? 7 : 5;
    meter.innerHTML = '';
    for (var i = 0; i < 8; i++) meter.appendChild(h('i', {class: i < score ? 'on' : ''}));
    meter.appendChild(h('b', null, on.task ? 'Очікувано правильних: ' + score + ' з 8' : 'Без завдання ШІ не зрозуміє, що робити'));
    out.innerHTML = '';
    if (!on.task) return;
    var r2 = on.rules || on.examples ? 'негативний — доставка' : 'позитивний — доставка';
    var r8 = on.rules ? 'змішаний — обслуговування' : on.examples ? 'змішаний — доставка' : 'позитивний — доставка';
    var ok2 = on.rules || on.examples, ok8 = !!on.rules;
    if (on.format) {
      out.appendChild(h('div', {class:'tablewrap'}, h('table', {class:'t'},
        h('tr', null, h('th', null, 'Відгук'), h('th', null, 'Відповідь ШІ'), h('th', null, '')),
        h('tr', null, h('td', null, '№2 «…тиждень чекав. Супер сервіс.»'), h('td', null, r2), h('td', null, ok2 ? '✓' : '✗ сарказм')),
        h('tr', null, h('td', null, '№8 «Доставили вчасно, але оператор був грубий»'), h('td', null, r8), h('td', null, ok8 ? '✓' : '✗ тема скарги')))));
    } else {
      out.appendChild(h('p', {class:'small'}, '«Другий відгук, схоже, ' + r2.split(' — ')[0] + ', йдеться про доставку. У восьмому клієнт задоволений доставкою, хоча є зауваження…» — без формату ШІ пише розлогий текст, який незручно переносити в таблицю.'));
    }
    out.appendChild(h('p', {class:'small muted'}, 'Приклад відповіді моделі з таким промптом.'));
    if (on.task && on.rules && on.format) done(c.id, 1, 1);
  }
  root.appendChild(h('p', {class:'small muted'}, 'Інгредієнти промпту (натисніть, щоб увімкнути чи вимкнути):'));
  root.appendChild(ing); root.appendChild(pre); root.appendChild(meter); root.appendChild(out);
  draw();
  return root;
};
/* find wrong cells */
W.findcell = function(c, api){
  var root = h('div');
  var picked = {};
  var tbl = h('table', {class:'t fc'});
  tbl.appendChild(h('tr', null, c.head.map(function(x){ return h('th', null, x); })));
  var btns = [];
  c.rows.forEach(function(r, ri){
    var tr = h('tr');
    r.forEach(function(cell, ci){
      var key = ri + ':' + ci;
      var b = h('button', {type:'button', 'aria-pressed':'false', onclick:function(){ picked[key] = !picked[key]; b.setAttribute('aria-pressed', String(!!picked[key])); }}, cell);
      btns.push({k:key, b:b});
      tr.appendChild(h('td', null, b));
    });
    tbl.appendChild(tr);
  });
  var fb = fbEl();
  var wrong = c.wrong.map(function(w){ return w[0] + ':' + w[1]; });
  var check = btn('Перевірити', 'blue', function(){
    var hit = 0, extra = 0;
    btns.forEach(function(x){
      x.b.disabled = true;
      var isW = wrong.indexOf(x.k) >= 0, isP = !!picked[x.k];
      if (isW && isP) { x.b.classList.add('ok'); hit++; }
      else if (!isW && isP) { x.b.classList.add('bad'); extra++; }
      else if (isW && !isP) x.b.classList.add('missed');
    });
    var ok = hit === wrong.length && !extra;
    done(c.id, ok ? 1 : 0, 1);
    setFb(fb, ok ? 'ok' : 'bad', '<b>' + (ok ? 'Знайдено всі вигадки.' : 'Знайдено ' + hit + ' з ' + wrong.length + (extra ? ', ще ' + extra + ' позначено зайве' : '') + '.') + '</b> ' + c.explain);
    check.hidden = true; again.hidden = false;
  });
  var again = btn('Спробувати ще раз', 'ghost small', api.reset); again.hidden = true;
  root.appendChild(h('div', {class:'tablewrap'}, tbl)); root.appendChild(fb); root.appendChild(h('div', {class:'row'}, check, again));
  return root;
};
/* heatmap */
W.heatmap = function(c, api){
  var root = h('div');
  var months = ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'];
  var regions = [['Київ',1],['Харків',.55],['Львів',.6],['Одеса',.5],['Дніпро',.45]];
  var season = [.85,.80,.90,.92,.95,.93,.90,.97,1.05,1.10,1.45,1.60];
  var fb = fbEl();
  var grid = h('div', {class:'hm', role:'grid', 'aria-label':'Замовлення ноутбуків за регіонами і місяцями'});
  grid.appendChild(h('span'));
  months.forEach(function(m){ grid.appendChild(h('span', {class:'hh'}, m)); });
  var answered = false;
  regions.forEach(function(r, ri){
    var vals = season.map(function(s, mi){ var v = Math.round(180 * r[1] * s * (1 + .01 * (mi + 1))); if (ri === 1 && mi === 6) v = Math.round(v * .35); return v; });
    var max = Math.max.apply(null, vals);
    grid.appendChild(h('span', {class:'hl'}, r[0]));
    vals.forEach(function(v, mi){
      var a = .12 + .7 * (v / max);
      var b = h('button', {type:'button', 'aria-label':r[0] + ', ' + months[mi] + ': ' + v + ' замовлень', style:'background:color-mix(in srgb, var(--blue) ' + Math.round(a * 100) + '%, var(--surface))' + (a > .55 ? ';color:var(--on-blue)' : ''), onclick:function(){
        if (answered) return;
        var ok = ri === 1 && mi === 6;
        b.classList.add(ok ? 'ok' : 'bad');
        if (ok) { answered = true; done(c.id, 1, 1); setFb(fb, 'ok', '<b>Знайшли!</b> ' + c.explain); }
        else { done(c.id, 0, 1); setFb(fb, 'bad', '<b>Тут усе гаразд:</b> ' + r[0] + ', ' + months[mi] + ' — ' + v + ' замовлень, як і в сусідніх місяцях. Шукайте різкий провал у рядку.'); }
      }}, String(v));
      grid.appendChild(b);
    });
  });
  root.appendChild(h('div', {class:'tablewrap'}, grid));
  root.appendChild(h('p', {class:'small muted', style:'margin-top:8px'}, 'Що темніша клітинка, то більше замовлень у цьому регіоні.'));
  root.appendChild(fb);
  return root;
};
/* API request builder */
W.request = function(c){
  var root = h('div', {class:'req'});
  var left = h('div'), right = h('div');
  function sel(label, opts, init){ var s = h('select', {'aria-label':label}); opts.forEach(function(o, i){ var op = h('option', {value:String(i)}, o); if (i === init) op.selected = true; s.appendChild(op); }); left.appendChild(h('label', null, label)); left.appendChild(s); return s; }
  var sm = sel('Модель', c.models, 0), si = sel('Інструкція (system)', c.instr, 0), st = sel('Температура', c.temps.map(String), 0), sq = sel('Питання (user)', c.qs, 0);
  var pre = h('div', {class:'prompt', 'aria-live':'polite'});
  var ans = h('div');
  var tried = {};
  function note(){
    var o = {model:c.models[+sm.value], messages:[{role:'system', content:c.instr[+si.value]}, {role:'user', content:c.qs[+sq.value]}], temperature:c.temps[+st.value]};
    pre.textContent = JSON.stringify(o, null, 2);
  }
  [sm, si, st, sq].forEach(function(s){ s.addEventListener('change', function(){ note(); ans.innerHTML = ''; }); });
  var send = btn('Надіслати записку', 'blue', function(){
    var a = c.answers[si.value + '-' + sq.value];
    ans.innerHTML = '';
    ans.appendChild(h('div', {class:'bubble ai'}, h('span', {class:'who'}, 'Відповідь «кухні»'), a));
    if (c.temps[+st.value] >= 1.5) ans.appendChild(h('p', {class:'small muted'}, 'Температура висока: якщо надіслати ще раз, формулювання буде іншим.'));
    tried[si.value] = 1; if (Object.keys(tried).length >= 2) done(c.id, 1, 1);
  });
  right.appendChild(h('label', null, 'Що програма надсилає через API'));
  right.appendChild(pre); right.appendChild(send); right.appendChild(h('div', {style:'margin-top:12px'}, ans));
  root.appendChild(left); root.appendChild(right);
  note();
  return root;
};
/* chat memory sim */
W.chatsim = function(c){
  var root = h('div');
  var chat = h('div', {class:'chat', 'aria-live':'polite'});
  var info = h('p', {class:'sent'});
  var hist = [], told = false, chats = 1, askedFresh = false;
  function sys(t){ chat.appendChild(h('p', {class:'sys'}, t)); }
  function msg(who, t){ chat.appendChild(h('div', {class:'bubble ' + (who === 'me' ? 'me' : 'ai')}, h('span', {class:'who'}, who === 'me' ? 'Ви' : 'ШІ'), t)); hist.push(t); upd(); }
  function upd(){ var chars = hist.join(' ').length; info.textContent = 'Зараз з кожним новим повідомленням моделі надсилається вся історія: ' + hist.length + ' повідомлень, ≈ ' + Math.max(0, Math.round(chars / 3)) + ' токенів.'; }
  sys('Чат №1');
  var b1 = btn('Сказати: «Наш середній чек у жовтні — 1 160 грн»', 'ghost small', function(){ msg('me', 'Наш середній чек у жовтні — 1 160 грн.'); told = true; msg('ai', 'Зрозумів, запам’ятав для цієї розмови.'); });
  var b2 = btn('Запитати: «Який у нас середній чек у жовтні?»', 'ghost small', function(){
    msg('me', 'Який у нас середній чек у жовтні?');
    if (told) msg('ai', 'У жовтні ваш середній чек — 1 160 грн.');
    else { msg('ai', 'Я не знаю середнього чека вашої компанії: у цій розмові ви його не називали.'); if (chats > 1) { askedFresh = true; done(c.id, 1, 1); } }
  });
  var b3 = btn('Почати новий чат', 'blue small', function(){ chats++; hist = []; told = false; chat.innerHTML = ''; sys('Чат №' + chats + ' — чистий стіл'); upd(); });
  root.appendChild(chat); root.appendChild(info); root.appendChild(h('div', {class:'row'}, b1, b2, b3));
  upd();
  return root;
};
/* api cost */
W.apicost = function(c){
  var root = h('div');
  var n = 50000, b = 20;
  function slider(label, min, max, step, val, fn, fmtf){ var o = h('output'); var i = h('input', {type:'range', min:String(min), max:String(max), step:String(step), value:String(val), 'aria-label':label}); i.addEventListener('input', function(){ fn(+i.value); o.textContent = fmtf(+i.value); draw(); done(c.id, 1, 1); }); o.textContent = fmtf(val); root.appendChild(h('div', {class:'sl'}, h('span', null, label), i, o)); }
  slider('Кількість відгуків', 1000, 100000, 1000, n, function(v){ n = v; }, fmt);
  slider('Відгуків в одній записці', 1, 30, 1, b, function(v){ b = v; }, String);
  var res = h('div', {class:'res', 'aria-live':'polite'});
  function draw(){
    var r1 = n, in1 = n * (120 + 200), out1 = n * 20, cost1 = in1 / 1e6 * .15 + out1 / 1e6 * .6, d1 = Math.ceil(r1 / 1000);
    var r2 = Math.ceil(n / b), in2 = r2 * (200 + b * 120), out2 = r2 * (b * 20 + (b > 1 ? 50 : 0)), cost2 = in2 / 1e6 * .15 + out2 / 1e6 * .6, d2 = Math.ceil(r2 / 1000);
    res.innerHTML = '';
    res.appendChild(h('div', {class:'card'}, h('h3', null, 'По одному відгуку'), h('div', {class:'v'}, money(cost1)), h('p', {class:'small', style:'margin:6px 0 0'}, fmt(r1) + ' записок · ' + d1 + ' дн. на безкоштовному ліміті')));
    res.appendChild(h('div', {class:'card' + (cost2 < cost1 ? ' win' : '')}, h('h3', null, 'По ' + b + ' в записці'), h('div', {class:'v'}, money(cost2)), h('p', {class:'small', style:'margin:6px 0 0'}, fmt(r2) + ' записок · ' + d2 + ' дн. на безкоштовному ліміті')));
  }
  root.appendChild(res);
  root.appendChild(h('p', {class:'small muted'}, 'Умовні ціни: $0,15 за 1 млн вхідних і $0,60 за 1 млн вихідних токенів; відгук — 120 токенів, інструкція — 200, відповідь — 20; безкоштовний ліміт — 1 000 записок на добу.'));
  draw();
  return root;
};
/* RAG simulator */
var STOP = 'і й в у з на що щоб як чи є до за не а о та ми ще це'.split(' ');
function words(s){ return (s.toLowerCase().match(/[a-zа-яіїєґ0-9’']+/g) || []).filter(function(w){ return STOP.indexOf(w) < 0 && w.length > 1; }); }
W.ragsim = function(c){
  var root = h('div');
  var qi = 0, mode = 2, viewed = {};
  var qs = h('div', {class:'qs'});
  var modes = h('div', {class:'mode', role:'tablist'});
  var body = h('div', {'aria-live':'polite'});
  c.questions.forEach(function(q, i){ qs.appendChild(h('button', {type:'button', class:'pill', 'aria-pressed': i === 0 ? 'true' : 'false', onclick:function(){ qi = i; Array.prototype.forEach.call(qs.children, function(x, j){ x.setAttribute('aria-pressed', String(j === i)); }); draw(); }}, q.q)); });
  ['Без документів', 'Пошук за словами', 'RAG: пошук за змістом'].forEach(function(m, i){ modes.appendChild(h('button', {type:'button', role:'tab', 'aria-selected': i === mode ? 'true' : 'false', onclick:function(){ mode = i; Array.prototype.forEach.call(modes.children, function(x, j){ x.setAttribute('aria-selected', String(j === i)); }); draw(); }}, m)); });
  modes.className = 'tabs';
  function draw(){
    var q = c.questions[qi]; body.innerHTML = '';
    if (mode === 0) {
      body.appendChild(h('div', {class:'bubble ai'}, h('span', {class:'who'}, 'ШІ без документів'), q.nodoc));
      body.appendChild(h('div', {class:'fb bad'}, q.nodocNote));
      return;
    }
    if (mode === 1) {
      var qw = words(q.q);
      var res = c.docs.map(function(d){ var dw = words(d.text); var m = qw.filter(function(w){ return dw.indexOf(w) >= 0; }); var cnt = m.reduce(function(a, w){ return a + dw.filter(function(x){ return x === w; }).length; }, 0); return {d:d, m:m, cnt:cnt}; });
      var best = res.slice().sort(function(a, b){ return b.cnt - a.cnt; })[0];
      var grid = h('div', {class:'docs'});
      res.forEach(function(r){ grid.appendChild(h('div', {class:'doc' + (r.cnt && r === best ? ' top' : '')}, h('b', null, r.d.name), h('span', null, r.m.length ? 'Збіглися слова: ' + r.m.join(', ') : 'Спільних слів немає'), h('span', {class:'bar'}, h('span', {style:'width:' + Math.min(100, r.cnt * 25) + '%'})))); });
      body.appendChild(h('p', {class:'small muted'}, 'Пошук шукає в документах ті самі слова, що й у питанні (як Ctrl+F).'));
      body.appendChild(grid);
      var verdict;
      if (!best.cnt) verdict = '<b>Нічого не знайдено:</b> жодне слово питання не збіглося з документами. ' + (q.target ? 'Хоча відповідь у документі «' + c.docs[q.target - 1].name + '» є — там просто інші слова.' : '');
      else if (q.target && best.d === c.docs[q.target - 1]) verdict = '<b>Документ правильний,</b> але подивіться, на яких словах: ' + best.m.join(', ') + '. ' + (q.wordNote || '');
      else if (q.target) verdict = '<b>Пошук за словами помилився:</b> обрав «' + best.d.name + '», а відповідь у «' + c.docs[q.target - 1].name + '».';
      else verdict = '<b>Знайдено «' + best.d.name + '»</b>, хоча відповіді на це питання в документах немає.';
      body.appendChild(h('div', {class:'fb info', html:verdict}));
      return;
    }
    var sem = h('div', {class:'docs'});
    q.sem.forEach(function(s, i){ var d = c.docs[s[0] - 1]; sem.appendChild(h('div', {class:'doc' + (i === 0 && q.target ? ' top' : '')}, h('b', null, d.name), h('span', null, 'Схожість за змістом'), h('span', {class:'bar'}, h('span', {style:'width:' + s[1] + '%'})))); });
    body.appendChild(h('p', {class:'small muted'}, '1–2. Пошук за змістом знаходить найближчі уривки (ілюстрація):'));
    body.appendChild(sem);
    body.appendChild(h('p', {class:'small muted'}, '3. Шпаргалка, яку отримує ШІ:'));
    body.appendChild(h('div', {class:'sheet', html:'<b>Правило:</b> відповідай лише з уривків; якщо відповіді немає — скажи про це.<br><b>Уривок:</b> ' + (q.chunk || '— (жоден уривок не відповідає на питання)') + '<br><b>Питання:</b> ' + q.q}));
    body.appendChild(h('p', {class:'small muted'}, '4. Відповідь:'));
    body.appendChild(h('div', {class:'bubble ai'}, h('span', {class:'who'}, 'ШІ з шпаргалкою'), h('span', {html:q.rag})));
    viewed[qi] = 1; if (Object.keys(viewed).length >= 3) done(c.id, 1, 1);
  }
  root.appendChild(h('p', {class:'small muted'}, 'Оберіть питання:')); root.appendChild(qs);
  root.appendChild(h('p', {class:'small muted'}, 'Оберіть спосіб:')); root.appendChild(modes);
  root.appendChild(body);
  draw();
  return root;
};
/* meaning map */
W.meaningmap = function(c){
  var root = h('div', {class:'map'});
  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, at){ var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; }
  var svg = s('svg', {viewBox:'0 0 640 380', role:'img', 'aria-label':'Карта змісту: фрази з документів і питання'});
  c.zones.forEach(function(z){ svg.appendChild(s('rect', {class:'zone', x:z.x, y:z.y, width:z.w, height:z.h, rx:18})); var t = s('text', {class:'zl', x:z.x + 14, y:z.y + 22}); t.textContent = z.label; svg.appendChild(t); });
  var lines = s('g', {}); svg.appendChild(lines);
  var pts = c.points.map(function(p){ var g = s('g', {}); var ci = s('circle', {class:'p', cx:p.x, cy:p.y, r:6}); var t = s('text', {x:p.x + 10, y:p.y + 4}); t.textContent = p.t; g.appendChild(ci); g.appendChild(t); svg.appendChild(g); return {p:p, c:ci}; });
  var qd = s('circle', {class:'q', cx:320, cy:190, r:9}); svg.appendChild(qd);
  var fb = fbEl();
  var chips = h('div', {class:'qs'});
  var seen = {};
  c.questions.forEach(function(q, i){
    chips.appendChild(h('button', {type:'button', class:'pill', 'aria-pressed':'false', onclick:function(){
      Array.prototype.forEach.call(chips.children, function(x, j){ x.setAttribute('aria-pressed', String(j === i)); });
      qd.setAttribute('cx', q.x); qd.setAttribute('cy', q.y);
      var near = pts.map(function(o){ return {o:o, d:Math.hypot(o.p.x - q.x, o.p.y - q.y)}; }).sort(function(a, b){ return a.d - b.d; }).slice(0, 2);
      while (lines.firstChild) lines.removeChild(lines.firstChild);
      pts.forEach(function(o){ o.c.setAttribute('class', 'p'); });
      near.forEach(function(n){ n.o.c.setAttribute('class', 'p hit'); lines.appendChild(s('line', {x1:q.x, y1:q.y, x2:n.o.p.x, y2:n.o.p.y})); });
      setFb(fb, 'ok', '<b>Найближче за змістом:</b> «' + near[0].o.p.t + '». ' + q.note);
      seen[i] = 1; if (Object.keys(seen).length === c.questions.length) done(c.id, 1, 1);
    }}, q.t));
  });
  root.appendChild(chips); root.appendChild(svg); root.appendChild(fb);
  return root;
};
/* conflict */
W.conflict = function(c){
  var root = h('div');
  var on = false;
  var sw = h('button', {type:'button', class:'switch', role:'switch', 'aria-checked':'false'}, h('span', {class:'knob', 'aria-hidden':'true'}), h('span', null, c.toggle));
  var body = h('div', {'aria-live':'polite'});
  function draw(){
    sw.setAttribute('aria-checked', String(on)); body.innerHTML = '';
    var docs = h('div', {class:'docs'});
    c.docs.concat(on ? [c.extra] : []).forEach(function(d, i){ docs.appendChild(h('div', {class:'doc' + (on && i === c.docs.length ? ' top' : '')}, h('b', null, d.name), h('span', null, d.text))); });
    body.appendChild(h('p', {class:'small muted'}, 'Джерела в базі:'));
    body.appendChild(docs);
    body.appendChild(h('p', {class:'q'}, c.q));
    body.appendChild(h('div', {class:'bubble ai'}, h('span', {class:'who'}, 'ШІ'), h('span', {html:on ? c.withA : c.withoutA})));
    if (on) { body.appendChild(h('div', {class:'fb bad', html:c.lesson})); done(c.id, 1, 1); }
  }
  sw.addEventListener('click', function(){ on = !on; draw(); });
  root.appendChild(sw); root.appendChild(body);
  draw();
  return root;
};
/* wizard */
W.wizard = function(c, api){
  var root = h('div');
  var path = [];
  function step(id){
    var n = c.nodes[id];
    var box = h('div', {class:'card', style:'margin-bottom:12px'});
    if (n.result) {
      box.className = 'card good';
      box.appendChild(h('h3', null, n.result));
      box.appendChild(h('p', {html:n.text, style:'margin:0'}));
      root.appendChild(box);
      root.appendChild(btn('Пройти ще раз', 'ghost small', api.reset));
      done(c.id, 1, 1);
      return;
    }
    box.appendChild(h('p', {class:'q'}, n.q));
    var row = h('div', {class:'row'});
    n.opts.forEach(function(o){ row.appendChild(h('button', {type:'button', class:'pill', onclick:function(){ Array.prototype.forEach.call(row.children, function(x){ x.disabled = true; }); this.setAttribute('aria-pressed', 'true'); step(o.next); }}, o.label)); });
    box.appendChild(row); root.appendChild(box);
  }
  step('start');
  return root;
};
/* fine-tune cost */
W.ftcost = function(c){
  var root = h('div');
  var steps = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];
  var ri = 3, months = 12, label = false;
  function slider(label, min, max, val, fn, f){ var o = h('output'); var i = h('input', {type:'range', min:String(min), max:String(max), step:'1', value:String(val), 'aria-label':label}); i.addEventListener('input', function(){ fn(+i.value); o.textContent = f(+i.value); draw(); done(c.id, 1, 1); }); o.textContent = f(val); root.appendChild(h('div', {class:'sl'}, h('span', null, label), i, o)); }
  slider('Запитів на місяць', 0, steps.length - 1, ri, function(v){ ri = v; }, function(v){ return fmt(steps[v]); });
  slider('Скільки місяців', 1, 24, months, function(v){ months = v; }, function(v){ return v + ' міс.'; });
  var cb = h('button', {type:'button', class:'switch', role:'switch', 'aria-checked':'false', onclick:function(){ label = !label; cb.setAttribute('aria-checked', String(label)); draw(); }}, h('span', {class:'knob', 'aria-hidden':'true'}), h('span', null, 'Врахувати підготовку 500 прикладів (≈17 год × $10)'));
  root.appendChild(cb);
  var res = h('div', {class:'res', 'aria-live':'polite'});
  var verdict = h('div', {class:'fb info'});
  function draw(){
    var R = steps[ri] * months, fixed = 50 + (label ? 167 : 0);
    var fs = R * .00075, ft = fixed + R * .000015, be = fixed / (.00075 - .000015);
    res.innerHTML = '';
    res.appendChild(h('div', {class:'card' + (fs <= ft ? ' win' : '')}, h('h3', null, 'Інструкція (промпт)'), h('div', {class:'v'}, money(fs)), h('p', {class:'small', style:'margin:6px 0 0'}, fmt(R) + ' запитів × $0,00075')));
    res.appendChild(h('div', {class:'card' + (ft < fs ? ' win' : '')}, h('h3', null, 'Курси (донавчання)'), h('div', {class:'v'}, money(ft)), h('p', {class:'small', style:'margin:6px 0 0'}, '$' + fixed + ' один раз + ' + fmt(R) + ' × $0,000015')));
    verdict.innerHTML = '<b>' + (ft < fs ? 'Донавчання вигідніше' : 'Інструкція вигідніша') + '.</b> Донавчання окуповується після ≈ ' + fmt(be) + ' запитів. У вас за період — ' + fmt(R) + '.';
  }
  root.appendChild(res); root.appendChild(verdict);
  root.appendChild(h('p', {class:'small muted'}, 'Умовні ціни з заняття: запит з довгою інструкцією — $0,00075, до донавченої моделі — $0,000015, донавчання — $50.'));
  draw();
  return root;
};


/* workbook: write-in */
function store(id){ S.txt = S.txt || {}; S.txt[id] = S.txt[id] || {}; return S.txt[id]; }
W.write = function(c){
  var root = h('div');
  var st = store(c.id);
  (c.fields || [{lines:4}]).forEach(function(f, i){
    var fid = c.id + '-' + i;
    if (f.label) root.appendChild(h('label', {class:'wl', for:fid}, f.label));
    var ta = h('textarea', {id:fid, rows:String(f.lines || 3), placeholder:f.ph || '', 'aria-label':f.label || 'Ваша відповідь'});
    ta.value = st[i] || '';
    ta.addEventListener('input', function(){ st[i] = ta.value; save(); if (ta.value.trim()) done(c.id, 1, 1); });
    root.appendChild(ta);
  });
  if (c.sample) {
    var smp = h('div', {class:'sample', hidden:true, html:c.sample});
    var b = btn(c.sampleLabel || 'Показати зразок', 'ghost small', function(){ smp.hidden = false; b.hidden = true; });
    root.appendChild(h('div', {class:'row', style:'margin-top:10px'}, b)); root.appendChild(smp);
  }
  return root;
};
/* workbook: fillable table */
W.filltable = function(c){
  var root = h('div');
  var st = store(c.id);
  var tbl = h('table', {class:'t ft'});
  var keys = [];
  var hr = h('tr', null, c.head.map(function(x){ return h('th', null, x); }));
  if (c.key) { var kh = h('th', {class:'keyc', hidden:true}, c.keyLabel || 'Правильна відповідь'); hr.appendChild(kh); keys.push(kh); }
  tbl.appendChild(hr);
  c.rows.forEach(function(r, ri){
    var tr = h('tr');
    r.forEach(function(cell, ci){
      if (cell === null) {
        var k = ri + ':' + ci;
        var ta = h('textarea', {rows:'2', 'aria-label':c.head[ci] + ', рядок ' + (ri + 1)});
        ta.value = st[k] || '';
        ta.addEventListener('input', function(){ st[k] = ta.value; save(); if (ta.value.trim()) done(c.id, 1, 1); });
        tr.appendChild(h('td', {class:'in'}, ta));
      } else tr.appendChild(h('td', {html:cell}));
    });
    if (c.key) { var kc = h('td', {class:'keyc', hidden:true, html:c.key[ri]}); tr.appendChild(kc); keys.push(kc); }
    tbl.appendChild(tr);
  });
  root.appendChild(h('div', {class:'tablewrap'}, tbl));
  if (c.key) {
    var b = btn(c.keyButton || 'Показати правильні відповіді', 'ghost small', function(){ var hid = keys[0].hidden; keys.forEach(function(x){ x.hidden = !hid; }); b.textContent = hid ? 'Сховати відповіді' : (c.keyButton || 'Показати правильні відповіді'); });
    root.appendChild(h('div', {class:'row', style:'margin-top:10px'}, b));
  }
  return root;
};
/* workbook: token counts */
W.tokcount = function(c){
  var root = h('div');
  var st = store(c.id);
  var fb = fbEl();
  var ins = c.labels.map(function(l, i){ var inp = h('input', {type:'text', inputmode:'numeric', 'aria-label':l}); inp.value = st[i] || ''; inp.addEventListener('input', function(){ st[i] = inp.value; save(); }); root.appendChild(h('div', {class:'num-in'}, h('span', {class:'wl', style:'min-width:220px'}, l), inp, h('span', null, 'токенів'))); return inp; });
  root.appendChild(h('div', {class:'row'}, btn('Порівняти', 'blue small', function(){
    var a = parseInt(ins[0].value, 10), b = parseInt(ins[1].value, 10);
    if (!a || !b) { setFb(fb, 'bad', 'Впишіть обидва числа з токенайзера.'); return; }
    var r = (a / b).toFixed(2).replace('.', ',');
    if (a > b) { setFb(fb, 'ok', 'Українське речення займає в ' + r + ' раза більше токенів, ніж англійське. ' + c.explain); done(c.id, 1, 1); }
    else setFb(fb, 'bad', 'Зазвичай українське речення займає більше токенів. Перевірте, чи вставили повне речення і чи не переплутали поля.');
  })));
  root.appendChild(fb);
  return root;
};

/* ---------------- views ---------------- */
var app, rail, mainEl, topbar, scrim;
/* Доступ до занять задається у файлі config.js (window.COURSE_CONFIG). */
var CFG = window.COURSE_CONFIG || {};
var PREVIEW = (function(){ try { return !!CFG.PREVIEW_PARAM && new URLSearchParams(location.search).has(CFG.PREVIEW_PARAM); } catch(e) { return false; } })();
function isOpen(n){ if (!C.lessons[n - 1]) return false; if (PREVIEW) return true; return !!(CFG.OPEN_LESSONS && CFG.OPEN_LESSONS[n] === true); }
function openNums(){ var r = []; for (var n = 1; n <= C.lessons.length; n++) if (isOpen(n)) r.push(n); return r; }
function getLesson(n){ return isOpen(n) ? C.lessons[n - 1] : null; }
function finalOpen(){ return !!C.final && (PREVIEW || CFG.OPEN_FINAL_TEST === true); }
function glossaryOpen(){ return !!C.glossary && (PREVIEW || CFG.OPEN_GLOSSARY !== false); }
function hiddenCount(){ var t = 0, total = Math.max(C.totalLessons || 0, C.lessons.length); for (var n = 1; n <= total; n++) if (!isOpen(n)) t++; return t; }
function logo(cls){ return h('img', {class:cls || 'logo', src:C.logo.light, alt:'Deutsche Tech Akademie'}); }
function scribble(){ var d = document.createElement('div'); d.innerHTML = C.scribble; return d.firstChild; }
function curRoute(){ return (location.hash || '#/').slice(2).split('/'); }
function pad(n){ return (n < 10 ? '0' : '') + n; }
function renderRail(){
  if (!rail) return;
  var r = curRoute();
  rail.innerHTML = '';
  rail.appendChild(h('a', {class:'brand', href:'#/', 'aria-label':'Зміст курсу'}, logo()));
  rail.appendChild(h('p', {class:'course-name'}, C.title));
  var nav = h('nav', {class:'nav', 'aria-label':'Матеріали курсу'});
  nav.appendChild(h('a', {href:'#/', class:'nav-t' + (!r[0] ? ' on' : '')}, h('span', {class:'num'}, '00'), h('span', null, 'Зміст курсу')));
  openNums().forEach(function(n){
    var L = C.lessons[n - 1], cur = (r[0] === 'lesson' || r[0] === 'book') && +r[1] === n;
    var pr = lessonProgress(L);
    var item = h('div', {class:'nav-l' + (cur ? ' on' : '')});
    item.appendChild(h('a', {class:'nav-t', href:'#/lesson/' + n + '/' + (S.seen['l' + n] || 1)}, h('span', {class:'num'}, pad(n)), h('span', null, L.title)));
    item.appendChild(h('div', {class:'nav-sub'},
      h('a', {href:'#/lesson/' + n + '/' + (S.seen['l' + n] || 1), class: cur && r[0] === 'lesson' ? 'act' : ''}, 'Презентація'),
      h('a', {href:'#/book/' + n, class: cur && r[0] === 'book' ? 'act' : ''}, 'Зошит' + (pr.d ? ' (' + pr.d + '/' + pr.t + ')' : ''))));
    nav.appendChild(item);
  });
  if (finalOpen()) nav.appendChild(h('a', {href:'#/final', class:'nav-t' + (r[0] === 'final' ? ' on' : '')}, h('span', {class:'num'}, '✓'), h('span', null, 'Підсумковий тест')));
  if (glossaryOpen()) nav.appendChild(h('a', {href:'#/glossary', class:'nav-t' + (r[0] === 'glossary' ? ' on' : '')}, h('span', {class:'num'}, 'Аа'), h('span', null, 'Словник термінів')));
  rail.appendChild(nav);
}
function closeMenu(){ if (!rail) return; rail.classList.remove('open'); if (scrim) { scrim.remove(); scrim = null; } }
function openMenu(){ rail.classList.add('open'); scrim = h('div', {class:'scrim', onclick:closeMenu}); document.body.appendChild(scrim); }

function showHome(){
  var st = h('div', {class:'stage'});
  var hero = h('section', {class:'hero'});
  hero.appendChild(h('h1', null, C.heroTitle));
  hero.appendChild(scribble());
  hero.appendChild(h('p', {html:C.heroText}));
  if (PREVIEW) hero.appendChild(h('div', {class:'callout warn'}, 'Режим перегляду: видно всі заняття, зокрема ще не відкриті для студентів.'));
  st.appendChild(hero);
  var list = h('div', {class:'lessons'});
  openNums().forEach(function(n){
    var L = C.lessons[n - 1], p = lessonProgress(L);
    list.appendChild(h('div', {class:'lcard'},
      h('span', {class:'n'}, pad(n)),
      h('div', null, h('h3', null, h('a', {href:'#/lesson/' + n + '/1'}, L.title)), h('p', null, L.idea)),
      h('div', {class:'lact'}, h('a', {class:'btn small', href:'#/lesson/' + n + '/1'}, 'Презентація'), h('a', {class:'btn ghost small', href:'#/book/' + n}, 'Робочий зошит'),
        h('span', {class:'small muted'}, L.slides.length + ' слайдів, ' + p.t + ' завдань' + (p.d ? '; виконано ' + p.d : '')))));
  });
  if (!openNums().length) list.appendChild(h('p', {class:'upcoming'}, 'Перше заняття з’явиться тут найближчим часом.'));
  else if (hiddenCount()) list.appendChild(h('p', {class:'upcoming'}, 'Наступні заняття з’являтимуться тут перед кожним уроком.'));
  st.appendChild(list);
  var ex = h('div', {class:'extras'});
  if (finalOpen()) ex.appendChild(h('a', {class:'extra', href:'#/final'}, h('h3', null, 'Підсумковий тест'), h('p', null, S.act['final'] ? 'Ваш результат: ' + S.act['final'].s + ' з ' + S.act['final'].m + '.' : '10 питань за всіма п’ятьма заняттями.')));
  if (glossaryOpen()) ex.appendChild(h('a', {class:'extra', href:'#/glossary'}, h('h3', null, 'Словник термінів'), h('p', null, 'Усі терміни курсу — одним реченням.')));
  st.appendChild(ex);
  if (C.services) st.appendChild(h('section', {class:'services', html:C.services}));
  return st;
}
function lessonHead(n, mode){
  var L = C.lessons[n - 1];
  return h('div', {class:'lhead'},
    h('div', null, h('div', {class:'ln'}, 'Заняття ' + pad(n)), h('p', {class:'lt'}, L.title)),
    h('div', {class:'seg', 'aria-label':'Матеріали заняття'},
      h('a', {href:'#/lesson/' + n + '/' + (S.seen['l' + n] || 1), 'aria-current': mode === 'lesson' ? 'page' : null}, 'Презентація'),
      h('a', {href:'#/book/' + n, 'aria-current': mode === 'book' ? 'page' : null}, 'Робочий зошит')));
}
function buildSlide(n, i){
  var L = C.lessons[n - 1], sl = L.slides[i - 1], total = L.slides.length;
  var card = h('article', {class:'s16' + (sl.title ? ' s-title' : ''), 'aria-label':'Слайд ' + i + ' з ' + total});
  var body = h('div', {class:'s-body'});
  if (sl.title) {
    body.appendChild(logo('s-logo'));
    body.appendChild(h('p', {class:'s-num'}, 'Заняття ' + n));
    body.appendChild(h('h1', {id:'slide-title', html:sl.t}));
    body.appendChild(scribble());
    if (sl.sub) body.appendChild(h('p', {class:'s-sub', html:sl.sub}));
  } else {
    body.appendChild(h('div', {class:'s-head'}, h('h2', {id:'slide-title', html:sl.t}), logo('s-hlogo')));
  }
  if (sl.h) body.appendChild(h('div', {class:'s-content', html:sl.h}));
  if (sl.demo) body.appendChild(mount(sl.demo));
  card.appendChild(body);
  if (!sl.title) card.appendChild(h('div', {class:'sfoot'}, h('span', null, 'Заняття ' + n + '. ' + L.title), h('span', {class:'sfn'}, i + ' / ' + total)));
  return card;
}
function fillDeck(wrap, n, i){
  var L = C.lessons[n - 1], total = L.slides.length;
  S.seen['l' + n] = i; S.last = '#/lesson/' + n + '/' + i; save();
  wrap.innerHTML = '';
  wrap.appendChild(buildSlide(n, i));
  var prev = i > 1 ? h('a', {class:'btn ghost', href:'#/lesson/' + n + '/' + (i - 1)}, 'Назад') : h('a', {class:'btn ghost', href:'#/'}, 'Зміст');
  var next = i < total ? h('a', {class:'btn', href:'#/lesson/' + n + '/' + (i + 1)}, 'Далі') : h('a', {class:'btn blue', href:'#/book/' + n}, 'Відкрити робочий зошит');
  var dots = h('div', {class:'sdots', 'aria-label':'Слайди'});
  L.slides.forEach(function(_, k){ dots.appendChild(h('a', {href:'#/lesson/' + n + '/' + (k + 1), class: k + 1 === i ? 'cur' : (k + 1 < i ? 'seen' : ''), 'aria-label':'Слайд ' + (k + 1), 'aria-current': k + 1 === i ? 'step' : null})); });
  var mid = h('div', {class:'mid'}, dots);
  if (document.fullscreenEnabled) mid.appendChild(btn(document.fullscreenElement ? 'Вийти з повного екрана' : 'На весь екран', 'ghost small', function(){ try { if (document.fullscreenElement) document.exitFullscreen(); else wrap.requestFullscreen(); } catch(e) {} }));
  wrap.appendChild(h('div', {class:'navbar'}, prev, mid, next));
}
function showSlides(n, i){
  var L = getLesson(n);
  if (!L) { location.hash = '#/'; return h('div'); }
  i = Math.min(Math.max(1, i || 1), L.slides.length);
  var st = h('div', {class:'stage wide'});
  st.appendChild(lessonHead(n, 'lesson'));
  var wrap = h('div', {class:'deckwrap', 'data-lesson':String(n)});
  fillDeck(wrap, n, i);
  st.appendChild(wrap);
  return st;
}
function studentFields(){
  var who = h('div', {class:'who'});
  [['name','Ім’я та прізвище'],['group','Група'],['date','Дата']].forEach(function(f){
    var inp = h('input', {type:'text', 'aria-label':f[1]});
    inp.value = S.student[f[0]] || '';
    inp.addEventListener('input', function(){ S.student[f[0]] = inp.value; save(); });
    who.appendChild(h('label', null, h('span', null, f[1]), inp));
  });
  return who;
}
function showBook(n){
  var L = getLesson(n);
  if (!L) { location.hash = '#/'; return h('div'); }
  S.last = '#/book/' + n; save();
  var st = h('div', {class:'stage'});
  st.appendChild(lessonHead(n, 'book'));
  var page = h('article', {class:'book'});
  page.appendChild(h('header', {class:'bhead'}, logo('blogo'), h('div', null, h('p', {class:'btitle'}, 'Робочий зошит'), h('h1', {id:'slide-title'}, 'Заняття ' + n + '. ' + L.title))));
  page.appendChild(studentFields());
  if (L.notes) page.appendChild(h('section', {class:'notes'}, h('h2', null, 'Коротко про головне'), h('div', {html:L.notes})));
  var k = 0;
  L.book.forEach(function(t){
    var sec = h('section', {class:'task' + (t.hw ? ' hw' : '')});
    sec.appendChild(h('h2', null, t.hw ? t.t : 'Завдання ' + (++k) + '. ' + t.t));
    if (t.h) sec.appendChild(h('div', {class:'task-text', html:t.h}));
    taskWidgets(t).forEach(function(w){ sec.appendChild(mount(w)); });
    page.appendChild(sec);
  });
  var pr = lessonProgress(L);
  page.appendChild(h('div', {class:'bfoot noprint'}, h('span', {class:'small muted'}, 'Виконано завдань: ' + pr.d + ' з ' + pr.t + '. Відповіді зберігаються в цьому браузері.'), btn('Друкувати зошит', 'ghost small', function(){ window.print(); })));
  st.appendChild(page);
  var prev = h('a', {class:'btn ghost', href:'#/lesson/' + n + '/' + (S.seen['l' + n] || 1)}, 'До презентації');
  var nextN = openNums().filter(function(k){ return k > n; })[0];
  var next = nextN ? h('a', {class:'btn', href:'#/lesson/' + nextN + '/1'}, 'Заняття ' + nextN) : (finalOpen() && n === C.lessons.length ? h('a', {class:'btn blue', href:'#/final'}, 'Підсумковий тест') : h('a', {class:'btn', href:'#/'}, 'Зміст курсу'));
  st.appendChild(h('div', {class:'navbar noprint'}, prev, h('span'), next));
  return st;
}
function showFinal(){
  var st = h('div', {class:'stage'});
  var page = h('article', {class:'book'});
  page.appendChild(h('header', {class:'bhead'}, logo('blogo'), h('div', null, h('p', {class:'btitle'}, 'Підсумковий тест'), h('h1', {id:'slide-title'}, 'LLM та AI-інструменти для аналітика'))));
  page.appendChild(studentFields());
  page.appendChild(h('p', null, '10 питань за всіма п’ятьма заняттями. Після кожної відповіді з’являється пояснення, наприкінці — кількість балів.'));
  page.appendChild(mount({type:'quiz', id:'final', questions:C.final, verdict:function(r){ var b = r >= 9 ? 20 : r >= 7 ? 15 : r >= 5 ? 10 : 0; return b ? 'Бали за тест: ' + b + ' з 20.' : 'Менше 5 правильних відповідей: перегляньте матеріали і пройдіть тест ще раз.'; }}));
  st.appendChild(page);
  st.appendChild(h('div', {class:'navbar noprint'}, h('a', {class:'btn ghost', href:'#/'}, 'Зміст'), h('span'), btn('Друкувати', 'ghost', function(){ window.print(); })));
  return st;
}
function showGlossary(){
  var st = h('div', {class:'stage'});
  var page = h('article', {class:'book'});
  page.appendChild(h('h1', {id:'slide-title', class:'gl-title'}, 'Словник термінів'));
  var inp = h('input', {type:'search', class:'gl-search', placeholder:'Знайти термін', 'aria-label':'Пошук терміна'});
  var dl = h('dl', {class:'gl'});
  function draw(){
    var q = inp.value.trim().toLowerCase(); dl.innerHTML = '';
    C.glossary.filter(function(g){ return !q || (g[0] + ' ' + g[1]).toLowerCase().indexOf(q) >= 0; }).forEach(function(g){ dl.appendChild(h('div', null, h('dt', null, g[0]), h('dd', null, g[1], g[2] ? h('span', null, ' ', h('a', {href:g[2], target:'_blank', rel:'noopener noreferrer'}, g[3] || 'Відкрити')) : null))); });
    if (!dl.children.length) dl.appendChild(h('div', null, h('dt', null, 'Нічого не знайдено'), h('dd', null, 'Спробуйте інше слово або очистіть поле пошуку.')));
  }
  inp.addEventListener('input', draw);
  page.appendChild(inp); page.appendChild(dl); draw();
  st.appendChild(page);
  return st;
}
function route(){
  var r = curRoute();
  if (r[0] === 'lesson') {
    var wrap = mainEl.querySelector('.deckwrap[data-lesson="' + (+r[1]) + '"]');
    var L = getLesson(+r[1]);
    if (wrap && L) {
      fillDeck(wrap, +r[1], Math.min(Math.max(1, +r[2] || 1), L.slides.length));
      renderRail(); closeMenu();
      if (!document.fullscreenElement) window.scrollTo(0, 0); else wrap.scrollTop = 0;
      return;
    }
  }
  var view;
  if (((r[0] === 'lesson' || r[0] === 'book') && !getLesson(+r[1])) || (r[0] === 'final' && !finalOpen()) || (r[0] === 'glossary' && !glossaryOpen())) { if (location.hash !== '#/') { location.replace('#/'); return; } r = ['']; }
  if (r[0] === 'lesson') view = showSlides(+r[1], +r[2]);
  else if (r[0] === 'book') view = showBook(+r[1]);
  else if (r[0] === 'final') view = showFinal();
  else if (r[0] === 'glossary') view = showGlossary();
  else view = showHome();
  mainEl.innerHTML = ''; mainEl.appendChild(view);
  renderRail(); closeMenu();
  window.scrollTo(0, 0);
  var t = mainEl.querySelector('#slide-title, h1'); if (t) { t.setAttribute('tabindex', '-1'); try { t.focus({preventScroll:true}); } catch(e) {} }
}
function init(){
  document.documentElement.removeAttribute('data-theme');
  app = h('div', {class:'app'});
  rail = h('aside', {class:'rail noprint', 'aria-label':'Навігація курсу'});
  mainEl = h('main', {id:'main'});
  topbar = h('div', {class:'topbar noprint'}, h('a', {href:'#/', 'aria-label':'Зміст курсу'}, logo()), h('button', {type:'button', 'aria-label':'Відкрити меню', onclick:openMenu}, 'Меню'));
  app.appendChild(rail); app.appendChild(h('div', {class:'col'}, topbar, mainEl));
  document.body.appendChild(app);
  window.addEventListener('hashchange', route);
  document.addEventListener('fullscreenchange', function(){ var r = curRoute(); var wrap = mainEl.querySelector('.deckwrap'); if (wrap && r[0] === 'lesson') fillDeck(wrap, +r[1], +r[2] || 1); });
  document.addEventListener('keydown', function(e){
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'Escape') closeMenu();
    var r = curRoute(); if (r[0] !== 'lesson') return;
    var n = +r[1], i = +r[2] || 1, L = getLesson(n); if (!L) return;
    if ((e.key === 'ArrowRight' || e.key === 'PageDown') && i < L.slides.length) { e.preventDefault(); location.hash = '#/lesson/' + n + '/' + (i + 1); }
    if ((e.key === 'ArrowLeft' || e.key === 'PageUp') && i > 1) { e.preventDefault(); location.hash = '#/lesson/' + n + '/' + (i - 1); }
  });
  route();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
window.__course = {S:S, W:W, route:route};
})();
