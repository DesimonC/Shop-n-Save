import {supabaseUrl,supabasePublishableKey} from './config.js';
const stores=['Tesco','Asda','Morrisons',"Sainsbury's",'Aldi','Lidl'];
const starter=['Chicken breasts (approx. 4)','Unsalted butter block','Milk (4 pints)','50/50 bread (800g)','KitKat 2 Finger (8 pack)','Eggs (12)','Yorkshire Tea or PG Tips','Washing-up liquid','Whiskas cat food (40 pouches)','Heinz tomato ketchup','Fruit cocktail tin','Frozen chunky chips','Tribute IPA','Jaffa Cakes','Beef mince (5% or 20%, label clearly)','Potatoes','Lily’s Kitchen dog food (12 tins)','Cheese block (approx. 400g)','Tinned potatoes','Bourbon biscuits'];
const key='desk-shop-n-save-draft-v1',snap='desk-shop-n-save-snapshot-v1';
const $=s=>document.querySelector(s);
function fresh(){return {items:starter.map((name,i)=>({id:i+1,name,prices:{}})),discount:false};}
function valid(d){return d&&Array.isArray(d.items)&&d.items.length<=25&&d.items.every(x=>typeof x.name==='string'&&x.prices&&typeof x.prices==='object');}
let state;try{state=JSON.parse(localStorage.getItem(key));if(!valid(state))state=fresh();}catch{state=fresh();}
const money=n=>'£'+n.toFixed(2);
const effective=(s,p)=>s==='Morrisons'&&state.discount?p*.85:p;
function persist(){try{localStorage.setItem(key,JSON.stringify(state));}catch{$('#message').textContent='Unable to save in this browser.';}}
function render(){
 $('#count').textContent='('+state.items.length+'/25)';$('#discount').checked=!!state.discount;
 const items=$('#items');items.replaceChildren();
 state.items.forEach(item=>{const row=document.createElement('div');row.className='item';const name=document.createElement('span');name.textContent=item.name;const del=document.createElement('button');del.className='secondary';del.textContent='Remove';del.setAttribute('aria-label','Remove '+item.name);del.onclick=()=>{state.items=state.items.filter(x=>x.id!==item.id);persist();render();};row.append(name,del);items.append(row);});
 const tbody=$('#prices');tbody.replaceChildren();let totals=stores.map(()=>0),counts=stores.map(()=>0);
 state.items.forEach(item=>{const tr=document.createElement('tr'),title=document.createElement('td');title.textContent=item.name;tr.append(title);
 const vals=stores.map(s=>{const v=item.prices[s];return v===undefined||v===null||v===''?null:Number(v);});const applicable=vals.map((v,i)=>v===null||!Number.isFinite(v)?null:effective(stores[i],v));const best=Math.min(...applicable.filter(v=>v!==null));
 stores.forEach((s,i)=>{const td=document.createElement('td');if(applicable[i]!==null&&applicable[i]===best)td.className='best';const input=document.createElement('input');input.type='number';input.min='0';input.step='0.01';input.inputMode='decimal';input.placeholder='—';input.setAttribute('aria-label',item.name+' price at '+s);input.value=vals[i]===null?'':String(vals[i]);input.addEventListener('change',()=>{const n=input.value.trim()===''?null:Number(input.value);if(item.priceNotes)delete item.priceNotes[s];if(n===null)delete item.prices[s];else if(Number.isFinite(n)&&n>=0&&n<=100000)item.prices[s]=Math.round(n*100)/100;else{alert('Enter a valid non-negative price.');}persist();render();});if(item.priceNotes?.[s]){input.title='Historical '+item.priceNotes[s].date+' · '+item.priceNotes[s].pack+' · source URL not retained';}td.append(input);tr.append(td);if(applicable[i]!==null){totals[i]+=applicable[i];counts[i]++;}});tbody.append(tr);});
 const foot=$('#totals');foot.replaceChildren();const tr=document.createElement('tr'),lab=document.createElement('td');lab.textContent='Known subtotal';tr.append(lab);stores.forEach((s,i)=>{const td=document.createElement('td');td.textContent=counts[i]?money(totals[i])+' ('+counts[i]+'/'+state.items.length+')':'—';tr.append(td);});foot.append(tr);
 if(!$('#savingsSection').hidden)savings(currentSavings);
 $('#comparisonNote').textContent='Subtotals only include entered prices. Do not compare incomplete totals as full basket costs. Morrisons discount is a personal calculation, not a retailer price.';
}
$('#add').onclick=()=>{const name=$('#newItem').value.trim();if(!name)return;if(state.items.length>=25){$('#message').textContent='Maximum 25 items per basket.';return;}state.items.push({id:Date.now(),name,prices:{}});$('#newItem').value='';persist();render();};
$('#newItem').addEventListener('keydown',e=>{if(e.key==='Enter')$('#add').click();});
$('#reset').onclick=()=>{if(confirm('Replace your current basket and entered prices with the starter basket?')){state=fresh();persist();render();}};
$('#discount').onchange=e=>{state.discount=e.target.checked;persist();render();};
$('#save').onclick=()=>{try{localStorage.setItem(snap,JSON.stringify(state));$('#message').textContent='Snapshot saved on this device.';}catch{$('#message').textContent='Could not save snapshot.';}};
$('#restore').onclick=()=>{try{const d=JSON.parse(localStorage.getItem(snap));if(!valid(d))throw Error();state=d;persist();render();$('#message').textContent='Snapshot restored.';}catch{$('#message').textContent='No valid saved snapshot found.';}};
$('#export').onclick=()=>{const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';const lines=[['Product',...stores].map(q).join(',')];state.items.forEach(item=>lines.push([item.name,...stores.map(s=>item.prices[s]??'')].map(q).join(',')));const blob=new Blob([lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='shop-n-save-basket.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
async function check(){const b=$('#check');b.disabled=true;$('#status').textContent='Checking…';const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(supabaseUrl+'/auth/v1/settings',{headers:{apikey:supabasePublishableKey},signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();if(!d||typeof d.external!=='object')throw Error('Unexpected response');$('#status').textContent='Supabase service reachable. Shopping tables and cloud saving are not yet verified.';}catch(e){$('#status').textContent='Connection not confirmed. Try again later.';console.warn(e);}finally{clearTimeout(timeout);b.disabled=false;}}

const research = [
 // Historical research compiled 17 November 2026; not a live feed.
 {i:1,s:'Tesco',p:1.95,pack:'250g butter'},
 {i:2,s:'Tesco',p:1.75,pack:'4 pints milk'},
 {i:5,s:'Tesco',p:2.95,pack:'12 eggs'},
 {i:10,s:'Tesco',p:1.00,pack:'fruit cocktail tin'},
 {i:11,s:'Tesco',p:1.99,pack:'chunky chips'},
 {i:12,s:'Tesco',p:2.55,pack:'Tribute IPA'},
 {i:17,s:'Tesco',p:2.45,pack:'cheese block'},
 {i:18,s:'Tesco',p:0.39,pack:'tinned potatoes'},
 {i:19,s:'Tesco',p:0.63,pack:'bourbon biscuits'},
 {i:2,s:'Morrisons',p:1.75,pack:'4 pints milk'},
 {i:5,s:'Morrisons',p:2.95,pack:'12 free-range eggs'},
 {i:8,s:'Morrisons',p:11.85,pack:'Whiskas 40 pouches'},
 {i:9,s:'Morrisons',p:3.30,pack:'Heinz ketchup 460g'},
 {i:13,s:'Morrisons',p:1.00,pack:'Jaffa Cakes 10 pack'},
 {i:17,s:'Morrisons',p:3.20,pack:'mature cheddar 400g'},
 {i:19,s:'Morrisons',p:0.65,pack:'bourbons 300g'},
 {i:9,s:'Asda',p:2.50,pack:'Heinz ketchup; size to confirm'},
 {i:2,s:'Lidl',p:1.75,pack:'milk'},
 {i:5,s:'Lidl',p:2.49,pack:'eggs'},
 {i:7,s:'Lidl',p:0.62,pack:'washing-up liquid'},
 {i:14,s:'Lidl',p:4.39,pack:'beef mince; weight/fat to confirm'},
 {i:17,s:'Lidl',p:2.45,pack:'cheddar; weight to confirm'}
];
function loadResearch(){
 let count=0;const skipped=[];
 for(const r of research){const item=state.items.find(x=>x.id===r.i&&x.name===starter[r.i]);if(!item){skipped.push(r.pack);continue;}
 if(item.prices[r.s]!==undefined&&item.prices[r.s]!==null&&item.prices[r.s]!=='')continue;
 item.prices[r.s]=r.p;item.priceNotes??={};item.priceNotes[r.s]={date:'2026-11-17',source:'Previously researched retailer listing (source URL not retained)',pack:r.pack,live:false};count++;}
 persist();render();
 $('#researchStatus').textContent='Loaded '+count+' historical price entries (research compiled 17 Nov 2026). Prices are not live; pack sizes may differ. Tap a price to edit it. No full-basket comparison is available until all 20 products are verified.';
 $('#message').textContent=count+' previously researched prices added; existing prices preserved.';
}
$('#compare').addEventListener('click',loadResearch);


function priceAt(item,store){const p=item.prices[store];if(p===undefined||p===null||p==='')return null;const n=Number(p);return Number.isFinite(n)&&n>=0?effective(store,n):null;}
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function line(parent,name,amount,extra){const p=element('div',name+' — '+(amount===null?'—':money(amount))+(extra?' · '+extra:''),'savings-line');parent.append(p);}
function savings(mode){
 const out=$('#savingsOutput');out.replaceChildren();const n=state.items.length;
 if(!n){out.append(element('p','Add items to your basket first.'));return;}
 const shopResults=stores.map(store=>({store,found:state.items.filter(i=>priceAt(i,store)!==null),missing:state.items.filter(i=>priceAt(i,store)===null),total:state.items.reduce((sum,i)=>sum+(priceAt(i,store)??0),0)}));
 const complete=shopResults.filter(x=>x.missing.length===0).sort((a,b)=>a.total-b.total);
 const best=state.items.map(item=>{const offers=stores.map(store=>({store,price:priceAt(item,store)})).filter(x=>x.price!==null).sort((a,b)=>a.price-b.price);return {item,offer:offers[0]??null};});
 const splitKnown=best.reduce((sum,x)=>sum+(x.offer?.price??0),0),splitMissing=best.filter(x=>!x.offer);
 const heading=element('h3',mode==='split'?'Split shops':mode==='individual'?'Individual supermarket lists':'1-stop shop');out.append(heading);
 const warn=element('p','Prices are historical or manually entered, not live. Check comparable pack sizes, discounts, availability and travel costs.','hint');out.append(warn);
 if(mode==='split'){
  out.append(element('p',splitMissing.length?'Known-item subtotal: '+money(splitKnown)+' ('+(n-splitMissing.length)+'/'+n+' items). No complete split-shop saving can be calculated.':'Split-shop estimate: '+money(splitKnown)+' for '+n+' items.'));
  const groups=new Map(stores.map(s=>[s,[]]));for(const x of best)if(x.offer)groups.get(x.offer.store).push(x);
  for(const [store,arr] of groups){if(!arr.length)continue;const d=element('div',undefined,'savings-group');d.append(element('h4',store));for(const x of arr)line(d,x.item.name,x.offer.price);d.append(element('strong','Subtotal: '+money(arr.reduce((s,x)=>s+x.offer.price,0))));out.append(d);}
  if(splitMissing.length){const d=element('div',undefined,'savings-group');d.append(element('h4','No prices found'));for(const x of splitMissing)d.append(element('p',x.item.name));out.append(d);}
  if(!splitMissing.length&&complete.length)out.append(element('p','Estimated saving vs cheapest complete 1-stop shop: '+money(Math.max(0,complete[0].total-splitKnown))+'.'));
  else out.append(element('p','Savings vs a complete 1-stop shop: — (insufficient complete pricing).','hint'));
 }else if(mode==='individual'){
  for(const r of shopResults){const d=element('div',undefined,'savings-group');d.append(element('h4',r.store));d.append(element('p',(r.missing.length?'Known subtotal: ':'Complete basket: ')+money(r.total)+' · '+r.found.length+'/'+n+' priced'));for(const item of state.items)line(d,item.name,priceAt(item,r.store));if(r.missing.length)d.append(element('p','Missing '+r.missing.length+' price(s); subtotal is not a complete basket cost.','hint'));out.append(d);}
 }else{
  if(complete.length){const winner=complete[0];out.append(element('p','Cheapest complete 1-stop shop based on entered prices: '+winner.store+' — '+money(winner.total)));for(const r of complete)out.append(element('p',r.store+': '+money(r.total)));out.append(element('p','Split-shop comparison: '+(splitMissing.length?'— (missing prices)':money(splitKnown)+' · potential saving '+money(Math.max(0,winner.total-splitKnown)))));}
  else out.append(element('p','No supermarket currently has a price for every item. A cheapest 1-stop shop cannot be determined yet.'));
  for(const r of shopResults){const d=element('div',undefined,'savings-group');d.append(element('h4',r.store));d.append(element('p','Known subtotal '+money(r.total)+' · '+r.found.length+'/'+n+' items priced · '+r.missing.length+' missing'));if(r.missing.length)d.append(element('p','Missing: '+r.missing.map(x=>x.name).join(', '),'hint'));out.append(d);}
 }
}
let currentSavings='split';
function showSavings(mode){currentSavings=mode;$('#savingsSection').hidden=false;for(const [id,value] of [['splitShops','split'],['individualShops','individual'],['oneStopShop','one']])$('#'+id).classList.toggle('secondary',mode!==value);savings(mode);$('#savingsSection').scrollIntoView({behavior:'smooth',block:'start'});}
$('#viewShoppingLists').onclick=()=>showSavings('split');
$('#splitShops').onclick=()=>showSavings('split');
$('#individualShops').onclick=()=>showSavings('individual');
$('#oneStopShop').onclick=()=>showSavings('one');
$('#backToPrices').onclick=()=>{$('#savingsSection').hidden=true;$('#compare').scrollIntoView({behavior:'smooth',block:'start'});};

$('#check').onclick=check;render();check();