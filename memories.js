/* Shared-link trip photos: names are attribution, not authenticated identities. */
const MauiPhotos = (() => {
  const BUCKET = 'maui-family-private', PEOPLE = ['Bryant','Bryson','Bennett','Brooks','Grandpa Rick'];
  let client, tripId, repaint = () => {}, viewer, rows = [], notice = '', busy = false;
  let person = '', day = '', limit = 60, more = false, epoch = 0, loading = false;
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
    viewer=next;epoch++;rows=[];more=false;notice='';loading=false;
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
    ${canUpload()?`<p>Uploading as <b>${esc(viewer)}</b>. Change your profile at the top to switch names.</p><form id="photo-upload"><fieldset ${busy?'disabled':''}><label>Take a photo<input name="camera" type="file" accept="image/*" capture="environment"></label><label>Or choose a photo<input name="library" type="file" accept="image/*"></label><p class="sub">Choose one photo per upload, up to 40 MB. Shared copies are resized; keep originals on your phone. If HEIC cannot open, choose a JPEG copy.</p><label>Caption (optional)<input name="caption" maxlength="500"></label><label>Trip day (optional)<select name="trip_day"><option value="">No day</option>${days().map(d=>`<option>${d}</option>`).join('')}</select></label><label>Activity (optional)<input name="activity" maxlength="100" placeholder="Beach, surf, Hāna…"></label><button>${busy?'Saving photo…':'Upload photo'}</button></fieldset></form>`:'<p class="guest-readonly">Guest view · browse photos without changing anything.</p>'}</section>
    <section class="card memories"><h3>Trip gallery</h3><div class="photo-filters"><label>Person<select id="photo-person"><option value="">Everyone</option>${PEOPLE.map(p=>`<option ${person===p?'selected':''}>${p}</option>`).join('')}</select></label><label>Day<select id="photo-day"><option value="">All days</option>${days().map(d=>`<option ${day===d?'selected':''}>${d}</option>`).join('')}</select></label><button id="photo-refresh" ${busy?'disabled':''}>Refresh</button></div><p class="sub">Photo links refresh for five minutes. Tap Refresh if an image expires.</p>${loading?'<p role="status">Loading photos…</p>':''}<div class="memory-grid">${rows.map(r=>`<figure>${r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(r.url)}" alt="${esc(r.caption||r.activity||'Trip photo')}" loading="lazy" referrerpolicy="no-referrer"></a>`:'<p>Photo unavailable</p>'}<figcaption><b>${esc(r.person)}</b>${r.trip_day?` · ${esc(r.trip_day)}`:''}<p>${esc(r.activity)}</p><p>${esc(r.caption)}</p>${canUpload()?`<button type="button" data-photo-delete="${esc(r.id)}" ${busy?'disabled':''}>Delete photo</button>`:''}</figcaption></figure>`).join('')}</div>${!rows.length&&!loading?'<p>No photos to show yet. Upload one or try another filter.</p>':''}${more?'<button id="photo-more">Show more</button>':''}</section>`;
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
      if(!blob||blob.size>15*1024*1024)throw Error('Unable to prepare photo. Choose a smaller copy.');return blob;
    }finally{URL.revokeObjectURL(url);}
  }
  async function upload(form) {
    if(busy||!canUpload())return;
    const inputs=new FormData(form),camera=inputs.get('camera'),library=inputs.get('library');
    if(camera?.size&&library?.size){notice='Choose either the camera photo or the library photo, then upload.';repaint();return;}
    const file=camera?.size?camera:library,author=viewer;
    busy=true;notice='Preparing photo…';form.querySelector('fieldset').disabled=true;
    try {
      const blob=await normalize(file);
      if(!canUpload()||viewer!==author)throw Error('Your selected name changed. Choose the photo again under your name.');
      const path=`${tripId}/shared/${crypto.randomUUID()}.jpg`;
      const saved=await client.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:false,cacheControl:'60'});
      if(saved.error)throw Error('Photo upload failed. Check your connection and try again.');
      const meta=await client.from('maui_link_photos').insert({trip_id:tripId,person:author,storage_path:path,caption:String(inputs.get('caption')||''),trip_day:inputs.get('trip_day')||null,activity:String(inputs.get('activity')||'')});
      if(meta.error){const cleanup=await client.storage.from(BUCKET).remove([path]);throw Error(cleanup.error?'Photo details failed to save. Ask Bryant to remove an unlisted upload from storage before retrying.':'Photo details failed to save. The upload was removed; please try again.');}
      await load();notice='Photo saved to the trip gallery.';
    }catch(e){notice=e.message;}
    finally{busy=false;repaint();}
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
  function bind() {
    document.querySelectorAll("[data-photo-delete]").forEach(button=>button.onclick=()=>void removePhoto(button.dataset.photoDelete));
    const form=document.getElementById('photo-upload');if(form)form.onsubmit=e=>{e.preventDefault();void upload(form);};
    const p=document.getElementById('photo-person');if(p)p.onchange=()=>{person=p.value;limit=60;void load();};
    const d=document.getElementById('photo-day');if(d)d.onchange=()=>{day=d.value;limit=60;void load();};
    const refresh=document.getElementById('photo-refresh');if(refresh)refresh.onclick=()=>void load();
    const next=document.getElementById('photo-more');if(next)next.onclick=()=>{limit+=60;void load();};
  }
  return {init,setViewer,view,bind};
})();
