const FAMILY=["Bryant","Bryson","Bennett","Brooks"];
const itinerary=[
 {date:"Thu 11/19",title:"Arrival Day",type:"anchor",events:["✈️ PNS 6:00 AM → ATL → OGG 2:29 PM","🚙 Hertz Jeep pickup · 3:30 PM","🛒 Costco grocery + cooler run","🏨 Westin Ka'anapali Ocean Resort Villas"]},
 {date:"Fri 11/20",title:"Move + Explore",type:"flex",events:["🥞 Breakfast + pool/beach at Westin","🏨 Westin checkout · 10:00 AM","🌴 Pick 1–2: beach, shore snorkel, easy hike, town exploring","🏠 Honua Kai K830 · available 4:00 PM","🌅 Sunset + easy dinner"]},
 {date:"Sat 11/21",title:"Haleakalā Sunrise",type:"anchor",events:["🌋 Sunrise reservation — target date","☕ Upcountry breakfast / exploring","🏖️ Flexible afternoon + recovery"]},
 {date:"Sun 11/22",title:"Flex Day",type:"flex",events:["🌊 Sleep in / resort / beach","✨ Choose from family Idea Pool"]},
 {date:"Mon 11/23",title:"Adventure Candidate",type:"flex",events:["🤿 Molokini candidate day","✨ Keep flexible until excursion is booked"]},
 {date:"Tue 11/24",title:"Flex Day",type:"flex",events:["✨ Pick 1–2 from Idea Pool"]},
 {date:"Wed 11/25",title:"Flex Day",type:"flex",events:["✨ Pick 1–2 from Idea Pool"]},
 {date:"Thu 11/26",title:"Final Maui Day",type:"anchor",events:["🏠 Honua Kai remains ours all day","🌴 Flexible Thanksgiving day","⛽ Fuel Jeep near OGG","🚙 Hertz return · 8:00 PM","✈️ OGG departure · 10:59 PM"]},
 {date:"Fri 11/27",title:"Travel Home",type:"anchor",events:["✈️ OGG → LAX → DFW → PNS 3:08 PM"]}
];
const ideas=[
 ["🏄","Family surf lesson","Active","4-person candidate"],
 ["🚗","Road to Hāna adventure","Full day","Waterfalls + stops"],
 ["🪂","Zipline","Active","Check age/weight rules"],
 ["🤿","West Maui shore snorkeling","Flexible","Easy repeat activity"],
 ["🥾","Kapalua Coastal Trail","Easy","Great move-day option"],
 ["🏖️","Kapalua Bay","Flexible","Beach + snorkel"],
 ["🍧","Best shave ice challenge","Food","Everyone rates it"],
 ["⛵","Sunset sail","Excursion","Family vote"],
 ["🌊","Boogie board beach day","Flexible","Low-cost fun"],
 ["😎","Nothing Day","Essential","Pool + beach + no schedule"]
];
const defaultPacking=[
 ["Chargers + cables","Everyone","Have it"],["Noise-canceling headphones","Everyone","Have it"],
 ["Underwear","Everyone","Pack"],["Shorts + shirts","Everyone","Pack"],["Swimsuits","Everyone","Pack"],
 ["Sunscreen","Family","Buy before"],["Snorkeling gear","Everyone","Check gear"],
 ["Sunglasses","Everyone","Pack"],["Hats","Everyone","Pack"],["Warm Haleakalā layers","Everyone","Pack"],
 ["Closed-toe shoes","Everyone","Pack"],["Sandals","Everyone","Pack"],["Toiletries","Everyone","Pack"],
 ["Medications / first aid","Family","Pack"],["Power banks","Family","Pack"],["Waterproof phone pouch","Family","Buy before"]
];
let page="home", packFilter="Everyone";
let packed=JSON.parse(localStorage.getItem("loy-packed")||"{}");
const save=()=>localStorage.setItem("loy-packed",JSON.stringify(packed));
const app=document.getElementById("app");
const hero=()=>`<header class="hero"><div class="eyebrow">Loy Travel · Maui 2026</div><h1>Nov 19–26</h1><p>Plan it. Live it. Remember it.</p><div class="people">${FAMILY.map(x=>`<span class="person">${x}</span>`).join("")}</div></header>`;
const nav=()=>`<nav class="nav">${[["home","⌂","Home"],["plan","☷","Plan"],["ideas","✦","Ideas"],["pack","✓","Packing"],["memories","◉","Memories"]].map(([p,i,l])=>`<button data-page="${p}" class="${page===p?"active":""}"><span class="icon">${i}</span>${l}</button>`).join("")}</nav>`;
function home(){return `${hero()}<main class="content"><div class="card trip-card"><div class="big">The four of us are going to Maui.</div><div class="meta">Westin → Honua Kai · Jeep · 8 days to explore</div></div><div class="section-title"><h2>Trip anchors</h2></div><div class="quick-grid"><button class="card quick" data-page="plan">🌋<strong>Haleakalā</strong><span>Target: Sat 11/21 sunrise</span></button><button class="card quick" data-page="ideas">🤿<strong>Molokini</strong><span>Compare + book excursion</span></button><button class="card quick" data-page="pack">🧳<strong>Are we packed?</strong><span>${Object.values(packed).filter(Boolean).length}/${defaultPacking.length} starter items checked</span></button><button class="card quick" data-page="ideas">🔥<strong>Family ideas</strong><span>Vote, save, pick 1–2</span></button></div><div class="section-title"><h2>First 3 days</h2></div>${itinerary.slice(0,3).map(dayCard).join("")}</main>`}
function dayCard(d){return `<div class="card day ${d.type==="anchor"?"anchor":""}"><div class="day-head"><div><strong>${d.date}</strong><div class="big">${d.title}</div></div><span class="badge">${d.type==="anchor"?"ANCHOR":"FLEX"}</span></div>${d.events.map(e=>`<div class="event">${e}</div>`).join("")}</div>`}
function plan(){return `${hero()}<main class="content"><h2 class="page-title">Trip Plan</h2><p class="note">Anchors are fixed or reservation-based. Flex days are intentionally interchangeable.</p>${itinerary.map(dayCard).join("")}</main>`}
function ideaPage(){return `${hero()}<main class="content"><h2 class="page-title">Family Idea Pool</h2><p class="note">These are candidates, not commitments. Next we'll add real per-person 🔥 / 👍 / 👎 voting.</p>${ideas.map((x,i)=>`<div class="card"><div class="big">${x[0]} ${x[1]}</div><div class="meta">${x[2]} · ${x[3]}</div><div class="idea-votes"><span class="vote">Bryant · ?</span><span class="vote">Bryson · ?</span><span class="vote">Bennett · ?</span><span class="vote">Brooks · ?</span></div></div>`).join("")}</main>`}
function packing(){const filters=["Everyone","Bryant","Bryson","Bennett","Brooks","Family"];return `${hero()}<main class="content"><h2 class="page-title">Pre-trip Packing</h2><p class="note">Goal: buy it at home, then make sure it actually reaches the suitcase.</p><div class="filter">${filters.map(f=>`<button data-filter="${f}" class="${packFilter===f?"active":""}">${f}</button>`).join("")}</div><div class="card">${defaultPacking.map((x,i)=>{if(packFilter!=="Everyone"&&x[1]!==packFilter&&x[1]!=="Everyone")return"";return `<div class="packing-row"><button class="check ${packed[i]?"done":""}" data-pack="${i}">${packed[i]?"✓":""}</button><div><strong>${x[0]}</strong><div class="meta">${x[1]}</div></div><span class="status">${x[2]}</span></div>`}).join("")}</div><div class="card"><strong>🛒 Maui Costco is separate</strong><div class="meta">Cooler, drinks, snacks and groceries belong on the arrival shopping list—not in the suitcase checklist.</div></div></main>`}
function memories(){return `${hero()}<main class="content"><h2 class="page-title">Memories</h2><div class="card empty">📸 This becomes the family trip journal once the adventure begins.<br><br>Photos, ratings and each person's favorite moments will live here.</div></main>`}
function render(){const body=page==="home"?home():page==="plan"?plan():page==="ideas"?ideaPage():page==="pack"?packing():memories();app.innerHTML=`<div class="shell">${body}${nav()}</div>`;document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{page=b.dataset.page;render()});document.querySelectorAll("[data-pack]").forEach(b=>b.onclick=()=>{packed[b.dataset.pack]=!packed[b.dataset.pack];save();render()});document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{packFilter=b.dataset.filter;render()})}
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
render();