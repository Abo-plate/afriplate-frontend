export function publicSeller(item={}) {
 const name=(item.seller_name||[item.seller_first_name||item.first_name,item.seller_last_name||item.last_name].filter(Boolean).join(' ')).trim();
 return {id:item.seller_id,name:name||'Seller',firstName:String(item.seller_first_name||item.first_name||name.split(/\s+/)[0]||'seller').trim()||'seller',avatar:item.seller_avatar||'',campus:item.seller_campus??item.seller_university??''};
}
export function chatServiceOwner(conversation={}) {return {id:conversation.service_owner_id,name:conversation.service_owner_name||'Seller',firstName:conversation.service_owner_first_name||'seller',avatar:conversation.service_owner_avatar||'',campus:conversation.service_owner_campus||''};}
