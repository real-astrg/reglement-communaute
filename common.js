/* Brain Not Found : code commun à toutes les pages (en-tête, connexion, session). */
const SUPABASE_URL = "https://jbpvjcjdbfiaeyfyjlnz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qP2j0XgSeZOjaYytKSWVXg_Qp89T4DZ";

const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("REMPLACER") && !SUPABASE_ANON_KEY.includes("REMPLACER");
const sb = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let currentUser = null;
let currentProfile = null;

const $ = (id) => document.getElementById(id);
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function requireConfig(){if(!sb){toast("Le site doit d'abord être configuré avec Supabase.");return false}return true}
function isAdmin(){return currentProfile?.role==="admin"}
function isMember(){return currentProfile?.role==="member"||isAdmin()}
function ensureUser(){if(!currentUser){toast("Votre session a expiré. Reconnectez-vous.");return false}return true}

/* ---- En-tête, fenêtres de connexion, pied de page et message : insérés sur chaque page ---- */
const HEADER_HTML = `
<header class="topbar">
  <a class="brand" href="index.html" aria-label="Brain Not Found, accueil"><span class="brand-mark">B<span class="cursor">_</span></span><span class="brand-name">BRAIN NOT FOUND<span class="cursor">_</span></span></a>
  <div class="top-actions">
    <span id="session-label" class="session-label">Visiteur</span>
    <button id="login-open" class="button button-light">Espace membre</button>
    <button id="logout" class="button button-light hidden">Déconnexion</button>
  </div>
</header>`;

const DIALOGS_HTML = `
<footer class="site-footer">Brain Not Found <span>·</span> Espace indépendant <span>·</span> <button type="button" id="admin-login-open" class="footer-link">Accès admin</button></footer>

<dialog id="login-dialog" class="dialog">
  <div class="dialog-shell">
    <button type="button" class="dialog-close" id="login-close" aria-label="Fermer">×</button>
    <div class="dialog-tabs">
      <button type="button" id="tab-first" class="dialog-tab active">Première connexion</button>
      <button type="button" id="tab-signin" class="dialog-tab">J'ai déjà un compte</button>
    </div>

    <form id="login-form" method="dialog">
      <div class="eyebrow dark-eyebrow">ESPACE MEMBRE</div>
      <h2>Rejoindre la communauté</h2>
      <p class="muted">Choisissez un pseudonyme, saisissez le code membre partagé par les administrateurs, puis créez votre mot de passe personnel.</p>
      <label for="nickname">Pseudonyme</label>
      <input id="nickname" maxlength="32" required autocomplete="username" placeholder="Votre pseudonyme">
      <label for="member-code">Code membre</label>
      <input id="member-code" type="password" required autocomplete="off" placeholder="Code communiqué par les admins">
      <label for="new-password">Mot de passe (8 caractères minimum)</label>
      <input id="new-password" type="password" required minlength="8" maxlength="72" autocomplete="new-password" placeholder="Votre mot de passe personnel">
      <label for="new-password2">Confirmer le mot de passe</label>
      <input id="new-password2" type="password" required minlength="8" maxlength="72" autocomplete="new-password" placeholder="Retapez le mot de passe">
      <button class="button button-primary full-width" type="submit">Créer mon compte</button>
      <p id="login-error" class="error" role="alert"></p>
      <p class="fine-print">Le code ne sert qu'à la première connexion. Ensuite, votre pseudonyme et votre mot de passe suffisent. Utilisez un mot de passe que vous n'employez nulle part ailleurs : en cas d'oubli, contactez un administrateur.</p>
    </form>

    <form id="signin-form" method="dialog" class="hidden">
      <div class="eyebrow dark-eyebrow">ESPACE MEMBRE</div>
      <h2>Se connecter</h2>
      <p class="muted">Saisissez votre pseudonyme et votre mot de passe.</p>
      <label for="signin-nickname">Pseudonyme</label>
      <input id="signin-nickname" maxlength="32" required autocomplete="username" placeholder="Votre pseudonyme">
      <label for="signin-password">Mot de passe</label>
      <input id="signin-password" type="password" required maxlength="72" autocomplete="current-password" placeholder="Votre mot de passe">
      <button class="button button-primary full-width" type="submit">Se connecter</button>
      <p id="signin-error" class="error" role="alert"></p>
      <p class="fine-print">Première visite ? Utilisez l'onglet « Première connexion ». Mot de passe oublié ? Contactez un administrateur.</p>
    </form>
  </div>
</dialog>

<dialog id="admin-dialog" class="dialog">
  <form id="admin-login-form" method="dialog">
    <button type="button" class="dialog-close" id="admin-login-close" aria-label="Fermer">×</button>
    <div class="eyebrow dark-eyebrow">ADMINISTRATION</div>
    <h2>Connexion administrateur</h2>
    <p class="muted">Réservé aux administrateurs du site.</p>
    <label for="admin-email">Adresse e-mail</label>
    <input id="admin-email" type="email" required autocomplete="username" placeholder="votre@email.fr">
    <label for="admin-password">Mot de passe</label>
    <input id="admin-password" type="password" required autocomplete="current-password" placeholder="Votre mot de passe">
    <button class="button button-primary full-width" type="submit">Se connecter</button>
    <p id="admin-login-error" class="error" role="alert"></p>
  </form>
</dialog>

<div id="toast" class="toast" role="status"></div>`;

