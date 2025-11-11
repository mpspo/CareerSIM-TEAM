const api = (path, opts = {}) => fetch('/api' + path, opts).then(r => r.json());

const $ = id => document.getElementById(id);

let token = localStorage.getItem('cs_token');

function show(id){['auth','lobby','interview'].forEach(i=>$(i).classList.add('hidden')); $(id).classList.remove('hidden');}

document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    // try to restore minimal state (we didn't persist username/study/target reliably)
    show('lobby');
  } else show('auth');

  $('btn-register').onclick = async () => {
    const username = $('reg-username').value.trim();
    const password = $('reg-password').value;
    const study = $('reg-study').value.trim();
    const target = $('reg-target').value.trim();
    const res = await api('/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password,study,target})});
    if (res.ok) { $('msg').textContent='Registriert. Bitte einloggen.'; } else { $('msg').textContent = res.error || 'Fehler'; }
  };

  $('btn-login').onclick = async () => {
    const username = $('login-username').value.trim();
    const password = $('login-password').value;
    const res = await api('/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
    if (res.token) {
      token = res.token; localStorage.setItem('cs_token', token);
      $('user-name').textContent = res.username;
      $('user-study').textContent = res.study || '—';
      $('user-target').textContent = res.target || '—';
      show('lobby');
    } else {
      $('msg').textContent = res.error || 'Login fehlgeschlagen';
    }
  };

  $('btn-logout').onclick = () => { localStorage.removeItem('cs_token'); token = null; show('auth'); };

  $('btn-start').onclick = async () => {
    if (!token) return alert('Bitte einloggen');
    const res = await api('/interview/start', {method:'POST',headers:{'Content-Type':'application/json','x-auth-token':token},body:JSON.stringify({})});
    if (res.interviewId) {
      window.__interview = { id: res.interviewId };
      $('question-box').textContent = res.question || 'Keine Frage';
      $('feedback').textContent = '';
      show('interview');
    } else {
      alert(res.error || 'Fehler');
    }
  };

  // --- Speech recognition (mic) and TTS ---
  let recognition = null;
  let recognizing = false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (ev) => {
      const text = Array.from(ev.results).map(r => r[0].transcript).join('\n');
      $('transcript').textContent = text;
      $('answer').value = text;
      // focus the textarea so user can edit
      $('answer').focus();
    };
    recognition.onerror = (ev) => {
      console.warn('SpeechRecognition error', ev.error);
      $('transcript').textContent = 'Spracherkennung nicht verfügbar.';
      recognizing = false;
      $('btn-mic').classList.remove('on');
      $('btn-mic').textContent = '🎤 Mikro an';
    };
    recognition.onend = () => {
      recognizing = false;
      $('btn-mic').classList.remove('on');
      $('btn-mic').textContent = '🎤 Mikro an';
    };
  } else {
    $('transcript').textContent = 'Keine Spracherkennung im Browser.';
    $('btn-mic').disabled = true;
  }

  $('btn-mic').onclick = () => {
    if (!recognition) return;
    if (!recognizing) {
      try {
        recognition.start();
        recognizing = true;
        $('btn-mic').classList.add('on');
        $('btn-mic').textContent = '🔴 Mikro aus';
        $('transcript').textContent = 'Zuhören...';
      } catch (err) {
        console.warn('Start error', err);
      }
    } else {
      recognition.stop();
      recognizing = false;
      $('btn-mic').classList.remove('on');
      $('btn-mic').textContent = '🎤 Mikro an';
      $('transcript').textContent = '—';
    }
  };

  function speakText(text) {
    if (!text) return;
    if ('speechSynthesis' in window) {
      const ut = new SpeechSynthesisUtterance(text);
      ut.lang = 'de-DE';
      ut.rate = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(ut);
    }
  }

  $('btn-send').onclick = async () => {
    const answer = $('answer').value.trim();
    if (!window.__interview || !window.__interview.id) return;
    const res = await api('/interview/respond', {method:'POST',headers:{'Content-Type':'application/json','x-auth-token':token},body:JSON.stringify({interviewId: window.__interview.id, answer})});
    $('feedback').textContent = res.feedback || '';
    // speak feedback if available
    if (res.feedback) speakText(res.feedback);
    if (res.done) {
      $('question-box').textContent = 'Interview beendet.';
      $('answer').value = '';
    } else {
      $('question-box').textContent = res.nextQuestion || '—';
      $('answer').value = '';
    }
  };

  $('btn-end').onclick = () => { show('lobby'); };

  // Handle "Start now" CTA button (scroll to auth)
  const ctaRegisterBtn = document.getElementById('cta-register');
  if (ctaRegisterBtn) {
    ctaRegisterBtn.onclick = () => {
      const authPanel = document.getElementById('auth-panel');
      if (authPanel) authPanel.scrollIntoView({ behavior: 'smooth' });
    };
  }

  // Handle "How it works" CTA button (redirect)
  const ctaDemoBtn = document.getElementById('cta-demo');
  if (ctaDemoBtn) {
    ctaDemoBtn.onclick = () => {
      window.location.href = '/how-it-works.html';
    };
  }

  // Handle "Get started" button from navbar (on homepage only)
  const navStartBtn = document.getElementById('nav-start');
  if (navStartBtn) {
    navStartBtn.onclick = (e) => {
      e.preventDefault();
      if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        // Scroll to auth panel on homepage
        const authPanel = document.getElementById('auth-panel');
        if (authPanel) authPanel.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Redirect to homepage if on other pages
        window.location.href = '/';
      }
    };
  }
});
