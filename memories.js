/* Shared-link trip photos: names are attribution, not authenticated identities. */
const MauiPhotos = (() => {
  const BUCKET = 'maui-family-private', MAX_BATCH = 20, PEOPLE = ['Bryant','Bryson','Bennett','Brooks'];
  let client, tripId, repaint = () => {}, viewer, rows = [], notice = '', busy = false;
  let person = '', day = '', limit = 60, more = false, epoch = 0, loading = false;
  let ready = null; // photos fetched and waiting for a tap on the share sheet: {chunks, next, total}
  const SHARE_IOS = 20, SHARE_ANDROID = 10, SHARE_BYTES = 45*1024*1024, MAX_SAVE = 200; // Chrome on Android shares at most 10 files / 50 MB at once
  const ANDROID = /Android/i.test(globalThis.navigator?.userAgent||'');
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const canUpload = () => PEOPLE.includes(viewer);
  const canRead = () => canUpload() || viewer === 'Guest';
  const days = () => Array.from({length:9},(_,i)=>`2026-11-${19+i}`);
  async function init(config,id,paint) {
    tripId=id; repaint=paint;
    client=supabase.createClient(config.url,config.key,{auth:{storageKey:'loy-link-photos',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    if(canRead()) await load();
  }
  function setViewer(next) {
    if(viewer===next)return;
    viewer=next;epoch++;rows=[];more=false;notice='';loading=false;ready=null;
    if(client&&canRead())void load();
  }
  async function load() {
    if(!client||!canRead())return;
    const run=++epoch;loading=true;notice='';repaint();
    try {
      let query=client.from('maui_link_photos').select('id,person,trip_day,activity,caption,storage_path,created_at').eq('trip_id',tripId).order('created_at',{ascending:false}).order('id').limit(limit+1);
      if(person)query=query.eq('person',person);
      if(day)query=query.eq('trip_day',day);
      const result=await query;if(result.error)throw result.error;
      const data=result.data.slice(0,limit);
      const signed=data.length?await client.storage.from(BUCKET).createSignedUrls(data.map(r=>r.storage_path),300):{data:[],error:null};
      if(signed.error)throw signed.error;
      if(run!==epoch||!canRead())return;
      more=result.data.length>limit;rows=data.map((r,i)=>({...r,url:signed.data[i]?.signedUrl}));
      if(rows.some(r=>!r.url))notice='Some photos could not load. Tap Refresh to try again.';
    } catch(e) {
      if(run===epoch){rows=[];notice='Photos could not load. Check your connection and try Refresh. If this is the first use after updating, Bryant needs to apply the v014 photo update once.';}
      console.warn('Trip photos:',e.message);
    } finally {if(run===epoch){loading=false;repaint();}}
  }
  function view() {
    if(!canRead())return '<section class="card"><h2>Trip photos</h2><p>Pick your name to open the trip gallery.</p></section>';
    if(!client)return '<section class="card"><h2>Trip photos</h2><p>Waiting for the trip connection. Check your connection and reload the app.</p></section>';
    return `<section class="card memories"><h2>Trip photos</h2><p>Capture the trip, one memory at a time.</p><p role="status" aria-live="polite">${esc(notice)}</p>
    ${canUpload()?`<p>Uploading as <b>${esc(viewer)}</b>. Change your profile at the top to switch names.</p><form id="photo-upload"><fieldset ${busy?'disabled':''}><label>Take a photo<input name="camera" type="file" accept="image/*" capture="environment"></label><label>Or choose photos<input name="library" type="file" accept="image/*" multiple></label><p class="sub">Pick up to ${MAX_BATCH} photos at once, each up to 40 MB. The caption, day and activity go on every photo in the batch. Keep the app open until it finishes. Shared copies are resized; keep originals on your phone. If HEIC cannot open, choose a JPEG copy.</p><label>Caption (optional)<input name="caption" maxlength="500"></label><label>Trip day (optional)<select name="trip_day"><option value="">No day</option>${days().map(d=>`<option>${d}</option>`).join('')}</select></label><label>Activity (optional)<input name="activity" maxlength="100" placeholder="Beach, surf, Hāna…"></label><button>${busy?'Uploading…':'Upload photos'}</button></fieldset></form>`:'<p class="guest-readonly">Guest view · browse photos without changing anything.</p>'}</section>
    <section class="card memories"><h3>Trip gallery</h3><div class="photo-filters"><label>Person<select id="photo-person"><option value="">Everyone</option>${PEOPLE.map(p=>`<option ${person===p?'selected':''}>${p}</option>`).join('')}</select></label><label>Day<select id="photo-day"><option value="">All days</option>${days().map(d=>`<option ${day===d?'selected':''}>${d}</option>`).join('')}</select></label><button id="photo-refresh" ${busy?'disabled':''}>Refresh</button>${rows.length?`<button id="photo-save-all" ${busy?'disabled':''}>⬇ Save these photos</button>`:''}</div>${rows.length?`<p class="sub">Save these photos gets every photo that matches the Person and Day picks. On iPhone, pick Save Images for Photos or Drive for Google Drive. On Android, download them to the phone or share them to Drive.</p>`:''}${notice&&!ready?`<p class="photo-note">${esc(notice)}</p>`:''}${readyPanel()}<p class="sub">Photo links refresh for five minutes. Tap Refresh if an image expires.</p>${loading?'<p role="status">Loading photos…</p>':''}<div class="memory-grid">${rows.map(r=>`<figure>${r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(r.url)}" alt="${esc(r.caption||r.activity||'Trip photo')}" loading="lazy" referrerpolicy="no-referrer"></a>`:'<p>Photo unavailable</p>'}<figcaption><b>${esc(r.person)}</b>${r.trip_day?` · ${esc(r.trip_day)}`:''}<p>${esc(r.activity)}</p><p>${esc(r.caption)}</p>${r.url?`<button type="button" class="photo-save" data-photo-save="${esc(r.id)}" ${busy?'disabled':''}>⬇ Save photo</button>`:''}${canUpload()?`<button type="button" data-photo-delete="${esc(r.id)}" ${busy?'disabled':''}>Delete photo</button>`:''}</figcaption></figure>`).join('')}</div>${!rows.length&&!loading?'<p>No photos to show yet. Upload one or try another filter.</p>':''}${more?'<button id="photo-more">Show more</button>':''}</section>`;
  }
  async function normalize(file) {
    if(!file||file.size===0||file.size>40*1024*1024)throw Error('Choose a non-empty photo under 40 MB.');
    if(file.type&&!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type))throw Error('Choose a JPEG, PNG, WebP or HEIC photo.');
    const url=URL.createObjectURL(file);
    try {
      const img=new Image();img.src=url;
      try{await img.decode();}catch{throw Error('This photo cannot open here. Try a JPEG copy from your phone.');}
      if(img.naturalWidth*img.naturalHeight>100000000)throw Error('This photo is too large. Choose a smaller copy.');
      const scale=Math.min(1,2560/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.88));
      canvas.width=canvas.height=0;
      if(!blob||blob.size>15*1024*1024)throw Error('Unable to prepare photo. Choose a smaller copy.');return blob;
    }finally{URL.revokeObjectURL(url);}
  }
  async function saveOne(file,author,details) {
    const blob=await normalize(file);
    if(!canUpload()||viewer!==author)throw Error('Your selected name changed. Choose the photos again under your name.');
    const path=`${tripId}/shared/${crypto.randomUUID()}.jpg`;
    const saved=await client.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:false,cacheControl:'60'});
    if(saved.error)throw Error('Upload failed. Check your connection and try again.');
    const meta=await client.from('maui_link_photos').insert({trip_id:tripId,person:author,storage_path:path,...details});
    if(meta.error){const cleanup=await client.storage.from(BUCKET).remove([path]);throw Error(cleanup.error?'Photo details failed to save. Ask Bryant to remove an unlisted upload from storage before retrying.':'Photo details failed to save. The upload was removed; please try again.');}
  }
  async function upload(form) {
    if(busy||!canUpload())return;
    const inputs=new FormData(form),author=viewer;
    const picked=[...inputs.getAll('camera'),...inputs.getAll('library')].filter(f=>f&&typeof f!=='string'&&f.size>0);
    if(!picked.length){notice='Take a photo or choose some from your phone first.';repaint();return;}
    const files=picked.slice(0,MAX_BATCH),skipped=picked.length-files.length;
    const details={caption:String(inputs.get('caption')||''),trip_day:inputs.get('trip_day')||null,activity:String(inputs.get('activity')||'')};
    busy=true;form.querySelector('fieldset').disabled=true;
    let ok=0;const failed=[];
    try {
      for(let i=0;i<files.length;i++){
        if(!canUpload()||viewer!==author){failed.push(`Your selected name changed, so ${files.length-i} ${files.length-i===1?'photo was':'photos were'} not sent`);break;}
        notice=files.length>1?`Uploading ${i+1} of ${files.length}…`:'Uploading photo…';repaint();
        try{await saveOne(files[i],author,details);ok++;}
        catch(e){failed.push(`${files[i].name||'Photo '+(i+1)}: ${e.message}`);}
      }
    }finally{
      if(ok)await load();
      const parts=[];
      if(files.length===1)parts.push(ok?'Photo saved to the trip gallery.':failed[0].replace(/^.*?: /,''));
      else if(ok===files.length)parts.push(`All ${ok} photos saved to the trip gallery.`);
      else parts.push(`Saved ${ok} of ${files.length} photos.`);
      if(failed.length&&files.length>1)parts.push(`Not saved: ${failed.join('; ')}`);
      if(skipped>0)parts.push(`Only ${MAX_BATCH} go up at a time, so ${skipped} more ${skipped===1?'was':'were'} left out. Choose ${skipped===1?'it':'them'} next.`);
      notice=parts.join(' ');busy=false;repaint();
    }
  }
  async function removePhoto(id) {
    if(busy||!canUpload())return;
    const photo=rows.find(r=>r.id===id);if(!photo)return;
    if(!confirm(`Delete this photo from ${photo.person}${photo.caption?' (“'+photo.caption+'”)':''}? This removes the shared copy for everyone. Your phone original is unchanged.`))return;
    busy=true;notice='Deleting photo…';repaint();
    try {
      const removed=await client.storage.from(BUCKET).remove([photo.storage_path]);
      if(removed.error)throw Error('Could not delete the photo. Check your connection and confirm the v015 SQL update has been applied.');
      if(!removed.data?.some(item=>item.name===photo.storage_path)) {
        // Storage can report no error when RLS filters out the requested object.
        const check=await client.storage.from(BUCKET).createSignedUrl(photo.storage_path,60);
        if(!check.error||!/not found|does not exist/i.test(check.error.message||''))
          throw Error('The photo was not deleted. Apply the v015 SQL update once, then try again.');
      }
      const deleted=await client.from('maui_link_photos').delete().eq('trip_id',tripId).eq('id',photo.id).select('id');
      if(deleted.error||!deleted.data?.some(item=>item.id===photo.id))
        throw Error('The image was removed, but its gallery entry could not be cleared. Apply the v015 SQL update and tap Delete photo again to finish.');
      await load();notice='Photo deleted.';
    }catch(e){notice=e.message;}
    finally{busy=false;repaint();}
  }

  /* Saving photos: read-only. Downloads copies of the shared images; never changes photos, cards, points or packs. */
  function readyPanel() {
    if(!ready)return '';
    const n=ready.total,one=n===1,chunk=ready.chunks[ready.next]||[],start=ready.chunks.slice(0,ready.next).reduce((t,c)=>t+c.length,0);
    const range=chunk.length===n?(one?'':` ${n}`):` ${start+1}–${start+chunk.length} of ${n}`;
    const shareBtn=ready.share&&chunk.length?`<button type="button" id="photo-share-next">${ANDROID?'↗ Share to Drive or an app':'⬇ Save'}${ANDROID?(chunk.length===n?'':` (${start+1}–${start+chunk.length} of ${n})`):` ${one?'photo':'photos'}${range}`}</button>`:'';
    const dlBtn=`<button type="button" id="photo-download-now" class="${ready.share&&!ANDROID?'photo-quiet':''}">⬇ Download ${one?'photo':`${n} photos`} to this phone</button>`;
    const help=ANDROID
      ?`Download puts ${one?'it':'them'} in your phone's Downloads folder, where Gallery and Google Photos can see ${one?'it':'them'}.${one?'':' If Chrome asks to allow several downloads, tap Allow.'}${ready.share?` Share opens the share sheet so you can pick Drive${ready.chunks.length>1?`, ${SHARE_ANDROID} at a time`:''}.`:''}`
      :ready.share?`Tap Save to open the share sheet, then pick Save ${one?'Image':'Images'} or Drive.${ready.chunks.length>1?` They go ${SHARE_IOS} at a time so the phone doesn't run out of memory.`:''} Download instead puts ${one?'it':'them'} in the Files app.`
      :`Download puts ${one?'it':'them'} in your phone's downloads.`;
    return `<div class="photo-ready" role="status"><p><b>${one?'Your photo is ready.':`${n} photos are ready.`}</b> ${help}</p>${ANDROID?dlBtn+shareBtn:shareBtn+dlBtn}<button type="button" id="photo-share-cancel" class="photo-quiet">Done</button></div>`;
  }
  const safeName = value => String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  function fileName(r,used) {
    const date=r.trip_day||String(r.created_at||'').slice(0,10)||'trip';
    let base=['maui',date,safeName(r.person)||'photo',safeName(r.activity).slice(0,24)].filter(Boolean).join('-'),name=`${base}.jpg`,n=2;
    while(used.has(name))name=`${base}-${n++}.jpg`;
    used.add(name);return name;
  }
  async function fetchPhoto(r,used) {
    const got=await client.storage.from(BUCKET).download(r.storage_path);
    if(got.error||!got.data)throw Error('A photo could not download. Check your connection and try again.');
    return new File([got.data],fileName(r,used),{type:'image/jpeg',lastModified:Date.parse(r.created_at)||Date.now()});
  }
  const onPhone = () => ANDROID||!!window.matchMedia?.('(pointer:coarse)').matches;
  const canShareFiles = files => {try{return !!(navigator.share&&navigator.canShare&&navigator.canShare({files}));}catch{return false;}};
  function shareChunks(files) {
    const max=ANDROID?SHARE_ANDROID:SHARE_IOS,chunks=[];let cur=[],bytes=0;
    for(const f of files){if(cur.length&&(cur.length>=max||bytes+f.size>SHARE_BYTES)){chunks.push(cur);cur=[];bytes=0;}cur.push(f);bytes+=f.size;}
    if(cur.length)chunks.push(cur);return chunks;
  }
  const pause = ms => new Promise(r=>setTimeout(r,ms));
  async function downloadMany(files) {
    // One file at a time from blob links, so phones save real JPEGs (no zip to open).
    for(let i=0;i<files.length;i++){
      if(files.length>1){notice=`Downloading ${i+1} of ${files.length}…`;repaint();}
      downloadBlob(files[i],files[i].name);
      if(i<files.length-1)await pause(700);
    }
  }
  function downloadBlob(blob,name) {
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
  function crc32(bytes){let c=0xFFFFFFFF;for(let i=0;i<bytes.length;i++)c=CRC[(c^bytes[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
  async function zip(files) {
    // Plain "stored" zip (JPEGs are already compressed), built in the browser with no library.
    const parts=[],central=[],enc=new TextEncoder();let offset=0;
    const now=new Date(),dosTime=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1),dosDate=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
    for(const f of files){
      const data=new Uint8Array(await f.arrayBuffer()),name=enc.encode(f.name),crc=crc32(data);
      const h=new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,dosTime,true);h.setUint16(12,dosDate,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);h.setUint16(28,0,true);
      const c=new DataView(new ArrayBuffer(46));
      c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,dosTime,true);c.setUint16(14,dosDate,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);
      parts.push(h.buffer,name,data);central.push(c.buffer,name);offset+=30+name.length+data.length;
    }
    const size=central.reduce((n,b)=>n+b.byteLength,0),e=new DataView(new ArrayBuffer(22));
    e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);
    return new Blob([...parts,...central,e.buffer],{type:'application/zip'});
  }
  function shareReady() {
    // Called straight from a tap so the phone allows the share sheet.
    if(!ready||!ready.share)return;
    const current=ready,chunk=current.chunks[current.next];
    let started;
    try{started=navigator.share({files:chunk});}catch(e){started=Promise.reject(e);}
    started.then(()=>{
      if(ready!==current)return;
      current.next++;
      if(current.next>=current.chunks.length){notice=current.total===1?'Done with that photo.':`All ${current.total} photos sent to the share sheet.`;ready=null;}
      else notice=`Done with ${current.chunks.slice(0,current.next).reduce((n,c)=>n+c.length,0)} of ${current.total}. Tap the button for the next set.`;
      repaint();
    }).catch(e=>{
      if(ready!==current)return;
      if(e?.name==='AbortError'){notice='Share closed. Tap the button again whenever you are ready.';repaint();return;}
      current.share=false;notice='The share sheet would not open on this phone, so tap Download instead.';repaint();
    });
  }
  async function downloadReady() {
    if(!ready||busy)return;
    const current=ready;busy=true;
    try{
      await downloadMany(current.files);
      notice=current.total===1?'Photo downloaded. Look in your Downloads.':`Downloaded ${current.total} photos. Look in your Downloads.`;
      if(ready===current)ready=null;
    }catch{notice='The download did not start. Tap Download to try again.';}
    finally{busy=false;repaint();}
  }
  async function deliver(files,zipName) {
    if(onPhone()) {
      ready={files,chunks:shareChunks(files),next:0,total:files.length,share:canShareFiles(files.slice(0,1))};notice='';
      return;
    }
    if(files.length===1){downloadBlob(files[0],files[0].name);notice='Photo downloaded.';return;}
    notice='Packing the photos into one zip file…';repaint();
    downloadBlob(await zip(files),zipName);notice=`Downloaded ${files.length} photos in one zip file.`;
  }
  async function savePhoto(id) {
    if(busy||!client||!canRead())return;
    const r=rows.find(x=>x.id===id);if(!r)return;
    busy=true;ready=null;notice='Getting the photo…';repaint();
    try{await deliver([await fetchPhoto(r,new Set())],'');}
    catch(e){notice=e.message;}
    finally{busy=false;repaint();}
  }
  async function saveAll() {
    if(busy||!client||!canRead())return;
    busy=true;ready=null;notice='Finding the photos…';repaint();
    const run=epoch;
    try {
      let query=client.from('maui_link_photos').select('id,person,trip_day,activity,storage_path,created_at').eq('trip_id',tripId).order('created_at',{ascending:true}).order('id').limit(MAX_SAVE+1);
      if(person)query=query.eq('person',person);
      if(day)query=query.eq('trip_day',day);
      const result=await query;if(result.error)throw Error('Photos could not load. Check your connection and try again.');
      const list=result.data.slice(0,MAX_SAVE),files=[],used=new Set(),missed=[];
      if(!list.length){notice='No photos match these picks yet.';return;}
      for(let i=0;i<list.length;i++){
        if(run!==epoch)return;
        notice=`Getting photo ${i+1} of ${list.length}…`;repaint();
        try{files.push(await fetchPhoto(list[i],used));}catch{missed.push(i+1);}
      }
      if(run!==epoch)return;
      if(!files.length)throw Error('The photos could not download. Check your connection and try again.');
      const zipName=`maui-photos-${safeName(person)||'everyone'}-${day||'all-days'}.zip`;
      await deliver(files,zipName);
      const extra=[];
      if(missed.length)extra.push(`${missed.length} ${missed.length===1?'photo':'photos'} could not download; tap Save these photos again to retry.`);
      if(result.data.length>MAX_SAVE)extra.push(`Only the first ${MAX_SAVE} go at once. Pick a day to get the rest.`);
      if(extra.length)notice=[notice,...extra].filter(Boolean).join(' ');
    }catch(e){notice=e.message;}
    finally{busy=false;repaint();}
  }
  function bind() {
    document.querySelectorAll("[data-photo-save]").forEach(button=>button.onclick=()=>void savePhoto(button.dataset.photoSave));
    const all=document.getElementById('photo-save-all');if(all)all.onclick=()=>void saveAll();
    const share=document.getElementById('photo-share-next');if(share)share.onclick=shareReady;
    const dlNow=document.getElementById('photo-download-now');if(dlNow)dlNow.onclick=()=>void downloadReady();
    const cancel=document.getElementById('photo-share-cancel');if(cancel)cancel.onclick=()=>{ready=null;notice='';repaint();};
    document.querySelectorAll("[data-photo-delete]").forEach(button=>button.onclick=()=>void removePhoto(button.dataset.photoDelete));
    const form=document.getElementById('photo-upload');if(form)form.onsubmit=e=>{e.preventDefault();void upload(form);};
    const p=document.getElementById('photo-person');if(p)p.onchange=()=>{person=p.value;limit=60;ready=null;void load();};
    const d=document.getElementById('photo-day');if(d)d.onchange=()=>{day=d.value;limit=60;ready=null;void load();};
    const refresh=document.getElementById('photo-refresh');if(refresh)refresh.onclick=()=>void load();
    const next=document.getElementById('photo-more');if(next)next.onclick=()=>{limit+=60;void load();};
  }
  return {init,setViewer,view,bind};
})();
