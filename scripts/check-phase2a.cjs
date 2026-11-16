// Run against an already-built localhost frontend. No production requests are allowed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const APP = 'http://127.0.0.1:3108';
const CHROME = process.env.NAV_TEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const user = { id: 9001, first_name: 'Navigation', last_name: 'Test', user_type: 'seller', role: 'seller' };
const order = { id: 9002, product_title: 'Navigation fixture item', status: 'awaiting_payment', created_at: '2026-03-29T12:00:00Z' };
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'afriplate-dashboard-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws;
let lastError;
chrome.on('error', error => { lastError = error; });
const passed = [];
async function main() {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 150 && !fs.existsSync(portFile); i++) { if (lastError) throw lastError; await sleep(100); }
  assert.ok(fs.existsSync(portFile), 'Chrome debugging endpoint must start');
  let port;
  for (let i=0;i<100;i++) { try { port=fs.readFileSync(portFile,'utf8').split(String.fromCharCode(10))[0].trim();if(/^[0-9]+$/.test(port))break; }catch{}await sleep(50); }
  assert.ok(/^[0-9]+$/.test(port),'Chrome startup port must be readable');
  const page = await (await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let sequence = 0;
  const waiting = new Map();
  const errors = [];
  let apiMode = 'normal';
  let dashboardState = 'populated';
  let role = 'seller';
  const requests = [];
  const messagePosts=[];
  const chatMessages=[{id:9501,conversation_id:9301,sender_id:9003,receiver_id:9001,content:'Private fixture message',created_at:'2026-11-15T12:00:00Z',attachments:[],is_read:true}];
  const conversation={id:9301,buyer_id:9001,seller_id:9003,user_id:9003,product_id:9302,name:'Fixture Seller',product_title:'Fixture listing',unread:1};
  let rejectNextMessage=false,emailMode='normal', unreadCount=4;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      waiting.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const product={id:9302,seller_id:9003,title:'Silver laptop',description:'Isolated browser fixture',price:'2000.00',category:'Electronics',university:'Campus A',stock_quantity:4,availability:'available',status:'active',images:[]};
  let cartItems=[],nextId=1,failCart=false;
  const mutations=[];
  const items=()=>cartItems.map(item=>({...item,title:product.title,seller_name:'Fixture Seller',price:product.price,stock_quantity:product.stock_quantity,available:true,subtotal_kobo:200000*item.quantity,fee_kobo:1000*item.quantity,total_kobo:201000*item.quantity}));
  ws.onmessage=async message=>{
    const event=JSON.parse(message.data);
    if(event.id){const pending=waiting.get(event.id);if(pending){waiting.delete(event.id);event.error?pending.reject(Error(event.error.message)):pending.resolve(event.result);}}
    if(event.method==='Runtime.exceptionThrown')errors.push(event.params.exceptionDetails.exception?.description||event.params.exceptionDetails.text);
    if(event.method!=='Fetch.requestPaused')return;
    const {requestId,request}=event.params;
    try{
      const url=new URL(request.url);
      if(url.origin===APP&&!url.pathname.startsWith('/api/')){await send('Fetch.continueRequest',{requestId});return;}
      if(!url.pathname.startsWith('/api/')){await send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});return;}
      requests.push(url.pathname+url.search);if(request.method==='POST'||request.method==='PUT')mutations.push({path:url.pathname,body:request.postData?JSON.parse(request.postData):null});let responseCode=200,data={products:[],services:[],reviews:[],orders:[],notifications:[],conversations:[],unread:0};
      const auth=(request.headers.Authorization||request.headers.authorization)==='Bearer navigation-test-session';
      if(url.pathname==='/api/auth/me'){responseCode=auth?200:401;data=auth?{user}:{message:'Login required'};}
      if(url.pathname==='/api/products'){
        const q=url.searchParams.get('q')||'';const matching=q.toLowerCase().includes('missing')?[]:[product];data={products:matching,total:matching.length,has_more:false};
        if(url.searchParams.get('mine')==='true')data.products=[{...product,seller_id:user.id}];
      }
      if(url.pathname==='/api/products/9302')data={product};
      if(url.pathname==='/api/cart'&&request.method==='GET'){
        if(failCart){responseCode=503;data={message:'Fixture unavailable'};}
        else{const n=cartItems.reduce((sum,item)=>sum+item.quantity,0);data={items:items(),summary:{item_count:n,subtotal_kobo:200000*n,fee_kobo:1000*n,total_kobo:201000*n}};}
      }
      if(url.pathname==='/api/cart'&&request.method==='POST'){const payload=JSON.parse(request.postData);let item=cartItems.find(item=>item.product_id===payload.product_id);if(item)item.quantity+=payload.quantity;else{item={id:nextId++,product_id:payload.product_id,quantity:payload.quantity};cartItems.push(item);}data={item};}
      if(/^\/api\/cart\/\d+$/.test(url.pathname)){const id=Number(url.pathname.split('/').pop());if(request.method==='DELETE')cartItems=cartItems.filter(item=>item.id!==id);else if(request.method==='PUT'){cartItems.find(item=>item.id===id).quantity=JSON.parse(request.postData).quantity;}data={message:'Saved'};}
      if(request.method==='OPTIONS')responseCode=200;
      await send('Fetch.fulfillRequest',{requestId,responseCode,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'*'},{name:'Access-Control-Allow-Methods',value:'*'}],body:Buffer.from(request.method==='OPTIONS'?'':JSON.stringify(data)).toString('base64')});
    }catch(error){if(!/Invalid InterceptionId/.test(error.message))errors.push(error.message);}
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async function until(expression, description) {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(100); }
    throw Error('Timed out: ' + description);
  }
  async function navigate(route) {
    await send('Page.navigate', { url: APP + route });
    await until('document.readyState === "complete"', 'page load');
    await sleep(200);
  }
  async function check(name, fn) { try { await fn(); } catch(error) { await screenshot('failure'); console.log('Failure route: '+await evaluate('location.pathname+location.hash')); console.log('SCREENSHOTS '+profile); throw error; } passed.push(name); console.log('PASS ' + name); }

  async function screenshot(name) {
    const shot=await send('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(profile,name+'.png'),Buffer.from(shot.data,'base64'));
  }

  await navigate('/');await evaluate('localStorage.setItem("token","navigation-test-session")');
  const click=label=>evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`);
  for(const width of [320,390,768,1440]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<=768});
    for(const route of ['/products?q=laptop','/products?q=missing','/products/9302','/cart'])await check(route+' layout '+width,async()=>{
      await navigate(route);await until(`!document.body.innerText.includes('Loading cart')&&!document.body.innerText.includes('Checking account')`,'account and cart ready');await sleep(700);
      assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,'no horizontal overflow');
      assert.equal(await evaluate('document.querySelectorAll(".mobile-nav").length'),1);
      if(width<=768){const state=await evaluate(`({nav:getComputedStyle(document.querySelector('.mobile-navigation')).display,cart:getComputedStyle(document.querySelector('.mobile-cart-entry')).display,html:document.documentElement.className})`);assert.notEqual(state.nav,'none',JSON.stringify(state));assert.notEqual(state.cart,'none',JSON.stringify(state));}
      if(route.includes('missing'))assert.ok(await evaluate('document.body.innerText.includes("No products found")'));
      if(route==='/products/9302')assert.ok(await evaluate('document.body.innerText.includes("Add to cart")'));
      await screenshot(route.replaceAll('/','-').replaceAll('?','-').replaceAll('=','-')+'-'+width);
    });
  }
  await check('search URL filters sorting paging and clear preserve the query',async()=>{
    await navigate('/products?q=laptop&category=Electronics&university=FUTA&sort=price_desc');await sleep(800);
    assert.equal(await evaluate('document.querySelector(".search-input").value'),'laptop');
    assert.ok(requests.some(url=>url.includes('/api/products?')&&url.includes('q=laptop')&&url.includes('category=Electronics')&&url.includes('university=FUTA')&&url.includes('sort=price_desc')));
    await evaluate(`const el=document.querySelector('.search-input');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'');el.dispatchEvent(new Event('input',{bubbles:true}));`);await sleep(500);
    assert.equal(await evaluate('new URLSearchParams(location.search).has("q")'),false);
  });
  await check('add quantity, cart persistence, badge, quantity update and remove',async()=>{
    await navigate('/products/9302');await until(`!!document.querySelector('[aria-label="Quantity"]')`,'quantity input');
    await evaluate(`const el=document.querySelector('[aria-label="Quantity"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'2');el.dispatchEvent(new Event('input',{bubbles:true}));`);await click('Add to cart');
    await until(`document.body.innerText.includes('Added to your cart')`,'cart save');assert.equal(cartItems[0].quantity,2);
    await navigate('/cart');await until(`!!document.querySelector('.cart-controls')`,'cart loaded');assert.ok(await evaluate(`document.body.innerText.includes('4,020.00')`));
    await evaluate(`document.querySelector('[aria-label="Increase quantity for Silver laptop"]').click()`);await until(`document.querySelector('span[aria-label="Quantity"]')?.textContent==='3'`,'saved quantity');
    await navigate('/cart');await until(`document.querySelector('span[aria-label="Quantity"]')?.textContent==='3'`,'persisted cart');await screenshot('cart-populated');
    for(const width of [320,390,768,1440]){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<=768});assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);await screenshot('cart-populated-'+width);}

    await click('Remove');await until(`document.body.innerText.includes('Your cart is empty')`,'empty state');
  });
  await check('seller create quantity and inventory edit controls preserve valid stock',async()=>{
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});await navigate('/dashboard#sell-product');
    await until(`document.body.innerText.includes('Quantity available')`,'create inventory form');
    const labels=await evaluate(`Array.from(document.querySelectorAll('label')).map(e=>e.textContent)`);
    assert.ok(await evaluate(`document.querySelector('input[type="number"][min="0"][step="1"]')!==null`));await screenshot('seller-create-quantity-390');
    await navigate('/dashboard#listings');await until(`!!document.querySelector('[aria-label="Quantity available for Silver laptop"]')`,'edit inventory');
    await evaluate(`const el=document.querySelector('[aria-label="Quantity available for Silver laptop"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'7');el.dispatchEvent(new Event('input',{bubbles:true}));`);
    await click('Save inventory');await until(`document.body.innerText.includes('Inventory saved')`,'inventory saved');
    assert.ok(mutations.some(m=>m.path==='/api/products/9302'&&m.body.stock_quantity===7));await screenshot('seller-edit-quantity-390');
  });
  await check('sold out disables adding and logout clears private cart display',async()=>{
    product.stock_quantity=0;await navigate('/products/9302');await until(`document.body.innerText.includes('Sold out')`,'sold out');assert.ok(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Add to cart').disabled`));
    await click('Log out');await until(`document.body.innerText.includes('Login')`,'logout');await navigate('/cart');await until(`document.body.innerText.includes('to see your saved cart')`,'guest cart');assert.equal(await evaluate(`document.querySelectorAll('.cart-controls').length`),0);
  });
  assert.equal(errors.length,0,errors.join('\n'));console.log('RESULT '+passed.length+' browser fixture checks passed. No production API or email requests.');console.log('SCREENSHOTS '+profile);await send('Browser.close');
}
main().catch(error=>{console.error('FAIL '+error.message);process.exitCode=1;}).finally(()=>{ws?.close();chrome.kill();});
