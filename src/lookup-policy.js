import {freshness,STORES,MAX_PRODUCTS} from './pricing.js';
// Server-side planner: share one queue row per product/store across all shoppers.
// Only adapters explicitly authorised for automated reuse may fetch data.
export function planLookups(products, latestPrices) {
 if(products.length>MAX_PRODUCTS) throw new Error('Maximum 25 products per weekly comparison');
 const jobs=[];
 for(const product of products) for(const retailer of STORES) {
   const current=latestPrices.find(p=>p.product_id===product.id && p.retailer_id===retailer);
   if(!current || freshness(current.observed_at)!=='fresh')
     jobs.push({product_id:product.id,retailer_id:retailer});
 }
 return jobs;
}
export function canPublishObservation(row) {
 return Boolean(row.product_id && row.retailer_id && Number.isInteger(row.price_pence) && row.price_pence>=0 &&
 row.observed_at && row.source_name && row.source_license && row.region==='GB' &&
 ['verified','provisional'].includes(row.confidence));
}
