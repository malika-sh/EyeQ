(function () {
  const t = document.createElement('link').relList;
  if (t && t.supports && t.supports('modulepreload')) return;
  for (const n of document.querySelectorAll('link[rel="modulepreload"]')) r(n);
  new MutationObserver((n) => {
    for (const c of n)
      if (c.type === 'childList')
        for (const a of c.addedNodes)
          a.tagName === 'LINK' && a.rel === 'modulepreload' && r(a);
  }).observe(document, { childList: !0, subtree: !0 });
  function o(n) {
    const c = {};
    return (
      n.integrity && (c.integrity = n.integrity),
      n.referrerPolicy && (c.referrerPolicy = n.referrerPolicy),
      n.crossOrigin === 'use-credentials'
        ? (c.credentials = 'include')
        : n.crossOrigin === 'anonymous'
        ? (c.credentials = 'omit')
        : (c.credentials = 'same-origin'),
      c
    );
  }
  function r(n) {
    if (n.ep) return;
    n.ep = !0;
    const c = o(n);
    fetch(n.href, c);
  }
})();
const i = document.getElementById('fileInput'),
  d = document.getElementById('uploadArea'),
  h = document.getElementById('uploadContent'),
  P = document.getElementById('imagePreview'),
  A = document.getElementById('previewImage'),
  G = document.getElementById('selectButton'),
  V = document.getElementById('clearButton'),
  $ = document.getElementById('predictSection'),
  s = document.getElementById('predictButton'),
  g = document.getElementById('resultsSection'),
  f = document.getElementById('successMessage'),
  z = document.getElementById('successText'),
  H = document.getElementById('drStatus'),
  U = document.getElementById('drConfidence'),
  J = document.getElementById('drConfidenceBar'),
  K = document.getElementById('drSummary'),
  _ = document.getElementById('drGradcam'),
  v = document.getElementById('glaucomaStatus'),
  E = document.getElementById('glaucomaConfidence'),
  I = document.getElementById('glaucomaConfidenceBar'),
  B = document.getElementById('glaucomaSummary'),
  k = document.getElementById('glaucomaGradcam'),
  p = document.getElementById('drFeedbackToggle'),
  O = document.getElementById('drFeedbackForm');
document.getElementById('drCorrectLabel');
const Q = document.getElementById('drSubmitFeedback'),
  b = document.getElementById('glaucomaFeedbackToggle'),
  D = document.getElementById('glaucomaFeedbackForm');
document.getElementById('glaucomaCorrectLabel');
const W = document.getElementById('glaucomaSubmitFeedback');
let l = null,
  M = !1;
