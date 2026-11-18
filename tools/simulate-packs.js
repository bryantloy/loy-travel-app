// Simulates a trip of earned packs per traveler: node tools/simulate-packs.js [packs per traveler, default 11]
const P=require(require("path").join(__dirname,"..","packs.js"));const cat=require(require("path").join(__dirname,"..","card-catalog.json")).cards;
const byId=Object.fromEntries(cat.map(c=>[c.id,c]));const N=20000,PACKS=+process.argv[2]||11;
for(const who of ["Bryson","Bennett","Brooks","Bryant"]){
  const pool=P.poolFor(who,cat);const highPool=pool.filter(c=>P.isHigh(c.rarity));
  let tierTot={},uniq=0,highSeen=0,highNew=0,dupes=0,noHigh=0,maxHighInARow=0,legend=0,packsWithHit=0,specific={};
  for(let s=0;s<N;s++){let hist=[],owned={};let hs=new Set();let gotLeg=false;
    for(let i=0;i<PACKS;i++){const ids=P.rollPack(pool,hist,byId,Math.random,owned);hist.push({card_ids:ids});
      if(ids.some(id=>P.isHit(byId[id].rarity)))packsWithHit++;
      for(const id of ids){const r=byId[id].rarity;tierTot[r]=(tierTot[r]||0)+1;if(owned[id])dupes++;owned[id]=(owned[id]||0)+1;if(P.isHigh(r))hs.add(id);if(r==="legendary")gotLeg=true}}
    uniq+=Object.keys(owned).length;highSeen+=hs.size;if(!hs.size)noHigh++;if(gotLeg)legend++;
    for(const c of highPool){specific[c.id]=(specific[c.id]||0)+(owned[c.id]?1:0)}}
  const tot=PACKS*3;console.log(`\n${who}: pool ${pool.length} cards (${highPool.length} gold/epic/legendary), ${PACKS} packs = ${tot} cards`);
  console.log(' per trip by rarity:',Object.entries(tierTot).sort((a,b)=>P.rank(a[0])-P.rank(b[0])).map(([k,v])=>`${k} ${(v/N).toFixed(1)}`).join(', '));
  console.log(` unique ${ (uniq/N).toFixed(1)}, dupes ${(dupes/N).toFixed(1)}, distinct high-tier ${(highSeen/N).toFixed(2)}, zero high-tier ${(100*noHigh/N).toFixed(1)}%, any legendary ${(100*legend/N).toFixed(0)}%, packs with a rare+ ${(100*packsWithHit/N/PACKS).toFixed(0)}%`);
  console.log(' chance to own each high card:',highPool.map(c=>`${c.title} (${c.rarity}) ${(100*specific[c.id]/N).toFixed(0)}%`).join('; '));
}
