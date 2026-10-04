/* ============================================================
   EMAIL SETUP (5 minutes):
   1. Go to https://formspree.io and sign up with aasancodeinfotech@gmail.com
   2. Create a new form -> copy its ID (looks like "xabcdefg")
   3. Paste the ID below between the quotes, e.g. "xabcdefg"
   That's it — all form submissions will arrive in your Gmail.
   ============================================================ */
var MAIL_ENDPOINT = "php/send-mail.php";  // PHP hosting (cPanel etc) — works as-is after upload
var FORMSPREE_ID  = "";                    // OR use Formspree instead: paste ID here & set MAIL_ENDPOINT = ""

function validPhone(v){
  var t = (v || '').trim();
  if(t === '') return true; // optional — empty is fine
  return /^[0-9]{10}$/.test(t); // if filled: exactly 10 digits
}

function sendEnquiry(name, email, message, interest, phone){
  var payload = JSON.stringify({name: name, email: email, phone: phone || '', message: message, interest: interest || ''});
  var url = MAIL_ENDPOINT ? MAIL_ENDPOINT : (FORMSPREE_ID ? 'https://formspree.io/f/' + FORMSPREE_ID : '');
  if(!url) return;
  fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
    body: payload
  }).catch(function(e){ console.error('Form send failed:', e); });
}

/* AasanCode Solutions — shared scripts */

function toggleNav(){
  document.getElementById('navLinks').classList.toggle('open');
}



/* ---- phone inputs: digits only ---- */
document.addEventListener('DOMContentLoaded', function(){
  ['phone','cphone'].forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    el.placeholder = '9876543210';
    el.setAttribute('maxlength','10');
    el.addEventListener('input', function(){
      var v = el.value.replace(/[^0-9]/g, '').slice(0, 10);
      if(el.value !== v) el.value = v;
    });
  });
});

/* ---- simple math captcha ---- */
var _cap = {m:0, p:0};
function newCaptcha(scope){
  var a = 2 + Math.floor(Math.random()*8);
  var b = 2 + Math.floor(Math.random()*8);
  _cap[scope] = a + b;
  var el = document.getElementById(scope === 'p' ? 'pcapQ' : 'capQ');
  if(el) el.textContent = a + ' + ' + b;
  var inp = document.getElementById(scope === 'p' ? 'ccaptcha' : 'captcha');
  if(inp) inp.value = '';
}
function checkCaptcha(inputId, scope){
  var inp = document.getElementById(inputId);
  if(!inp) return true;
  var ok = parseInt(inp.value.trim(), 10) === _cap[scope];
  if(!ok) newCaptcha(scope);
  return ok;
}

var modal = document.getElementById('contactModal');

function openModal(){
  if(!modal) return;
  modal.classList.add('open');
  var f = document.getElementById('formView');
  var s = document.getElementById('successView');
  if(f) f.style.display = 'block';
  if(s) s.style.display = 'none';
  newCaptcha('m');
  var n = document.getElementById('name');
  if(n) n.focus();
  document.getElementById('navLinks').classList.remove('open');
}
function closeModal(){ if(modal) modal.classList.remove('open'); }

if(modal){
  // Note: clicking outside no longer closes the modal (prevents losing typed details)
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });
}

function submitForm(){
  var name = document.getElementById('name');
  var email = document.getElementById('email');
  var msg = document.getElementById('message');
  var ok = true;

  ok = validate('fName', name.value.trim().length > 1) && ok;
  ok = validate('fEmail', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
  var phone = document.getElementById('phone');
  ok = validate('fPhone', validPhone(phone.value)) && ok;
  ok = validate('fMsg', msg.value.trim().length > 5) && ok;
  ok = validate('fCap', checkCaptcha('captcha','m')) && ok;
  if(!ok) return;

  /* -----------------------------------------------------------
     STATIC SITE NOTE:
     This demo shows a success state locally. To receive real
     emails, connect a form service, e.g. Formspree:

     fetch('https://formspree.io/f/YOUR_FORM_ID', {
       method: 'POST',
       headers: {'Content-Type':'application/json'},
       body: JSON.stringify({
         name: name.value, email: email.value, message: msg.value
       })
     });
     ----------------------------------------------------------- */

  sendEnquiry(name.value, email.value, msg.value, 'Quick enquiry (modal)', phone.value);
  document.getElementById('formView').style.display = 'none';
  document.getElementById('successView').style.display = 'block';
  name.value = ''; email.value = ''; msg.value = ''; phone.value = '';
}

function validate(fieldId, condition){
  var f = document.getElementById(fieldId);
  if(f) f.classList.toggle('invalid', !condition);
  return condition;
}

/* ---- reveal on scroll ---- */
(function(){
  var els = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){ els.forEach(function(e){e.classList.add('visible');}); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('visible'); io.unobserve(en.target); }
    });
  },{threshold:.12});
  els.forEach(function(e){ io.observe(e); });
})();

/* ---- animated stat counters ---- */
(function(){
  var nums = document.querySelectorAll('.num[data-target]');
  if(!nums.length) return;
  function animate(el){
    var target = parseInt(el.getAttribute('data-target'),10);
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null, dur = 1400;
    function stepFn(ts){
      if(!start) start = ts;
      var p = Math.min((ts-start)/dur,1);
      var eased = 1 - Math.pow(1-p,3);
      el.childNodes[0].nodeValue = Math.round(eased*target);
      if(p<1) requestAnimationFrame(stepFn);
    }
    requestAnimationFrame(stepFn);
  }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ animate(en.target); io.unobserve(en.target); }
      });
    },{threshold:.5});
    nums.forEach(function(n){ io.observe(n); });
  } else { nums.forEach(animate); }
})();

/* ---- scroll progress bar ---- */
(function(){
  var bar = document.getElementById('scrollbar');
  if(!bar) return;
  function upd(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', upd, {passive:true});
  upd();
})();
