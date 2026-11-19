// Secure UUIDv4 with support for browsers that predate crypto.randomUUID.
export function createClientId() {
 const secure=globalThis.crypto;
 if(typeof secure?.randomUUID==='function')return secure.randomUUID();
 if(typeof secure?.getRandomValues!=='function')throw Object.assign(new Error('Secure browser required'),{code:'SECURE_BROWSER_REQUIRED'});
 const bytes=secure.getRandomValues(new Uint8Array(16));
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}
