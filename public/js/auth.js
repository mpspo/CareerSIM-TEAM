// CareerSIM Authentication Helper
// Include this script in all protected pages: <script src="/js/auth.js"></script>

const SUPABASE_URL = 'https://guuywztafdxfqupmqmmq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dXl3enRhZmR4ZnF1cG1xbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTA5NjIsImV4cCI6MjA3ODg4Njk2Mn0.FvfJPUpaxCHbhirhpO5etr6At4esxLLvVJSsoe_e6pQ';

// Global Supabase client
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global currentUser variable
window.currentUser = null;

// Check if user is authenticated
async function checkAuthStatus() {
  const { data: { session }, error } = await window.supabaseClient.auth.getSession();
  
  if (session) {
    window.currentUser = session.user;
    localStorage.setItem('userId', session.user.id);
    localStorage.setItem('userEmail', session.user.email);
    return { isAuthenticated: true, user: session.user };
  }
  
  return { isAuthenticated: false, user: null };
}

// Protect page - redirect if not authenticated
async function requireAuth() {
  const { isAuthenticated, user } = await checkAuthStatus();
  
  if (!isAuthenticated) {
    alert('Bitte melde dich zuerst an!');
    window.location.href = '/login.html';
    return false;
  }
  
  window.currentUser = user;
  return true;
}

// Logout function
async function logout() {
  await window.supabaseClient.auth.signOut();
  localStorage.clear();
  window.location.href = '/login.html';
}

// Update navigation based on auth status
async function updateNavigation() {
  const { isAuthenticated, user } = await checkAuthStatus();
  
  const loginBtn = document.querySelector('.navbar-btn-login');
  const signupBtn = document.querySelector('.navbar-btn-start');
  
  if (isAuthenticated && loginBtn && signupBtn) {
    // Replace login/signup with dashboard + logout
    const userName = user.user_metadata?.name || user.email.split('@')[0];
    
    loginBtn.textContent = '👤 ' + userName;
    loginBtn.href = '/dashboard.html';
    loginBtn.classList.add('navbar-btn-user');
    
    signupBtn.textContent = 'Abmelden';
    signupBtn.href = '#';
    signupBtn.onclick = (e) => {
      e.preventDefault();
      logout();
    };
  }
}

// Listen for auth changes
window.supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email);
  
  if (event === 'SIGNED_IN') {
    window.currentUser = session.user;
    updateNavigation();
  } else if (event === 'SIGNED_OUT') {
    window.currentUser = null;
    localStorage.clear();
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateNavigation();
});
