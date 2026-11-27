/* Configurez ces deux valeurs après avoir créé votre projet Supabase. */
const SUPABASE_URL = "https://jbpvjcjdbfiaeyfyjlnz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qP2j0XgSeZOjaYytKSWVXg_Qp89T4DZ";

const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("REMPLACER") && !SUPABASE_ANON_KEY.includes("REMPLACER");
const sb = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let currentUser = null;
let currentProfile = null;
let articleCache = [];

const $ = (id) => document.getElementById(id);
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function requireConfig(){if(!sb){toast("Le site doit d'abord être configuré avec Supabase.");return false}return true}
function isAdmin(){return currentProfile?.role==="admin"}
function isMember(){return currentProfile?.role==="member"||isAdmin()}
function dateLabel(value){return new Date(value).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}

async function loadSession(){
  if(!sb)return;
  const {data:{session}}=await sb.auth.getSession();
  currentUser=session?.user??null;
  if(currentUser){const {data}=await sb.from("profiles").select("nickname,role").eq("id",currentUser.id).maybeSingle();currentProfile=data}
  updateHeader();renderAdminTools();
}
function updateHeader(){
  $("session-label").textContent=currentProfile?.nickname ? `${currentProfile.nickname}${isAdmin()?" · Admin":""}` : "Visiteur";
  $("login-open").classList.toggle("hidden",isMember());
  $("logout").classList.toggle("hidden",!isMember());
  $("admin-login-open").classList.toggle("hidden",isAdmin());
}
function renderAdminTools(){$("admin-poll-form").classList.toggle("hidden",!isAdmin())}

