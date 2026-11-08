/* Photos use their own authenticated client. Legacy planning keeps its existing client. */
const MauiPhotos = (() => {
  const BUCKET = 'maui-family-private', PEOPLE = ['Bryant','Bryson','Bennett','Brooks'];
  let client, tripId, repaint = () => {}, viewer, member = null, rows = [], notice = '', busy = false;
  let person = '', day = '', limit = 60, more = false, epoch = 0;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const allowed = () => PEOPLE.includes(viewer);
  const days = () => Array.from({length:9},(_,i)=>`2026-11-${19+i}`);
  function clear() { epoch++; member = null; rows = []; more = false; }
  async function init(config, id, paint) {
    tripId = id; repaint = paint;
    client = supabase.createClient(config.url, config.key, {auth:{storageKey:'loy-private-photos-auth',detectSessionInUrl:false}});
    client.auth.onAuthStateChange(() => { clear(); if(allowed()) setTimeout(load,0); });
    if(allowed()) await load();
  }
  function setViewer(next) {
    if(viewer === next) return;
    viewer = next; clear(); notice = ''; busy = false;
    if(client && allowed()) void load();
  }
  async function load() {
    if(!client || !allowed()) return;
    const run = ++epoch; rows = []; member = null; notice = ''; repaint();
    try {
      const {data:{user},error:authError} = await client.auth.getUser();
      if(run !== epoch) return;
      if(!user) return;
      if(authError) throw authError;
      const m = await client.from('maui_photo_members').select('person,user_id').eq('trip_id',tripId).eq('user_id',user.id).maybeSingle();
      if(m.error) throw m.error;
      if(run !== epoch) return;
      if(!m.data) { notice = 'This account has not been approved for family photos. Ask Bryant to finish setup.'; return; }
      member = m.data;
      let query = client.from('maui_trip_photos').select('id,person,trip_day,activity,caption,storage_path,created_at').eq('trip_id',tripId).order('created_at',{ascending:false}).order('id').limit(limit+1);
      if(person) query = query.eq('person',person);
      if(day) query = query.eq('trip_day',day);
      const result = await query;
      if(result.error) throw result.error;
      const data = result.data.slice(0,limit);
      const signed = data.length ? await client.storage.from(BUCKET).createSignedUrls(data.map(r=>r.storage_path),300) : {data:[],error:null};
      if(signed.error) throw signed.error;
      if(run !== epoch || !allowed()) return;
      more = result.data.length > limit;
      rows = data.map((r,i)=>({...r,url:signed.data[i]?.signedUrl}));
      if(rows.some(r=>!r.url)) notice = 'Some photos could not load. Tap Refresh to try again.';
    } catch(e) { if(run === epoch) notice = 'Photos could not load. Check your connection and family photo setup, then refresh.'; console.warn('Private photos:',e.message); }
    finally { if(run === epoch) repaint(); }
  }
  function view() {
    if(!allowed()) return '<section class="card"><h2>Family photos</h2><p>Private photos are available only to Bryant, Bryson, Bennett and Brooks with a family photo sign-in. Guest remains read-only and cannot view private photos.</p></section>';
    if(!client) return '<section class="card"><h2>Family photos</h2><p>Photos are waiting for the trip connection. Check your connection and reload the app.</p></section>';
    return `<section class="card memories"><h2>Family photos</h2><p>Capture the trip, one memory at a time. Photos stay private to approved family accounts.</p><p role="status" aria-live="polite">${esc(notice)}</p>
      ${!member?`<form id="photo-login"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button ${busy?'disabled':''}>${busy?'Signing in…':'Family photo sign-in'}</button></form><p class="sub">Use the separate family account Bryant sets up for you. The guest code and profile picker do not unlock photos.</p><button id="photo-logout">Clear photo sign-in on this device</button>`:
      `<p>Signed in as <b>${esc(member.person)}</b> · uploads are credited to this account.</p><button id="photo-logout" ${busy?'disabled':''}>Sign out of photos</button><form id="photo-upload"><label>Take a photo<input name="camera" type="file" accept="image/*" capture="environment"></label><label>Or choose a photo<input name="library" type="file" accept="image/*"></label><p class="sub">Choose one photo per upload, up to 40 MB. Photos are resized for sharing; keep originals on your phone. If HEIC cannot open, choose a JPEG copy.</p><label>Caption (optional)<input name="caption" maxlength="500"></label><label>Trip day (optional)<select name="trip_day"><option value="">No day</option>${days().map(d=>`<option>${d}</option>`).join('')}</select></label><label>Activity (optional)<input name="activity" maxlength="100" placeholder="Beach, surf, Hāna…"></label><button ${busy?'disabled':''}>${busy?'Saving photo…':'Upload photo'}</button></form>`}</section>
      ${member?`<section class="card memories"><h3>Trip gallery</h3><div class="photo-filters"><label>Person<select id="photo-person"><option value="">Everyone</option>${PEOPLE.map(p=>`<option ${person===p?'selected':''}>${p}</option>`).join('')}</select></label><label>Day<select id="photo-day"><option value="">All days</option>${days().map(d=>`<option ${day===d?'selected':''}>${d}</option>`).join('')}</select></label><button id="photo-refresh">Refresh</button></div><p class="sub">Photo links expire after five minutes. Refresh to reload them.</p><div class="memory-grid">${rows.map(r=>`<figure>${r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(r.url)}" alt="${esc(r.caption||r.activity||'Trip photo')}" loading="lazy" referrerpolicy="no-referrer"></a>`:'<p>Photo unavailable</p>'}<figcaption><b>${esc(r.person)}</b>${r.trip_day?` · ${esc(r.trip_day)}`:''}<p>${esc(r.activity)}</p><p>${esc(r.caption)}</p></figcaption></figure>`).join('')}</div>${!rows.length?'<p>No photos to show yet. Upload one or try another filter.</p>':''}${more?'<button id="photo-more">Show more</button>':''}</section>`:''}`;
  }
  async function normalize(file) {
    if(!file || file.size === 0 || file.size > 40*1024*1024) throw Error('Choose a non-empty photo under 40 MB.');
    if(file.type && !/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) throw Error('Choose a JPEG, PNG, WebP or HEIC photo.');
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.src = url;
      try { await img.decode(); } catch { throw Error('This photo cannot open here. Try a JPEG copy from your phone.'); }
      if(img.naturalWidth*img.naturalHeight > 100000000) throw Error('This photo is too large. Choose a smaller copy.');
      const scale = Math.min(1,2560/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1,Math.round(img.naturalWidth*scale)); canvas.height = Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.88));
      if(!blob || blob.size > 15*1024*1024) throw Error('Unable to prepare photo. Choose a smaller copy.');
      return blob;
    } finally { URL.revokeObjectURL(url); }
  }
  async function upload(form) {
    if(busy || !allowed() || !member) return;
    const inputs = new FormData(form), camera = inputs.get('camera'), library = inputs.get('library');
    if(camera?.size && library?.size) { notice = 'Choose either the camera photo or the library photo, then upload.'; repaint(); return; }
    const file = camera?.size ? camera : library;
    const owner = {...member}, run = epoch;
    busy = true; notice = 'Preparing photo…'; form.querySelector('button').disabled = true;
    try {
      const blob = await normalize(file);
      if(run !== epoch || !allowed()) return;
      const auth = await client.auth.getUser();
      if(auth.error || auth.data.user?.id !== owner.user_id) throw Error('Your sign-in changed. Sign in again before uploading.');
      const path = `${tripId}/${owner.user_id}/${crypto.randomUUID()}.jpg`;
      const saved = await client.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:false,cacheControl:'60'});
      if(saved.error) throw Error('Photo upload failed. Check your connection and try again.');
      const meta = await client.from('maui_trip_photos').insert({trip_id:tripId,user_id:owner.user_id,person:owner.person,storage_path:path,caption:String(inputs.get('caption')||''),trip_day:inputs.get('trip_day')||null,activity:String(inputs.get('activity')||'')});
      if(meta.error) {
        const cleanup = await client.storage.from(BUCKET).remove([path]);
        throw Error(cleanup.error?'Photo details failed to save. Ask Bryant to remove an unlisted upload from storage before retrying.':'Photo details failed to save. The upload was removed; please try again.');
      }
      if(run === epoch) { await load(); notice = 'Photo saved to the family gallery.'; }
    } catch(e) { if(run === epoch) notice = e.message; }
    finally { busy = false; repaint(); }
  }
  function bind() {
    const login = document.getElementById('photo-login');
    if(login) login.onsubmit = async e => {
      e.preventDefault(); if(busy || !allowed()) return;
      const data = new FormData(login); busy = true; notice = ''; repaint();
      try { const result = await client.auth.signInWithPassword({email:String(data.get('email')).trim(),password:String(data.get('password'))}); if(result.error) throw result.error; await load(); }
      catch { notice = 'Sign-in failed. Check the email and password for your family photo account.'; }
      finally { busy = false; repaint(); }
    };
    const logout = document.getElementById('photo-logout');
    if(logout) logout.onclick = async () => { clear(); repaint(); const result = await client.auth.signOut({scope:'local'}); notice = result.error?'Sign-out failed. Try again before sharing this device.':'Signed out of photos.'; repaint(); };
    const form = document.getElementById('photo-upload'); if(form) form.onsubmit = e => { e.preventDefault(); void upload(form); };
    const p = document.getElementById('photo-person'); if(p) p.onchange = () => { person = p.value; limit = 60; void load(); };
    const d = document.getElementById('photo-day'); if(d) d.onchange = () => { day = d.value; limit = 60; void load(); };
    const refresh = document.getElementById('photo-refresh'); if(refresh) refresh.onclick = () => void load();
    const next = document.getElementById('photo-more'); if(next) next.onclick = () => { limit += 60; void load(); };
  }
  return {init,setViewer,view,bind};
})();
