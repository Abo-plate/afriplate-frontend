export function productAvailability(product){
 if(product.status&&product.status!=='active')return {available:false,label:'Listing unavailable'};
 if(product.availability==='paused')return {available:false,label:'Sales paused'};
 if(product.stock_quantity==null)return {available:false,label:"Seller hasn't confirmed stock yet"};
 if(product.stock_quantity===0)return {available:false,label:'Sold out'};
 if(!Number.isSafeInteger(product.stock_quantity)||product.stock_quantity<0)return {available:false,label:"Seller hasn't confirmed stock yet"};
 return {available:true,label:product.stock_quantity+' available'};
}
