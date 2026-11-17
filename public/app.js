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

$('#check').onclick=check;render();check();