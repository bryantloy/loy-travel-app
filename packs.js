// Loy Travel v0.18 — earned card packs: milestones, odds, rare caps, pity and collection storage.
// Rules are written up in CARD-PACKS.md. Shared storage comes from SUPABASE-v016-CARD-PACKS.sql;
// until that runs, packs are kept on this device (localStorage) and copied up once the table exists.
(function(global){
  const CONFIG={
    packSize:4,      // 4 cards per pack; still at most 1 rare-or-better
    // Chance for each card slot, using the catalog's 7 rarities (handoff section 18).
    odds:{common:40,bronze:20,uncommon:15,rare:15,gold:4,epic:5,legendary:1},
    order:["common","bronze","uncommon","rare","gold","epic","legendary"],
    hitFrom:"rare",        // rare and up counts as a "hit"
    highFrom:"gold",       // gold, epic and legendary count as "high rarity"
    maxHitsPerPack:1,      // at most one rare-or-better card per pack
    highCooldownPacks:2,   // no gold/epic/legendary for the next 2 packs after pulling one
    hitPityPacks:4,        // 4 packs in a row with nothing rare+ -> next pack has a rare+
    highPityPacks:6,       // 6 packs in a row with no gold+ -> next pack has a gold/epic/legendary
    newCardWeight:2.5,     // inside a rarity, cards you don't own yet are 2.5x as likely (duplicates still happen)
    ownCardWeight:2,       // and a traveler's own personal cards are 2x as likely as shared ones
    collectFirst:true,     // no repeats until a traveler owns every card in their pool, so the set can be finished on the trip
    collectors:["Bryant","Bryson","Bennett","Brooks"],
    boys:["bryson","bennett","brooks"],
    ownPerPack:2,          // until a traveler owns all of their own cards, every pack has at least 2 of them
    boysPullAll:true // each boy's packs can give any card, brothers' included (own cards still more likely)
  };
  // Earned packs. Each one opens once per traveler. Dates are Hawaiʻi dates.
  const PACKS=[
    {key:"arrival",name:"Aloha Arrival Pack",icon:"🌺",how:"Unlocks on arrival day, Thu 11/19",date:"2026-11-19"},
    {key:"haleakala",name:"Haleakalā Pack",icon:"🌋",how:"Unlocks on sunrise day, Sat 11/21",date:"2026-11-21"},
    {key:"ocean",name:"Ocean Pack",icon:"🐢",how:"Unlocks on Pride of Maui day, Mon 11/23",date:"2026-11-23"},
    {key:"explorer",name:"Explorer Pack",icon:"🚙",how:"Unlocks on Road to Hāna day, Tue 11/24",date:"2026-11-24"},
    {key:"quest-5",name:"Quest Pack",icon:"🔎",how:"Find 5 Maui Quest targets (silly ones don't count)",quest:5},
    {key:"quest-10",name:"Quest Pack II",icon:"🏆",how:"Find 10 Maui Quest targets (silly ones don't count)",quest:10},
    {key:"quest-20",name:"Quest Pack III",icon:"🥇",how:"Find 20 Maui Quest targets over the trip (silly ones don't count)",quest:20},
    {key:"quest-35",name:"Quest Master Pack",icon:"🗺️",how:"Find 35 Maui Quest targets over the trip (silly ones don't count)",quest:35},
    {key:"century-100",name:"100 Point Bonus Pack",icon:"💯",how:"Bonus for reaching 100 Maui Quest points",points:100},
    {key:"wildlife",name:"Wildlife Pack",icon:"🐠",how:"Find 4 animals or ocean creatures in Maui Quest",wildlife:4},
    {key:"wildlife-12",name:"Wildlife Pack II",icon:"🐬",how:"Find 12 animals or ocean creatures over the trip",wildlife:12},
    {key:"family-memory",name:"Family Memory Pack",icon:"📸",how:"The family uploads 5 trip photos",photos:5},
    {key:"surf",name:"Surf Pack",icon:"🏄",how:"Dad awards it if surf happens",dad:true},
    {key:"shave-ice",name:"Shave Ice Judge Pack",icon:"🍧",how:"Dad awards it",dad:true}
  ];
  const BONUS={key:"bonus",name:"Dad Bonus Pack",icon:"🎁",how:"Dad awards it for anything",dad:true};
  // Points packs repeat: one pack every POINT_STEP Maui Quest points (15, 30, 45, ...), no cap.
  const POINT_STEP=15;
  const pointsPack=n=>({key:`points-${n}`,name:`${n} Point Pack`,icon:"⭐",how:`Score ${n} Maui Quest points`,points:n});
  const LOCAL_KEY="loy-packs-v016";
  const rank=r=>{let i=CONFIG.order.indexOf((r||"").toLowerCase());return i<0?0:i};
  const isHit=r=>rank(r)>=rank(CONFIG.hitFrom), isHigh=r=>rank(r)>=rank(CONFIG.highFrom);
  const packInfo=key=>PACKS.find(p=>p.key===key)||(/^points-\d+$/.test(String(key))?pointsPack(+String(key).slice(7)):String(key).startsWith("bonus")?BONUS:key==="starter"?{key:"starter",name:"Starter Pack",icon:"✨"}:{key,name:"Card Pack",icon:"🎁"});

  // Which cards a traveler can pull: their own, Dad's, Family, Pets/Finn and Maui.
  // Brothers' personal cards stay private, matching the original collection rules.
  function poolFor(person,cards){
    const self=(person||"").toLowerCase();
    const pool=cards.filter(c=>(c.status||"active")==="active"&&(c.owner===self||(c.also||[]).includes(self)||!CONFIG.boys.includes(c.owner)||(CONFIG.boysPullAll&&CONFIG.boys.includes(self))));
    pool.selfOwner=self;return pool;
  }

  function hawaiiDate(now){
    try{return new Intl.DateTimeFormat("en-CA",{timeZone:"Pacific/Honolulu",year:"numeric",month:"2-digit",day:"2-digit"}).format(now)}
    catch(e){return now.toISOString().slice(0,10)}
  }

  // Pure roll. history = the traveler's earlier opened packs (oldest first), each {card_ids:[...]}.
  function rollPack(pool,history,byId,rng,owned){
    rng=rng||Math.random;owned=owned||{};
    if(CONFIG.collectFirst){let c=collectRoll(pool,rng,owned);if(c)return c}
    const rar=id=>byId[id]?.rarity;
    const since=test=>{let n=0;for(let i=history.length-1;i>=0;i--){if((history[i].card_ids||[]).some(id=>test(rar(id))))break;n++}return n};
    const sinceHit=since(isHit),sinceHigh=since(isHigh);
    const highCooldown=history.length>0&&sinceHigh<CONFIG.highCooldownPacks;
    const weighted=list=>{let total=list.reduce((s,t)=>s+CONFIG.odds[t],0),x=rng()*total;for(const t of list){x-=CONFIG.odds[t];if(x<0)return t}return list[list.length-1]};
    const lows=CONFIG.order.filter(t=>!isHit(t)),hits=CONFIG.order.filter(isHit),highs=CONFIG.order.filter(isHigh);
    let tiers=[],hitCount=0;
    for(let i=0;i<CONFIG.packSize;i++){
      let t=weighted(CONFIG.order);
      if(highCooldown&&isHigh(t))t="rare";
      if(isHit(t)){if(hitCount>=CONFIG.maxHitsPerPack)t=weighted(lows);else hitCount++}
      tiers.push(t);
    }
    // Pity: a long dry spell guarantees one better card (still only one hit per pack).
    let forced=null;
    if(sinceHigh>=CONFIG.highPityPacks)forced=weighted(highs);
    else if(sinceHit>=CONFIG.hitPityPacks&&!tiers.some(isHit))forced=weighted(hits.filter(t=>!highCooldown||!isHigh(t)));
    if(forced){let i=tiers.findIndex(isHit);if(i<0)i=tiers.length-1;tiers[i]=forced}
    const byTier={};CONFIG.order.forEach(t=>byTier[t]=[]);
    pool.forEach(c=>byTier[CONFIG.order[rank(c.rarity)]].push(c));
    const used=new Set(),picked=[];
    for(let t of tiers){
      // If this traveler's pool has no card at that rarity, step down to the next one that does.
      let r=rank(t);while(r>0&&!byTier[CONFIG.order[r]].length)r--;
      let options=byTier[CONFIG.order[r]].filter(c=>!used.has(c.id));if(!options.length)options=byTier[CONFIG.order[r]];
      if(!options.length)continue;
      // Tier first, then the card: unowned cards get extra weight so each good card stays reachable.
      const self=(pool.selfOwner||"");
      const w=options.map(c=>(owned[c.id]?1:CONFIG.newCardWeight)*(c.owner&&(c.owner===self||(c.also||[]).includes(self))?CONFIG.ownCardWeight:1));
      let x=rng()*w.reduce((a,b)=>a+b,0),k=0;while(k<options.length-1&&(x-=w[k])>=0)k++;
      const c=options[k];used.add(c.id);picked.push(c);
    }
    picked.sort((a,b)=>rank(a.rarity)-rank(b.rarity)); // best card is revealed last
    return picked.map(c=>c.id);
  }

  // Collection roll: every card comes from the ones this traveler doesn't own yet, so there are no
  // repeats until the set is done. A rarity is picked by its odds times how many of it are still
  // missing, so commons come early and the rarest cards tend to show up near the end.
  // When fewer cards are missing than fit in a pack, the rest of the pack is random repeats.
  function collectRoll(pool,rng,owned){
    let missing=pool.filter(c=>!owned[c.id]);
    if(!missing.length)return null;
    const self=pool.selfOwner||"",picked=[];
    // Own cards first: until a traveler has all of their own cards, each pack holds at least CONFIG.ownPerPack of them.
    const mine=c=>c.owner===self||(c.also||[]).includes(self);
    let ownMissing=missing.filter(mine);
    for(let i=0;i<CONFIG.ownPerPack&&ownMissing.length&&picked.length<CONFIG.packSize;i++){
      const c=ownMissing.splice(Math.floor(rng()*ownMissing.length),1)[0];picked.push(c);missing=missing.filter(m=>m.id!==c.id);
    }
    const pick=list=>{const w=list.map(c=>(c.owner&&(c.owner===self||(c.also||[]).includes(self))?CONFIG.ownCardWeight:1));let x=rng()*w.reduce((a,b)=>a+b,0),k=0;while(k<list.length-1&&(x-=w[k])>=0)k++;return list[k]};
    while(picked.length<CONFIG.packSize&&missing.length){
      const tiers=CONFIG.order.map(t=>[t,missing.filter(c=>CONFIG.order[rank(c.rarity)]===t)]).filter(x=>x[1].length);
      const w=tiers.map(([t,l])=>CONFIG.odds[t]*l.length);let x=rng()*w.reduce((a,b)=>a+b,0),k=0;while(k<tiers.length-1&&(x-=w[k])>=0)k++;
      const c=pick(tiers[k][1]);picked.push(c);missing=missing.filter(m=>m.id!==c.id);
    }
    const rest=pool.filter(c=>!picked.includes(c));
    while(picked.length<CONFIG.packSize&&rest.length){const c=rest.splice(Math.floor(rng()*rest.length),1)[0];picked.push(c)}
    picked.sort((a,b)=>rank(a.rarity)-rank(b.rarity));
    return picked.map(c=>c.id);
  }

  let sb=null,tripId=null,mode="local",rows=[],photoCount=0,busy=false;
  const loadLocal=()=>{try{return JSON.parse(localStorage.getItem(LOCAL_KEY))||{packs:[]}}catch(e){return{packs:[]}}};
  const saveLocal=s=>{try{localStorage.setItem(LOCAL_KEY,JSON.stringify(s))}catch(e){}};
  function useLocal(){rows=(loadLocal().packs||[]);mode="local"}
  const nowIso=()=>new Date().toISOString();

  async function refresh(){
    if(mode!=="db")return useLocal();
    let q=await sb.from("earned_packs").select("*").eq("trip_id",tripId).order("earned_at");
    if(q.error)throw q.error;rows=q.data||[];
    try{let p=await sb.from("maui_link_photos").select("id",{count:"exact",head:true}).eq("trip_id",tripId);if(!p.error)photoCount=p.count||0}catch(e){}
  }

  // Copy anything opened or awarded on this device before the shared table existed.
  async function syncLocalToDb(){
    let s=loadLocal(),changed=false;
    for(const x of (s.packs||[]).filter(x=>!x.synced)){
      let {synced,...row}=x;
      let r=await sb.from("earned_packs").insert({...row,trip_id:tripId});
      // Already there (e.g. a Dad award copied up earlier): copy the opened cards if it's still unopened.
      if(r.error?.code==="23505"&&row.opened_at)await sb.from("earned_packs").update({card_ids:row.card_ids,opened_at:row.opened_at}).eq("trip_id",tripId).eq("traveler_name",row.traveler_name).eq("pack_key",row.pack_key).is("opened_at",null);
      if(!r.error||r.error.code==="23505"){x.synced=true;changed=true}
    }
    if(changed)saveLocal(s);
  }

  async function init(client,trip){
    sb=client;tripId=trip;
    if(!sb||!tripId)return useLocal();
    try{
      let probe=await sb.from("earned_packs").select("id").eq("trip_id",tripId).limit(1);
      if(probe.error)throw probe.error;
      mode="db";await syncLocalToDb();await refresh();
    }catch(e){
      console.warn("Card packs: saving on this device until SUPABASE-v016-CARD-PACKS.sql runs.",e);useLocal();
      try{let p=await sb.from("maui_link_photos").select("id",{count:"exact",head:true}).eq("trip_id",tripId);if(!p.error)photoCount=p.count||0}catch(e2){}
    }
  }

  async function insertRow(row){
    if(mode==="db"){let r=await sb.from("earned_packs").insert({...row,trip_id:tripId});if(r.error)throw r.error;return refresh()}
    let s=loadLocal();s.packs=s.packs||[];
    if(s.packs.some(x=>x.traveler_name===row.traveler_name&&x.pack_key===row.pack_key))throw new Error("Already saved");
    s.packs.push(row);saveLocal(s);useLocal();
  }
  async function markOpened(row,ids){
    const patch={card_ids:ids,opened_at:nowIso()};
    if(mode==="db"){let r=await sb.from("earned_packs").update(patch).eq("id",row.id).is("opened_at",null).select("id");if(r.error)throw r.error;if(!r.data?.length)throw new Error("Already opened");return refresh()}
    let s=loadLocal(),x=(s.packs||[]).find(p=>p.traveler_name===row.traveler_name&&p.pack_key===row.pack_key);
    if(!x||x.opened_at)throw new Error("Already opened");Object.assign(x,patch,{synced:false});saveLocal(s);useLocal();
  }

  const mine=p=>rows.filter(x=>x.traveler_name===p);
  const openedPacks=p=>mine(p).filter(x=>x.opened_at&&x.pack_key!=="starter").sort((a,b)=>String(a.opened_at).localeCompare(String(b.opened_at)));
  const hasStarter=p=>mine(p).some(x=>x.pack_key==="starter");

  // progress = {questFound, questPoints, wildlifeFound}; returns every pack with its state for this traveler.
  function status(person,progress,now){
    const today=hawaiiDate(now||new Date()),have=mine(person);
    // Every 15-point pack already reached, the next one to aim for, and any older points pack already saved.
    const pts=progress.questPoints||0,steps=new Set();
    for(let n=POINT_STEP;n<=(Math.floor(pts/POINT_STEP)+1)*POINT_STEP;n+=POINT_STEP)steps.add(n);
    have.forEach(x=>{let m=/^points-(\d+)$/.exec(String(x.pack_key));if(m)steps.add(+m[1])});
    const all=[...PACKS,...[...steps].sort((a,b)=>a-b).map(pointsPack)];
    const list=all.map(p=>{
      const row=have.find(x=>x.pack_key===p.key);
      let earned=!!row,detail="";
      if(!row){
        if(p.date)earned=today>=p.date;
        if(p.quest){earned=progress.questFound>=p.quest;detail=`${Math.min(progress.questFound,p.quest)}/${p.quest} found`}
        if(p.points){const pts=progress.questPoints||0;earned=pts>=p.points;detail=`${Math.min(pts,p.points)}/${p.points} pts`}
        if(p.wildlife){earned=progress.wildlifeFound>=p.wildlife;detail=`${Math.min(progress.wildlifeFound,p.wildlife)}/${p.wildlife} found`}
        if(p.photos){earned=photoCount>=p.photos;detail=`${Math.min(photoCount,p.photos)}/${p.photos} photos`}
      }
      const opened=!!row?.opened_at;
      return{...p,row,earned,opened,ready:earned&&!opened,detail};
    });
    have.filter(x=>String(x.pack_key).startsWith("bonus")).forEach(row=>list.push({...BONUS,key:row.pack_key,name:row.pack_name||BONUS.name,note:row.note,row,earned:true,opened:!!row.opened_at,ready:!row.opened_at}));
    return list;
  }
  const readyPacks=(person,progress,now)=>status(person,progress,now).filter(p=>p.ready);

  // Card counts the traveler owns. extraIds covers a starter pack opened before v0.16.
  function collection(person,extraIds){
    const counts={},add=id=>{counts[id]=(counts[id]||0)+1};
    if(extraIds&&!hasStarter(person))extraIds.forEach(add);
    mine(person).filter(x=>x.opened_at).forEach(x=>(x.card_ids||[]).forEach(add));
    return counts;
  }

  async function openPack(person,packKey,cards,progress,extraIds){
    if(busy)return null;busy=true;
    try{
      try{await refresh()}catch(e){}
      const pack=status(person,progress).find(p=>p.key===packKey&&p.ready);
      if(!pack)return null;
      const byId=Object.fromEntries(cards.map(c=>[c.id,c]));
      const before=collection(person,extraIds);
      const ids=rollPack(poolFor(person,cards),openedPacks(person),byId,Math.random,before);
      if(pack.row)await markOpened(pack.row,ids);
      else await insertRow({traveler_name:person,pack_key:pack.key,pack_name:pack.name,card_ids:ids,earned_at:nowIso(),opened_at:nowIso()});
      const seen={...before};
      return{pack,cards:ids.map(id=>{let isNew=!seen[id];seen[id]=(seen[id]||0)+1;return{id,isNew,count:seen[id]}})};
    }finally{busy=false}
  }

  async function recordStarter(person,ids){
    if(hasStarter(person)||!ids.length)return;
    try{await insertRow({traveler_name:person,pack_key:"starter",pack_name:"Starter Pack",card_ids:ids,earned_at:nowIso(),opened_at:nowIso()})}catch(e){console.warn("Starter pack save:",e)}
  }

  // Dad's manual award. Named packs once per traveler; bonus packs as often as Dad likes.
  async function award(person,packKey,note,by){
    if(!CONFIG.collectors.includes(person))return false;
    try{await refresh()}catch(e){}
    let key=packKey,name;
    if(packKey==="bonus"){key=`bonus-${Date.now()}`;name=note?`Dad Bonus · ${note}`.slice(0,60):BONUS.name}
    else{let p=PACKS.find(x=>x.key===packKey);if(!p||mine(person).some(x=>x.pack_key===packKey))return false;name=p.name}
    await insertRow({traveler_name:person,pack_key:key,pack_name:name,note:note||null,awarded_by:by||null,card_ids:null,earned_at:nowIso(),opened_at:null});
    return true;
  }
  const canAward=(person,packKey)=>packKey==="bonus"||!mine(person).some(x=>x.pack_key===packKey);

  const api={CONFIG,PACKS,BONUS,POINT_STEP,pointsPack,packInfo,rank,isHit,isHigh,poolFor,rollPack,hawaiiDate,init,refresh,status,readyPacks,collection,openPack,recordStarter,award,canAward,hasStarter,
    get mode(){return mode},get busy(){return busy},get photoCount(){return photoCount}};
  global.LoyPacks=api;
  if(typeof module!=="undefined")module.exports=api;
  try{useLocal()}catch(e){}
})(typeof window!=="undefined"?window:globalThis);
