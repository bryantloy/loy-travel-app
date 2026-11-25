/* Wind-down questions (v0.20): the boys answer questions for +3 points each, and Dad reads every answer in Dad mode.
   Shoutouts (a nice thing + favorite memory with each person) and help-Dad tasks wait for Dad's OK before they count,
   and a shoutout shows to the person it is about only after Dad OKs it. Guests see none of this.
   Answers save on the phone first, then go to Supabase through the v018 functions (SUPABASE-v018-WIND-DOWN.sql).
   Until that SQL runs, everything stays on the phone and regular answers still count. */
(function(){
  const BOYS=["Bryson","Bennett","Brooks"],PEOPLE=["Bryant","Bryson","Bennett","Brooks"],PTS=3,HELP_DAYS=["2026-11-25","2026-11-26"];
  const nameOf=n=>n==="Bryant"?"Dad":n;
  const WORDS=["aloha · hello, goodbye, love","mahalo · thank you","ʻohana · family","honu · sea turtle","keiki · kids","ʻono · delicious","pau · done","wikiwiki · quick","nalu · wave","kai · ocean","mauka · toward the mountain","makai · toward the ocean"];
  const NEXT=["🏊 Pool day","🏖️ Beach + boogie boards","🐢 Shore snorkel + turtles","🍧 Shave ice","🏄 Surf lesson","🐠 Maui Ocean Center","🥾 Kapalua Coastal Trail","🌅 Sunset on the beach","🍔 Favorite food spot again","🛍️ Souvenir shopping","🔁 Repeat a favorite","😎 Do nothing"];
  const REGULAR=[
    {id:"next-days",icon:"🗓️",title:"Wednesday + Thursday wishes",prompt:"What do you want to do before we fly home? Pick any, or add your own.",fields:[{k:"picks",type:"multi",opts:NEXT},{k:"other",type:"text",label:"Something else",ph:"Your own idea"}],any:true},
    {id:"meal",icon:"🍽️",title:"Favorite meal",prompt:"What was your favorite meal of the trip, and where was it?",fields:[{k:"a",type:"text",ph:"Pizza at the condo, fish tacos in Pāʻia…"}]},
    {id:"top3",icon:"🏆",title:"Your top 3 so far",prompt:"The three best things we've done on this trip.",fields:[{k:"1",type:"text",label:"🥇"},{k:"2",type:"text",label:"🥈"},{k:"3",type:"text",label:"🥉"}],any:true},
    {id:"word",icon:"🌺",title:"Hawaiian word of the day",prompt:"Learn a word and use it today. Honor system!",fields:[{k:"word",type:"pick",opts:WORDS},{k:"used",type:"text",label:"How did you use it?",ph:"I said mahalo to the shave ice guy"}],need:["word"]},
    {id:"caption",icon:"📸",title:"Best photo caption",prompt:"Pick your favorite trip photo and give it a caption.",fields:[{k:"photo",type:"text",label:"Which photo?",ph:"All 3 of us at Twin Falls"},{k:"caption",type:"text",label:"Caption",ph:"Brothers in the wild"}],need:["caption"],photos:true},
    {id:"learned",icon:"🐢",title:"One thing you learned",prompt:"About turtles, whales, lava or the islands.",fields:[{k:"a",type:"area",ph:"Honu can hold their breath for…"}]},
    {id:"tell-friend",icon:"💬",title:"Tell a friend",prompt:"One sentence you'd tell a friend back home about Maui.",fields:[{k:"a",type:"area"}]},
    {id:"next-trip",icon:"✈️",title:"Next trip pick",prompt:"Where should we go next?",fields:[{k:"place",type:"text",label:"Where",ph:"Japan, Alaska, the Grand Canyon…"},{k:"why",type:"text",label:"Why",ph:""}],need:["place"]}
  ];
  const personQ=p=>({id:`person-${p.toLowerCase()}`,icon:"💛",title:`Shoutout for ${nameOf(p)}`,prompt:`Keep it kind. Dad reads it first, then ${p==="Bryant"?"it counts":`${p} gets to see it`}.`,fields:[{k:"nice",type:"area",label:`One nice thing about ${nameOf(p)}`},{k:"memory",type:"area",label:`Favorite Maui memory with ${nameOf(p)}`}],check:true});
  const dayName=d=>({"2026-11-25":"Wednesday","2026-11-26":"Thursday"})[d]||d;
  const helpQ=(kind,d)=>kind==="clean"?{id:`help-clean-${d}`,icon:"🧹",title:`Help Dad clean · ${dayName(d)}`,prompt:"Helped clean up the condo today? Tell Dad what you did and he'll OK it.",fields:[{k:"note",type:"text",label:"What I did",ph:"Dishes, towels, picked up the living room…"}],any:true,check:true,help:d}:{id:`help-pack-${d}`,icon:"🧳",title:`Help Dad organize + pack · ${dayName(d)}`,prompt:"Helped Dad organize or pack today? Tell him what you did and he'll OK it.",fields:[{k:"note",type:"text",label:"What I did",ph:"Packed my bag, found the chargers…"}],any:true,check:true,help:d};
  const needsOk=id=>/^(person|help)-/.test(id);
  const today=()=>window.LoyPacks&&LoyPacks.hawaiiDate?LoyPacks.hawaiiDate(new Date()):new Date().toISOString().slice(0,10);
  const hiDay=t=>{try{return window.LoyPacks?LoyPacks.hawaiiDate(new Date(t)):String(t).slice(0,10)}catch(e){return today()}};
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const S={who:null,sb:null,trip:null,getWho:()=>null,rerender:()=>{},mode:"unknown",forMe:[],all:null,allErr:"",editing:new Set(),busy:false};
  const fnMissing=e=>!!e&&(e.code==="PGRST202"||e.code==="42883"||/could not find the function|schema cache/i.test(e.message||""));

  /* Local store, one per boy: {qid:{v:{field:value}, day, t, synced, status}} */
  const key=n=>`loy-wd-${String(n||"").toLowerCase()}`;
  function load(n){try{return JSON.parse(localStorage.getItem(key(n))||"{}")||{}}catch(e){return {}}}
  function store(n,o){try{localStorage.setItem(key(n),JSON.stringify(o))}catch(e){}}
  const draftKey=(n,q,k)=>`loy-wd-draft-${String(n).toLowerCase()}-${q}-${k}`;
  const getDraft=(n,q,k)=>{try{return localStorage.getItem(draftKey(n,q,k))}catch(e){return null}};
  const setDraft=(n,q,k,v)=>{try{localStorage.setItem(draftKey(n,q,k),v)}catch(e){}};
  const clearDrafts=(n,q)=>{try{Object.keys(localStorage).filter(k=>k.startsWith(`loy-wd-draft-${String(n).toLowerCase()}-${q}-`)).forEach(k=>localStorage.removeItem(k))}catch(e){}};
  const parse=a=>{try{let o=JSON.parse(a);return o&&typeof o==="object"&&!Array.isArray(o)?o:{a:String(a)}}catch(e){return {a:String(a||"")}}};
  const filled=v=>v&&Object.values(v).some(x=>String(x||"").trim());

  function questions(n){
    if(!BOYS.includes(n))return [];
    let t=today(),helps=HELP_DAYS.filter(d=>d<=t).flatMap(d=>[helpQ("clean",d),helpQ("pack",d)]);
    let mine=load(n);
    // Past help days show only if they were answered; today's are tappable.
    helps=helps.filter(q=>q.help===t||filled(mine[q.id]?.v));
    let persons=PEOPLE.filter(p=>p!==n).map(personQ);
    return [REGULAR[0],...helps,...REGULAR.slice(1,3),...persons,...REGULAR.slice(3)];
  }
  const counts=(id,e)=>!!e&&filled(e.v)&&(needsOk(id)?e.status==="approved":true);
  function points(n){
    let out={trip:0,today:0};if(!BOYS.includes(n))return out;
    let mine=load(n),t=today();
    Object.entries(mine).forEach(([id,e])=>{if(counts(id,e)){out.trip+=PTS;if(e.day===t)out.today+=PTS}});
    return out;
  }
  function badge(n){
    if(n==="Bryant")return (S.all||[]).filter(r=>r.status==="pending").length;
    let mine=load(n);return questions(n).filter(q=>!filled(mine[q.id]?.v)||mine[q.id]?.status==="not_approved").length;
  }

  async function rpc(fn,args){if(!S.sb)return {error:{message:"offline"}};try{return await S.sb.rpc(fn,args)}catch(e){return {error:e}}}
  async function pushOne(n,id){
    let mine=load(n),e=mine[id];if(!e||!S.trip)return;
    let r=await rpc("maui_wd_save",{p_trip:S.trip,p_name:n,p_qid:id,p_answer:JSON.stringify(e.v)});
    if(r.error){if(fnMissing(r.error))S.mode="local";return}
    S.mode="db";mine=load(n);let row=Array.isArray(r.data)?r.data[0]:r.data;
    if(mine[id]&&mine[id].t===e.t){mine[id].synced=true;if(row?.status)mine[id].status=row.status;store(n,mine)}
  }
  async function refresh(){
    let n=S.getWho();if(!S.sb||!S.trip||!n||S.busy)return;S.busy=true;if(S.who!==n){S.forMe=[];S.all=null;S.allErr=""}S.who=n;
    try{
      if(BOYS.includes(n)){
        let r=await rpc("maui_wd_mine",{p_trip:S.trip,p_name:n});
        if(r.error){S.mode=fnMissing(r.error)?"local":"offline"}
        else{
          S.mode="db";let mine=load(n);
          (r.data||[]).forEach(row=>{let e=mine[row.question_id];if(!e||e.synced){mine[row.question_id]={v:parse(row.answer),day:e?.day||hiDay(row.updated_at),t:e?.t||Date.parse(row.updated_at)||Date.now(),synced:true,status:row.status}}});
          store(n,mine);
          for(let [id,e] of Object.entries(mine))if(!e.synced&&filled(e.v))await pushOne(n,id);
          let f=await rpc("maui_wd_for_me",{p_trip:S.trip,p_name:n});S.forMe=f.error?[]:(f.data||[]);
        }
      }else if(n==="Bryant"){
        let code="";try{code=localStorage.getItem("loy-dad-code")||""}catch(e){}
        let r=await rpc("maui_wd_all",{p_code:code,p_trip:S.trip});
        if(r.error){S.mode=fnMissing(r.error)?"local":"offline";S.allErr=fnMissing(r.error)?"":/dad code/i.test(r.error.message||"")?"code":"offline"}
        else{S.mode="db";S.allErr="";S.all=r.data||[]}
      }
    }finally{S.busy=false}
    S.rerender();
  }
  function init(sb,tripId,getWho,rerender){
    S.sb=sb;S.trip=tripId;S.getWho=getWho||S.getWho;S.rerender=rerender||S.rerender;
    refresh();
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refresh()});
  }

  /* ---- Boys' view ---- */
  function fieldVal(n,q,f,saved){let d=getDraft(n,q.id,f.k);return d!==null?d:(saved?.[f.k]||"")}
  function fieldHtml(n,q,f,saved){
    let v=fieldVal(n,q,f,saved),lab=f.label?`<span>${esc(f.label)}</span>`:"",ref=`${q.id}|${f.k}`;
    if(f.type==="multi"||f.type==="pick"){let sel=f.type==="multi"?v.split(" · ").filter(Boolean):[v];return `<div class="wd-field">${lab}<div class="wd-chips" data-wd-group="${ref}" data-wd-type="${f.type}">${f.opts.map(o=>`<button type="button" class="filter ${sel.includes(o)?"on":""}" data-wd-chip="${ref}" data-val="${esc(o)}">${esc(o)}</button>`).join("")}</div></div>`}
    if(f.type==="area")return `<label class="wd-field">${lab}<textarea rows="2" maxlength="600" data-wd-in="${ref}" placeholder="${esc(f.ph||"")}">${esc(v)}</textarea></label>`;
    return `<label class="wd-field">${lab}<input maxlength="300" data-wd-in="${ref}" value="${esc(v)}" placeholder="${esc(f.ph||"")}"></label>`;
  }
  function answerHtml(q,v){return q.fields.filter(f=>String(v?.[f.k]||"").trim()).map(f=>`<p class="wd-a">${f.label&&!/^[🥇🥈🥉]$/u.test(f.label)?`<small>${esc(f.label)}</small>`:f.label?`${f.label} `:""}${esc(v[f.k])}</p>`).join("")||`<p class="wd-a">✓ Done</p>`}
  function pill(q,e){
    if(!e||!filled(e.v))return `<span class="wd-pill">+${PTS}</span>`;
    if(!needsOk(q.id))return `<span class="wd-pill ok">✓ +${PTS}</span>`;
    return e.status==="approved"?`<span class="wd-pill ok">✓ Dad OK'd +${PTS}</span>`:e.status==="not_approved"?`<span class="wd-pill no">✋ Try again</span>`:`<span class="wd-pill wait">⏳ Waiting for Dad</span>`;
  }
  function card(n,q,e){
    let done=e&&filled(e.v),redo=done&&e.status==="not_approved",edit=!done||redo||S.editing.has(q.id);
    return `<article class="card wd-q ${done&&!redo?"done":""}"><div class="wd-head"><span class="wd-ico">${q.icon}</span><div><b>${esc(q.title)}</b><small>${esc(q.prompt)}</small></div>${pill(q,e)}</div>
    ${redo?`<p class="wd-note">Dad asked for a different answer. Keep it kind and try again.</p>`:""}
    ${edit?`${q.fields.map(f=>fieldHtml(n,q,f,e?.v)).join("")}${q.photos?`<button class="learn" data-page="memories">📷 Look through Photos</button>`:""}<div class="wd-actions"><button class="buttonlink wd-save" data-wd-save="${q.id}">${q.help?"I helped ✓":done?"Save change":`Save · +${PTS}`}</button>${done&&!redo?`<button class="learn" data-wd-cancel="${q.id}">Cancel</button>`:""}</div>`
      :`${answerHtml(q,e.v)}<button class="learn" data-wd-edit="${q.id}">✏️ Change</button>`}</article>`;
  }
  function boyView(n){
    let mine=load(n),qs=questions(n),todo=qs.filter(q=>!filled(mine[q.id]?.v)||mine[q.id]?.status==="not_approved"),done=qs.filter(q=>!todo.includes(q));
    let pts=points(n).trip,waiting=Object.entries(mine).filter(([id,e])=>needsOk(id)&&filled(e.v)&&e.status!=="approved"&&e.status!=="not_approved").length;
    let note=S.mode==="local"?`<p class="wd-note">Saved on this phone for now. Shoutouts and help tasks count once they reach Dad.</p>`:S.mode==="offline"?`<p class="wd-note">No connection right now. Answers are saved on this phone and send when you're back online.</p>`:"";
    let shout=S.who===n?S.forMe:[],forMe=shout.length?`<section class="card wd-forme"><div class="eyebrow">💛 SHOUTOUTS FOR YOU</div>${shout.map(r=>{let v=parse(r.answer);return `<div class="wd-shout"><b>From ${esc(nameOf(r.from_name))}</b>${v.nice?`<p>${esc(v.nice)}</p>`:""}${v.memory?`<p><small>Favorite memory with you</small>${esc(v.memory)}</p>`:""}</div>`}).join("")}</section>`:"";
    return `<section class="card wd-hero"><div class="eyebrow">💬 WIND-DOWN QUESTIONS</div><h3>Answer for points</h3><p class="sub">+${PTS} points each, and every 15 points is a card pack. Dad reads every answer. 💛 Shoutouts and helping Dad count once Dad OKs them.</p><div class="wd-stats"><div><b>${done.length}/${qs.length}</b><span>answered</span></div><div><b>${pts}</b><span>points</span></div>${waiting?`<div><b>${waiting}</b><span>waiting for Dad</span></div>`:""}</div>${note}</section>
    ${forMe}${todo.map(q=>card(n,q,mine[q.id])).join("")}${done.length?`<div class="section-head quest-done-head"><h3>✓ Answered</h3><span class="pill">${done.length}</span></div>${done.map(q=>card(n,q,mine[q.id])).join("")}`:""}`;
  }

  /* ---- Dad's view ---- */
  const allQs=b=>[...REGULAR,...PEOPLE.filter(p=>p!==b).map(personQ),...HELP_DAYS.flatMap(d=>[helpQ("clean",d),helpQ("pack",d)])];
  const qFor=(b,id)=>allQs(b).find(q=>q.id===id)||{id,icon:"💬",title:id,fields:[{k:"a"}]};
  function dadRow(r,withButtons){
    let q=qFor(r.traveler_name,r.question_id),v=parse(r.answer),st=r.status==="approved"?`<span class="wd-pill ok">✓ OK'd</span>`:r.status==="not_approved"?`<span class="wd-pill no">✋ Sent back</span>`:r.status==="pending"?`<span class="wd-pill wait">⏳ Needs your OK</span>`:"";
    return `<div class="wd-row"><div class="wd-head"><span class="wd-ico">${q.icon}</span><div><b>${withButtons?`${esc(r.traveler_name)}: `:""}${esc(q.title)}</b></div>${st}</div>${answerHtml(q,v)}${withButtons?`<div class="wd-actions"><button class="buttonlink wd-save" data-wd-review="${r.id}" data-ok="1">✅ OK · +${PTS}</button><button class="learn" data-wd-review="${r.id}" data-ok="0">✋ Not this one</button></div>`:""}</div>`;
  }
  function dadView(){
    let rows=S.who==="Bryant"&&S.all||[],pending=rows.filter(r=>r.status==="pending");
    let status=S.mode==="local"?`<p class="wd-note">The boys' answers reach this phone after you run the v018 SQL in Supabase. Until then they save on each boy's phone.</p>`:S.allErr==="code"?`<p class="wd-note">The saved Dad code didn't work. Switch person and pick Dad again to re-enter it.</p>`:S.allErr==="offline"?`<p class="wd-note">Couldn't load answers. Check the connection and tap Refresh.</p>`:"";
    let wishes=BOYS.map(b=>{let r=rows.find(x=>x.traveler_name===b&&x.question_id==="next-days");if(!r)return "";let v=parse(r.answer);return `<p class="wd-a"><b>${b}:</b> ${esc([v.picks,v.other].filter(Boolean).join(" · "))}</p>`}).join("");
    let boys=BOYS.map(b=>{let mine=rows.filter(r=>r.traveler_name===b),pts=mine.filter(r=>!needsOk(r.question_id)||r.status==="approved").length*PTS;return `<details class="card wd-boy"><summary><b>${b}</b> · ${mine.length} answered · ${pts} pts</summary>${mine.length?mine.map(r=>dadRow(r,false)).join(""):`<p class="sub">Nothing yet.</p>`}</details>`}).join("");
    return `<section class="card wd-hero"><div class="eyebrow">💬 BOYS' ANSWERS</div><h3>Wind-down questions</h3><p class="sub">The boys get +${PTS} points per answer. Shoutouts and help-Dad tasks wait for your OK before they count, and a shoutout shows to the brother it's about only after you OK it.</p><button class="learn" data-wd-refresh>↻ Refresh</button>${status}</section>
    <section class="card wd-queue"><div class="eyebrow">⏳ WAITING FOR YOUR OK · ${pending.length}</div>${pending.length?pending.map(r=>dadRow(r,true)).join(""):`<p class="sub">Nothing waiting right now.</p>`}</section>
    ${wishes?`<section class="card"><div class="eyebrow">🗓️ WHAT THEY WANT TO DO WED + THU</div>${wishes}</section>`:""}${boys}`;
  }
  function view(n,guest){if(guest||!n)return "";return n==="Bryant"?dadView():BOYS.includes(n)?boyView(n):""}

  function bind(){
    let n=S.getWho();if(!n)return;
    if(S.who!==n&&(BOYS.includes(n)||n==="Bryant"))refresh();
    document.querySelectorAll("[data-wd-in]").forEach(el=>el.oninput=()=>{let [q,k]=el.dataset.wdIn.split("|");setDraft(n,q,k,el.value)});
    document.querySelectorAll("[data-wd-chip]").forEach(b=>b.onclick=()=>{
      let [q,k]=b.dataset.wdChip.split("|"),g=b.closest("[data-wd-group]"),multi=g?.dataset.wdType==="multi";
      if(!multi)g.querySelectorAll("[data-wd-chip]").forEach(x=>{if(x!==b)x.classList.remove("on")});
      b.classList.toggle("on");
      setDraft(n,q,k,[...g.querySelectorAll("[data-wd-chip].on")].map(x=>x.dataset.val).join(" · "));
    });
    document.querySelectorAll("[data-wd-edit]").forEach(b=>b.onclick=()=>{S.editing.add(b.dataset.wdEdit);S.rerender()});
    document.querySelectorAll("[data-wd-cancel]").forEach(b=>b.onclick=()=>{clearDrafts(n,b.dataset.wdCancel);S.editing.delete(b.dataset.wdCancel);S.rerender()});
    document.querySelectorAll("[data-wd-save]").forEach(b=>b.onclick=async()=>{
      let id=b.dataset.wdSave,q=questions(n).find(x=>x.id===id);if(!q)return;
      let art=b.closest(".wd-q"),v={};
      q.fields.forEach(f=>{let val="";if(f.type==="multi"||f.type==="pick")val=[...art.querySelectorAll(`[data-wd-chip="${id}|${f.k}"].on`)].map(x=>x.dataset.val).join(" · ");else{let el=art.querySelector(`[data-wd-in="${id}|${f.k}"]`);val=(el?.value||"").trim()}if(val)v[f.k]=val});
      let need=q.need||(q.any?[]:q.fields.map(f=>f.k));
      if(q.any&&!q.help&&!filled(v)){alert("Add an answer first.");return}
      let miss=need.filter(k=>!v[k]);if(miss.length){alert(q.check&&!q.help?"Fill in both parts first.":"Add an answer first.");return}
      if(q.help&&!filled(v))v.note="Helped";
      let mine=load(n),old=mine[id];
      if(old&&JSON.stringify(old.v)===JSON.stringify(v)&&old.status!=="not_approved"){clearDrafts(n,id);S.editing.delete(id);S.rerender();return}
      mine[id]={v,day:old&&counts(id,old)?old.day:today(),t:Date.now(),synced:false,status:needsOk(id)?"pending":"counted"};store(n,mine);
      clearDrafts(n,id);S.editing.delete(id);S.rerender();
      await pushOne(n,id);S.rerender();
    });
    document.querySelectorAll("[data-wd-review]").forEach(b=>b.onclick=async()=>{
      if(n!=="Bryant")return;b.disabled=true;let code="";try{code=localStorage.getItem("loy-dad-code")||""}catch(e){}
      let r=await rpc("maui_wd_review",{p_code:code,p_id:b.dataset.wdReview,p_ok:b.dataset.ok==="1"});
      if(r.error){alert("Couldn't save that. Check the connection and try again.");b.disabled=false;return}
      await refresh();
    });
    document.querySelectorAll("[data-wd-refresh]").forEach(b=>b.onclick=()=>{b.disabled=true;refresh()});
  }
  window.LoyWD={init,refresh,view,bind,points,badge,questions,PTS,_S:S};
})();