document.addEventListener('DOMContentLoaded', function () {
  X();
});
function X() {
  i.addEventListener('change', Y),
    G.addEventListener('click', () => i.click()),
    V.addEventListener('click', j),
    d.addEventListener('dragover', Z),
    d.addEventListener('dragleave', ee),
    d.addEventListener('drop', te),
    d.addEventListener('click', ne),
    s.addEventListener('click', oe),
    p.addEventListener('click', () => C('dr')),
    b.addEventListener('click', () => C('glaucoma')),
    F('dr'),
    F('glaucoma'),
    Q.addEventListener('click', () => x('dr')),
    W.addEventListener('click', () => x('glaucoma'));
}
function Y(e) {
  const t = e.target.files[0];
  t && q(t) && R(t);
}
function Z(e) {
  e.preventDefault(), d.classList.add('dragover');
}
function ee(e) {
  e.preventDefault(), d.classList.remove('dragover');
}
function te(e) {
  e.preventDefault(), d.classList.remove('dragover');
  const t = e.dataTransfer.files[0];
  t && q(t) && R(t);
}
function ne(e) {
  (e.target === d || e.target === h) && i.click();
}
function q(e) {
  return ['image/jpeg', 'image/jpg', 'image/png'].includes(e.type);
}
function R(e) {
  l = e;
  const t = new FileReader();
  (t.onload = function (o) {
    (A.src = o.target.result),
      h.classList.add('hidden'),
      P.classList.remove('hidden'),
      $.classList.remove('hidden'),
      g.classList.add('hidden');
  }),
    t.readAsDataURL(e);
}
function j() {
  (l = null),
    (i.value = ''),
    h.classList.remove('hidden'),
    P.classList.add('hidden'),
    $.classList.add('hidden'),
    g.classList.add('hidden'),
    (A.src = ''),
    re();
}
async function oe() {
  if (!l || M) return;
  w(!0);
  const e = new FormData();
  e.append('image', l);
  try {
    const t = await fetch('/predict', { method: 'POST', body: e });
    if (!t.ok) throw new Error('Prediction request failed.');
    const o = await t.json();
    ce(o),
      g.classList.remove('hidden'),
      g.scrollIntoView({ behavior: 'smooth' }),
      S('dr', 'recentDrFeedback'),
      S('glaucoma', 'recentGlaucomaFeedback');
  } catch (t) {
    console.error('Prediction error:', t),
      u('Prediction failed. Please try again.');
  } finally {
    w(!1);
  }
}
async function S(e, t) {
  try {
    const r = await (await fetch(`/feedbacks/${e}`)).json(),
      n = document.getElementById(t);
    if (((n.innerHTML = ''), r.length === 0)) {
      n.innerHTML = '<p>No feedback yet.</p>';
      return;
    }
    r.forEach(([c, a, m]) => {
      const L = document.createElement('p');
      (L.textContent = `🕒 ${c} - ✅ ${a} ${m ? `→ ${m}` : ''}`),
        n.appendChild(L);
    });
  } catch (o) {
    console.error('Failed to load feedbacks:', o);
  }
}
function w(e) {
  (M = e),
    (s.disabled = e),
    e
      ? (s.classList.add('loading'),
        (s.querySelector('.predict-text').textContent = 'Analyzing...'))
      : (s.classList.remove('loading'),
        (s.querySelector('.predict-text').textContent = 'Predict'));
}
function ce(e) {
  (H.textContent = e.dr.prediction),
    (U.textContent = `${e.dr.confidence}%`),
    (_.src = e.dr.heatmap),
    (K.textContent =
      e.dr.summary || 'This prediction was made using AI algorithms.'),
    (J.style.width = `${e.dr.confidence}%`),
    v && (v.textContent = e.glaucoma.prediction),
    E && (E.textContent = `${e.glaucoma.confidence}%`),
    k && e.glaucoma.heatmap && (k.src = e.glaucoma.heatmap),
    B &&
      (B.textContent =
        e.glaucoma.summary || 'AI-assisted analysis of optic nerve region.'),
    I && (I.style.width = `${e.glaucoma.confidence}%`);
}
function C(e) {
  const t = e === 'dr' ? p : b,
    o = e === 'dr' ? O : D;
  !o.classList.contains('hidden')
    ? (o.classList.add('hidden'), t.classList.remove('active'))
    : (o.classList.remove('hidden'), t.classList.add('active'));
}
function F(e) {
  const t = document.querySelectorAll(`input[name="${e}-correct"]`),
    o = document.getElementById(`${e}CorrectLabel`);
  t.forEach((r) => {
    r.addEventListener('change', function () {
      this.value === 'no'
        ? o.classList.remove('hidden')
        : o.classList.add('hidden');
    });
  });
}
async function x(e) {
  const t = document.querySelectorAll(`input[name="${e}-correct"]`),
    o = Array.from(t).find((a) => a.checked);
  if (!o) {
    u('Please select whether the prediction was correct.');
    return;
  }
  const r = o.value === 'yes';
  let n = null;
  if (!r && ((n = document.getElementById(`${e}ActualLabel`).value), !n)) {
    u('Please select the correct label.');
    return;
  }
  const c = {
    disease: e === 'dr' ? 'Diabetic Retinopathy' : 'Glaucoma',
    correct: o.value,
    corrected_label: n,
  };
  try {
    const a = await fetch('/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    });
    if (!a.ok) throw new Error('Server error');
    const m = await a.json();
    ae(m.message), y(e);
  } catch (a) {
    console.error('Feedback error:', a),
      u('Failed to submit feedback. Try again.');
  }
}
function re() {
  y('dr'), y('glaucoma');
}
function y(e) {
  const t = document.querySelectorAll(`input[name="${e}-correct"]`),
    o = document.getElementById(`${e}CorrectLabel`),
    r = document.getElementById(`${e}ActualLabel`);
  t.forEach((a) => {
    a.checked = a.value === 'yes';
  }),
    o.classList.add('hidden'),
    (r.value = '');
  const n = e === 'dr' ? O : D,
    c = e === 'dr' ? p : b;
  n.classList.add('hidden'), c.classList.remove('active');
}
function ae(e) {
  (z.textContent = e),
    f.classList.remove('hidden'),
    setTimeout(() => {
      f.classList.add('hidden');
    }, 3e3),
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function u(e) {
  let t = document.getElementById('errorMessage');
  if (!t) {
    (t = document.createElement('div')),
      (t.id = 'errorMessage'),
      (t.className = 'error-message hidden'),
      (t.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span id="errorText"></span>
        `);
    const r = document.createElement('style');
    (r.textContent = `
            .error-message {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 1rem;
                border-radius: 0.5rem;
                margin-bottom: 1.5rem;
                animation: slideIn 0.3s ease-out;
            }
        `),
      document.head.appendChild(r),
      f.parentNode.insertBefore(t, f.nextSibling);
  }
  const o = document.getElementById('errorText');
  (o.textContent = e),
    t.classList.remove('hidden'),
    setTimeout(() => {
      t.classList.add('hidden');
    }, 3e3),
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.addEventListener('keydown', function (e) {
  e.key === 'Enter' && e.target === d && i.click(),
    e.key === 'Escape' && l && j();
});
const N = document.createElement('style');
N.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
`;
document.head.appendChild(N);
function T() {
  const e = document.querySelectorAll('img[data-src]'),
    t = new IntersectionObserver((o, r) => {
      o.forEach((n) => {
        if (n.isIntersecting) {
          const c = n.target;
          (c.src = c.dataset.src),
            c.removeAttribute('data-src'),
            t.unobserve(c);
        }
      });
    });
  e.forEach((o) => t.observe(o));
}
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', T)
  : T();
