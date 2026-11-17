export const STORES = ['tesco','morrisons','asda','sainsburys','lidl'];
export const MAX_PRODUCTS = 50;
export const DAY = 86400000;
export function freshness(observedAt, now = Date.now()) {
  if (!observedAt) return 'missing';
  const age = now - new Date(observedAt).getTime();
  if (!Number.isFinite(age)) return 'missing';
  if (age <= 7 * DAY) return 'fresh';
  if (age <= 14 * DAY) return 'refresh_due';
  return 'historical';
}
export function weeklyKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));
  const weekday = (d.getUTCDay()+6)%7;
  d.setUTCDate(d.getUTCDate()-weekday);
  return d.toISOString().slice(0,10);
}
export function effectivePence(pricePence, retailer, discounts = {}) {
  if (pricePence == null) return null;
  const percentage = discounts[retailer] ?? 0;
  return Math.round(pricePence*(1-percentage/100));
}
export function compareBasket(items, prices, discounts = {}) {
  const perStore = Object.fromEntries(STORES.map(s=>[s,{totalPence:0,missing:[],items:[]}]));
  const split = Object.fromEntries(STORES.map(s=>[s,[]]));
  for (const item of items) {
    const candidates = STORES.map(store=>{
      const record = prices.find(p=>p.product_id===item.product_id && p.retailer_id===store && p.price_pence!=null && p.match_type==='exact' && freshness(p.observed_at)!=='historical');
      return record ? {store,pricePence:effectivePence(record.price_pence,store,discounts),record} : null;
    }).filter(Boolean);
    candidates.sort((a,b)=>a.pricePence-b.pricePence);
    if(candidates.length) split[candidates[0].store].push({...item,pricePence:candidates[0].pricePence,record:candidates[0].record});
    for(const store of STORES) {
      const found=candidates.find(x=>x.store===store);
      if(!found) perStore[store].missing.push(item.product_id);
      else {perStore[store].totalPence+=found.pricePence*item.quantity;perStore[store].items.push({...item,pricePence:found.pricePence});}
    }
  }
  const complete = Object.entries(perStore).filter(([,v])=>v.missing.length===0).sort((a,b)=>a[1].totalPence-b[1].totalPence);
  const splitTotalPence = Object.values(split).flat().reduce((sum,item)=>sum+item.pricePence*item.quantity,0);
  return {perStore,split,splitTotalPence,cheapestCompleteStore:complete[0]?.[0]??null,unpricedItems:items.filter(item=>!Object.values(split).flat().some(x=>x.product_id===item.product_id)).map(x=>x.product_id)};
}