async function loadArticles(){
  if(!sb){$("articles").innerHTML='<div class="panel"><strong>Configuration nécessaire</strong><p class="muted">Suivez le guide README pour connecter Supabase. Les articles apparaîtront ici ensuite.</p></div>';return}
  const {data,error}=await sb.from("articles").select("id,number,title,body").order("number");
  if(error){$("articles").innerHTML=`<p class="error">${esc(error.message)}</p>`;return}
  articleCache=data||[];
  $("toc").innerHTML=articleCache.map(a=>`<a href="#article-${a.id}">${esc(a.number)}. ${esc(a.title)}</a>`).join("")||'<p class="muted">Aucun article publié.</p>';
  const {data:comments}=await sb.from("comments").select("id,article_id,author_name,body,created_at,parent_id").order("created_at");
  const all=comments||[];
  $("articles").innerHTML=articleCache.map(a=>{
    const roots=all.filter(c=>c.article_id===a.id&&!c.parent_id);
    return `<article class="article-card" id="article-${a.id}"><div class="article-layout"><div><div class="article-number">ARTICLE ${esc(a.number)}</div><h2>${esc(a.title)}</h2><div class="article-body">${esc(a.body)}</div>${isAdmin()?`<details class="admin-form"><summary class="text-button">Modifier cet article</summary><label>Titre</label><input id="title-${a.id}" value="${esc(a.title)}"><label>Texte</label><textarea id="body-${a.id}" rows="4">${esc(a.body)}</textarea><button class="button button-primary small-button" onclick="saveArticle('${a.id}')">Enregistrer</button></details>`:""}</div><aside class="comment-rail"><div class="comment-head"><span>COMMENTAIRES</span><span class="comment-count">${roots.length}</span></div><div>${roots.map(c=>commentHTML(c,all)).join("")||'<p class="empty">Aucun commentaire pour le moment.</p>'}</div>${isMember()?`<form class="comment-form" onsubmit="addComment(event,'${a.id}')"><textarea id="new-comment-${a.id}" rows="2" maxlength="2000" required placeholder="Votre remarque sur cet article…"></textarea><button class="button button-primary small-button">Commenter</button></form>`:'<p class="muted">Connectez-vous pour commenter.</p>'}</aside></div></article>`;
  }).join("");
}
function commentHTML(c,all){
  const replies=all.filter(r=>r.parent_id===c.id);
  return `<div class="comment"><div><span class="comment-author">${esc(c.author_name)}</span><span class="comment-date">${dateLabel(c.created_at)}</span></div><div class="comment-text">${esc(c.body)}</div>${isMember()?`<div class="comment-actions"><button class="text-button" onclick="showReply('${c.id}')">Répondre</button>${isAdmin()?`<button class="text-button" onclick="deleteComment('${c.id}')">Supprimer</button>`:""}</div><form id="reply-form-${c.id}" class="comment-form hidden" onsubmit="addReply(event,'${c.article_id}','${c.id}')"><textarea id="reply-text-${c.id}" rows="2" maxlength="2000" required placeholder="Votre réponse…"></textarea><button class="button button-primary small-button">Envoyer</button></form>`:""}${replies.map(r=>`<div class="reply"><div class="comment-author">${esc(r.author_name)}</div><div class="comment-text">${esc(r.body)}</div>${isAdmin()?`<button class="text-button" onclick="deleteComment('${r.id}')">Supprimer</button>`:""}</div>`).join("")}</div>`;
}
window.showReply=id=>$(`reply-form-${id}`).classList.toggle("hidden");
window.addComment=async(e,articleId)=>{e.preventDefault();const body=$(`new-comment-${articleId}`).value.trim();if(!body)return;const {error}=await sb.from("comments").insert({article_id:articleId,author_id:currentUser.id,author_name:currentProfile.nickname,body});if(error)toast(error.message);else{toast("Commentaire publié.");loadArticles()}};
window.addReply=async(e,articleId,parentId)=>{e.preventDefault();const body=$(`reply-text-${parentId}`).value.trim();if(!body)return;const {error}=await sb.from("comments").insert({article_id:articleId,parent_id:parentId,author_id:currentUser.id,author_name:currentProfile.nickname,body});if(error)toast(error.message);else{toast("Réponse publiée.");loadArticles()}};
window.deleteComment=async(id)=>{if(!isAdmin()||!confirm("Supprimer ce commentaire ?"))return;const {error}=await sb.from("comments").delete().eq("id",id);if(error)toast(error.message);else{toast("Commentaire supprimé.");loadArticles()}};
window.saveArticle=async(id)=>{if(!isAdmin())return;const title=$(`title-${id}`).value.trim(),body=$(`body-${id}`).value.trim();const {error}=await sb.from("articles").update({title,body}).eq("id",id);if(error)toast(error.message);else{toast("Article mis à jour.");loadArticles()}};