document.body.insertAdjacentHTML("afterbegin", HEADER_HTML);
document.body.insertAdjacentHTML("beforeend", DIALOGS_HTML);

/* ---- Session ---- */
function updateHeader(){
  $("session-label").textContent=currentProfile?.nickname ? `${currentProfile.nickname}${isAdmin()?" · Admin":""}` : "Visiteur";
  $("login-open").classList.toggle("hidden",isMember());
  $("logout").classList.toggle("hidden",!isMember());
  $("admin-login-open").classList.toggle("hidden",isAdmin());
}
/* Chaque page peut définir window.pageRefresh pour se redessiner après une connexion ou une déconnexion. */
function refreshAll(){updateHeader();if(typeof window.pageRefresh==="function")window.pageRefresh()}

async function loadSession(){
  if(sb){
    const {data:{session}}=await sb.auth.getSession();
    currentUser=session?.user??null;
    if(currentUser){const {data}=await sb.from("profiles").select("nickname,role").eq("id",currentUser.id).maybeSingle();currentProfile=data}
  }
  updateHeader();
}
const sessionReady=loadSession();

/* ---- Fenêtre membre : deux onglets ---- */
function setLoginTab(tab){
  const first=tab==="first";
  $("login-form").classList.toggle("hidden",!first);
  $("signin-form").classList.toggle("hidden",first);
  $("tab-first").classList.toggle("active",first);
  $("tab-signin").classList.toggle("active",!first);
}
$("tab-first").addEventListener("click",()=>setLoginTab("first"));
$("tab-signin").addEventListener("click",()=>setLoginTab("signin"));
$("login-open").addEventListener("click",()=>{if(!requireConfig())return;$("login-error").textContent="";$("signin-error").textContent="";setLoginTab("first");$("login-dialog").showModal()});
$("login-close").addEventListener("click",()=>$("login-dialog").close());

/* ---- Première connexion : pseudonyme + code commun + création du mot de passe ---- */
$("login-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!requireConfig())return;
  $("login-error").textContent="";
  const nickname=$("nickname").value.trim(),code=$("member-code").value,password=$("new-password").value,confirmation=$("new-password2").value;
  if(nickname.length<2)return $("login-error").textContent="Le pseudonyme doit contenir au moins 2 caractères.";
  if(password.length<8)return $("login-error").textContent="Le mot de passe doit contenir au moins 8 caractères.";
  if(password!==confirmation)return $("login-error").textContent="Les deux mots de passe ne correspondent pas.";

  let {data:{session}}=await sb.auth.getSession();
  let createdHere=false;
  if(!session){
    const {data,error}=await sb.auth.signInAnonymously();
    if(error)return $("login-error").textContent=error.message;
    session=data.session;
    createdHere=true;
  }

  const {data,error}=await sb.functions.invoke("join-community",{body:{nickname,code,password}});
  if(error||!data?.ok){
    let serverMessage=data?.error;
    if(!serverMessage&&error?.context&&typeof error.context.clone==="function"){
      try{
        const details=await error.context.clone().json();
        serverMessage=details?.error;
      }catch(_){}
    }
    $("login-error").textContent=serverMessage||"Inscription impossible. Vérifiez le code membre et réessayez.";
    if(createdHere){
      await sb.auth.signOut();
      currentUser=null;
      currentProfile=null;
      refreshAll();
    }
    return;
  }

  /* Le compte vient d'être modifié côté serveur : on ouvre une session neuve avec le mot de passe choisi. */
  const {data:fresh,error:freshError}=data.email
    ? await sb.auth.signInWithPassword({email:data.email,password})
    : {data:null,error:new Error("no-email")};
  if(freshError||!fresh?.user){
    await sb.auth.signOut();
    currentUser=null;
    currentProfile=null;
    refreshAll();
    setLoginTab("signin");
    $("signin-nickname").value=nickname;
    $("signin-error").textContent="Compte créé. Connectez-vous maintenant avec votre pseudonyme et votre mot de passe.";
    return;
  }
  currentUser=fresh.user;
  currentProfile={nickname:data.nickname,role:data.role};
  $("login-dialog").close();
  $("member-code").value="";
  $("new-password").value="";
  $("new-password2").value="";
  refreshAll();
  toast("Bienvenue, "+nickname+" ! Retenez votre mot de passe pour vous reconnecter.");
});