async function loadPolls(){
  if(!sb){$("polls").innerHTML='<p class="muted">Les votes apparaîtront après configuration.</p>';return}
  const {data:polls,error}=await sb.from("polls").select("id,question,options,active,created_at").order("created_at",{ascending:false});
  if(error){$("polls").innerHTML=`<p class="error">${esc(error.message)}</p>`;return}
  if(!polls?.length){$("polls").innerHTML='<p class="muted">Aucun vote proposé pour le moment.</p>';return}
  const {data:responses}=await sb.from("poll_responses").select("poll_id,option_index,user_id");
  const all=responses||[];
  $("polls").innerHTML=polls.map(p=>{
    const rs=all.filter(r=>r.poll_id===p.id),mine=rs.find(r=>r.user_id===currentUser?.id),total=rs.length;
    return `<div class="poll"><h3>${esc(p.question)}</h3>${p.options.map((opt,i)=>{const count=rs.filter(r=>r.option_index===i).length;return `<label class="poll-option"><input type="radio" name="poll-${p.id}" value="${i}" ${mine?.option_index===i?"checked":""} ${!isMember()||!p.active||mine?"disabled":""}><span>${esc(opt)}</span>${mine||!p.active?`<span class="poll-results"><span style="width:${total?count/total*100:0}%"></span></span><span>${count}</span>`:""}</label>`}).join("")}${isMember()&&p.active&&!mine?`<button class="button button-primary small-button" onclick="castVote('${p.id}')">Voter</button>`:""}<div class="poll-meta">${total} vote(s) · ${p.active?"Vote ouvert":"Vote clôturé"}${mine?" · Vous avez voté":""}</div>${isAdmin()?`<button class="text-button" onclick="togglePoll('${p.id}',${!p.active})">${p.active?"Clôturer":"Rouvrir"} le vote</button>`:""}</div>`;
  }).join("");
}
window.castVote=async(id)=>{const selected=document.querySelector(`input[name="poll-${id}"]:checked`);if(!selected)return toast("Choisissez une réponse.");const {error}=await sb.from("poll_responses").insert({poll_id:id,user_id:currentUser.id,option_index:Number(selected.value)});if(error)toast(error.message);else{toast("Vote enregistré.");loadPolls()}};
window.togglePoll=async(id,active)=>{if(!isAdmin())return;const {error}=await sb.from("polls").update({active}).eq("id",id);if(error)toast(error.message);else loadPolls()};
$("poll-create").addEventListener("click",async()=>{if(!isAdmin())return;const question=$("poll-title").value.trim(),options=$("poll-options").value.split("\n").map(x=>x.trim()).filter(Boolean);if(!question||options.length<2)return toast("Ajoutez une question et au moins deux choix.");const {error}=await sb.from("polls").insert({question,options,created_by:currentUser.id});if(error)toast(error.message);else{$("poll-title").value="";$("poll-options").value="";toast("Vote créé.");loadPolls()}});
$("login-open").addEventListener("click",()=>{if(!requireConfig())return;$("login-dialog").showModal()});
$("login-close").addEventListener("click",()=>$("login-dialog").close());
$("login-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!requireConfig())return;
  $("login-error").textContent="";
  const nickname=$("nickname").value.trim(),code=$("member-code").value;
  if(nickname.length<2)return $("login-error").textContent="Le pseudonyme doit contenir au moins 2 caractères.";

  let {data:{session}}=await sb.auth.getSession();
  let anonymousSession=false;
  if(!session){
    const {data,error}=await sb.auth.signInAnonymously();
    if(error)return $("login-error").textContent=error.message;
    session=data.session;
    anonymousSession=true;
  } else {
    anonymousSession=!!session.user?.is_anonymous;
  }

  const {data,error}=await sb.functions.invoke("join-community",{body:{nickname,code}});
  if(error||!data?.ok){
    let serverMessage=data?.error;
    if(!serverMessage&&error?.context&&typeof error.context.clone==="function"){
      try{
        const details=await error.context.clone().json();
        serverMessage=details?.error;
      }catch(_){}
    }
    $("login-error").textContent=serverMessage||"Inscription impossible. Vérifiez le code membre et réessayez.";
    if(anonymousSession){
      await sb.auth.signOut();
      currentUser=null;
      currentProfile=null;
      updateHeader();
      renderAdminTools();
      loadArticles();
      loadPolls();
    }
    return;
  }

  currentUser=(await sb.auth.getUser()).data.user;
  currentProfile={nickname:data.nickname,role:data.role};
  $("login-dialog").close();
  $("member-code").value="";
  updateHeader();
  renderAdminTools();
  loadArticles();
  loadPolls();
  toast("Bienvenue, "+nickname+" !");
});
$("logout").addEventListener("click",async()=>{if(!sb)return;await sb.auth.signOut();currentUser=null;currentProfile=null;updateHeader();renderAdminTools();loadArticles();loadPolls();toast("Déconnexion effectuée.")});

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
    updateHeader();renderAdminTools();loadArticles();loadPolls();
    return $("admin-login-error").textContent="Ce compte n'a pas les droits d'administration.";
  }

  currentUser=data.user;
  currentProfile=profile;
  $("admin-password").value="";
  $("admin-dialog").close();
  updateHeader();
  renderAdminTools();
  loadArticles();
  loadPolls();
  toast("Connecté en tant qu'administrateur.");
});

(async()=>{if(!configured){loadArticles();loadPolls();$("login-open").textContent="Configuration requise";return}await loadSession();await loadArticles();await loadPolls()})();