/* ---- Connexion habituelle : pseudonyme + mot de passe ---- */
$("signin-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!requireConfig())return;
  $("signin-error").textContent="";
  const nickname=$("signin-nickname").value.trim(),password=$("signin-password").value;
  if(nickname.length<2||!password)return $("signin-error").textContent="Saisissez votre pseudonyme et votre mot de passe.";

  /* Un appel à la fonction serveur demande une session, même vide : on en crée une si besoin. */
  let {data:{session}}=await sb.auth.getSession();
  if(!session){
    const {error}=await sb.auth.signInAnonymously();
    if(error)return $("signin-error").textContent="Connexion impossible pour le moment. Réessayez dans un instant.";
  }

  const {data:found,error:lookupError}=await sb.functions.invoke("join-community",{body:{action:"lookup",nickname}});
  if(lookupError||!found?.email)return $("signin-error").textContent="Connexion impossible pour le moment. Réessayez dans un instant.";

  const {data,error}=await sb.auth.signInWithPassword({email:found.email,password});
  if(error||!data?.user)return $("signin-error").textContent="Pseudonyme ou mot de passe incorrect.";

  const {data:profile}=await sb.from("profiles").select("nickname,role").eq("id",data.user.id).maybeSingle();
  if(!profile){
    await sb.auth.signOut();
    currentUser=null;currentProfile=null;refreshAll();
    return $("signin-error").textContent="Compte introuvable. Utilisez l'onglet « Première connexion ».";
  }

  currentUser=data.user;
  currentProfile=profile;
  $("signin-password").value="";
  $("login-dialog").close();
  refreshAll();
  toast("Bienvenue, "+profile.nickname+" !");
});

$("logout").addEventListener("click",async()=>{if(!sb)return;await sb.auth.signOut();currentUser=null;currentProfile=null;refreshAll();toast("Déconnexion effectuée.")});

/* ---- Connexion administrateur (e-mail + mot de passe) ---- */
$("admin-login-open").addEventListener("click",()=>{if(!requireConfig())return;$("admin-login-error").textContent="";$("admin-dialog").showModal()});
$("admin-login-close").addEventListener("click",()=>$("admin-dialog").close());
$("admin-login-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!requireConfig())return;
  $("admin-login-error").textContent="";
  const email=$("admin-email").value.trim(),password=$("admin-password").value;
  if(!email||!password)return $("admin-login-error").textContent="Saisissez l'e-mail et le mot de passe.";

  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error||!data?.user)return $("admin-login-error").textContent="Connexion impossible. Vérifiez l'e-mail et le mot de passe.";

  /* Le rôle vient toujours de la base de données, jamais du navigateur. */
  const {data:profile}=await sb.from("profiles").select("nickname,role").eq("id",data.user.id).maybeSingle();
  if(profile?.role!=="admin"){
    await sb.auth.signOut();
    currentUser=null;currentProfile=null;
    refreshAll();
    return $("admin-login-error").textContent="Ce compte n'a pas les droits d'administration.";
  }

  currentUser=data.user;
  currentProfile=profile;
  $("admin-password").value="";
  $("admin-dialog").close();
  refreshAll();
  toast("Connecté en tant qu'administrateur.");
});
