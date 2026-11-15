// Run against an already-built localhost frontend. No production requests are allowed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const APP = 'http://127.0.0.1:3107';
const CHROME = process.env.NAV_TEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const user = { id: 9001, first_name: 'Navigation', last_name: 'Test', user_type: 'seller', role: 'seller' };
const order = { id: 9002, product_title: 'Navigation fixture item', status: 'awaiting_payment', created_at: '2026-03-29T12:00:00Z' };
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'afriplate-nav-'));
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
  let role = 'seller';
  const requests = [];
  const messagePosts=[];
  const chatMessages=[{id:9501,conversation_id:9301,sender_id:9003,receiver_id:9001,content:'Private fixture message',created_at:'2026-11-15T12:00:00Z',attachments:[],is_read:true}];
  const conversation={id:9301,buyer_id:9001,seller_id:9003,user_id:9003,product_id:9302,name:'Fixture Seller',product_title:'Fixture listing',unread:1};
  let rejectNextMessage=false,emailMode='normal';
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      waiting.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  ws.onmessage = async message => {
    const event = JSON.parse(message.data);
    if (event.id) {
      const pending = waiting.get(event.id);
      if (pending) { waiting.delete(event.id); event.error ? pending.reject(Error(event.error.message)) : pending.resolve(event.result); }
    }
    if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
    if (event.method !== 'Fetch.requestPaused') return;
    const { requestId, request } = event.params;
    try {
      const url = new URL(request.url);
      if (url.origin === APP && !url.pathname.startsWith('/api/')) { await send('Fetch.continueRequest', { requestId }); return; }
      if (url.pathname.startsWith('/api/')) {
        requests.push(url.pathname + url.search);
        let responseCode = 200;
        let data = { status: 'success', products: [], services: [], jobs: [], orders: [], transactions: [], notifications: [], conversations: [], universities: [], count: 0 };
        if (url.pathname === '/api/auth/me' && request.method !== 'OPTIONS') {
          if (apiMode === 'offline') { await send('Fetch.failRequest', { requestId, errorReason: 'ConnectionFailed' }); return; }
          const auth = request.headers.Authorization || request.headers.authorization;
          if (auth !== 'Bearer navigation-test-session') { responseCode = 401; data = { status: 'error' }; }
          else data = { status: 'success', user: { ...user, role, user_type: role } };
        }
        if (url.pathname === '/api/auth/login') data = { status: 'success', token: 'navigation-test-session', user: { ...user, role, user_type: role } };
        if (url.pathname === '/api/orders') data = { status: 'success', orders: [order] };
        if (url.pathname === '/api/orders/seller/dashboard-summary') data = { status: 'success', summary: {}, recentOrders: [] };
        if(url.pathname==='/api/products/9302')data={status:'success',product:{id:9302,seller_id:9003,title:'Fixture listing',description:'Only a test fixture',price:'1500.00',images:[],category:'other'}};
        if(url.pathname==='/api/messages'||url.pathname==='/api/messages/conversations'){
          if(request.method==='POST'&&url.pathname.endsWith('/conversations'))data={status:'success',conversation};
          else if(request.method==='POST'){
            const payload=JSON.parse(request.postData);messagePosts.push(payload);
            if(rejectNextMessage){rejectNextMessage=false;responseCode=503;data={status:'error',message:'Fixture send unavailable. Retry your message.'};}
            else{
              let message=chatMessages.find(item=>item.client_id===payload.client_id);
              if(!message){message={id:9502+messagePosts.length,conversation_id:9301,sender_id:9001,receiver_id:9003,content:payload.content,client_id:payload.client_id,created_at:'2026-11-15T12:01:00Z',attachments:(payload.attachment_ids||[]).map(id=>({id,filename:'fixture.png',mime_type:'image/png',size:12}))};chatMessages.push(message);}
              data={status:'success',message};
            }
          }else data={status:'success',conversations:[conversation]};
        }
        if(url.pathname==='/api/messages/conversations/9301/messages')data={status:'success',messages:chatMessages,has_more:false};
        if(url.pathname==='/api/messages/conversations/9301/attachments')data={status:'success',attachment:{id:9401,filename:'fixture.png',mime_type:'image/png',size:12}};
        if(url.pathname==='/api/auth/resend-verification'){
          if(emailMode==='failure'){responseCode=503;data={status:'error',message:'Email provider unavailable for this fixture'};}
          else data={status:'success',message:'Verification request accepted'};
        }
        if(url.pathname.startsWith('/api/auth/verify-email/'))data={status:'success'};
        if(url.pathname==='/api/auth/forgot-password')data={status:'success',message:'If that email exists, reset instructions have been requested.'};
        if(url.pathname.startsWith('/api/auth/reset-password/')){data={status:'success'};if(url.pathname.endsWith('/fixture-expired-reset')){responseCode=400;data={status:'error',message:'Reset link is invalid or expired'};}}
        if(request.method==='OPTIONS')responseCode=200;
        await send('Fetch.fulfillRequest', { requestId, responseCode, responseHeaders: [
          { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' },
          { name: 'Access-Control-Allow-Headers', value: '*' }, { name: 'Access-Control-Allow-Methods', value: '*' },
        ], body: Buffer.from(request.method === 'OPTIONS' ? '' : JSON.stringify(data)).toString('base64') });
      } else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    } catch (error) { errors.push(error.message); }
  };
  await send('Page.enable');
  await send('Runtime.enable');
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
  async function check(name, fn) { await fn(); passed.push(name); console.log('PASS ' + name); }
  await navigate('/');
  await check('guest mobile menu has Login and Sign up', async () => {
    await until('document.querySelector(".mobile-nav")?.innerText.includes("Sign up") && !document.querySelector(".account-loading")', 'hydrated guest navigation');
    assert.ok(await evaluate('document.querySelector(".mobile-nav").innerText.includes("Login")'));
  });
  await check('invalid stored token is rejected by server validation', async () => {
    await evaluate('localStorage.setItem("token", "invalid-test-session"); localStorage.setItem("user", JSON.stringify({id:1})); window.dispatchEvent(new StorageEvent("storage", {key:"token"}))');
    await until('localStorage.getItem("token") === null', 'invalid token cleared');
    assert.ok(await evaluate('document.querySelector(".mobile-nav").innerText.includes("Login")'));
  });
  await navigate('/login');
  await check('successful login updates navigation without document reload', async () => {
    await evaluate('window.__navigationMarker = 123; for (const [id, value] of [["email","navigation@example.test"],["password","fixture-password"]]) { const input=document.getElementById(id); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,value); input.dispatchEvent(new Event("input",{bubbles:true})); }');
    await sleep(100);
    await evaluate('document.querySelector(".submit-btn").click()');
    await until('location.pathname === "/dashboard" && !!document.querySelector(".bottom-tab-bar")', 'authenticated dashboard');
    await until('getComputedStyle(document.querySelector(".dash-wrap")).transform === "none"', 'dashboard animation releases fixed navigation');
    assert.equal(await evaluate('window.__navigationMarker'), 123);
    assert.equal(await evaluate('document.querySelectorAll(".mobile-nav").length'), 0);
    await until('document.body.innerText.includes("Awaiting payment")', 'readable activity status');
    assert.equal(await evaluate('document.querySelector("[data-order-id]").dataset.orderId'), '9002');
  });
  await check('seller mobile dashboard has one bar and safe content clearance', async () => {
    for (const width of [320, 390, 768]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
      const layout = await evaluate('({bars:document.querySelectorAll(".bottom-tab-bar").length,visible:getComputedStyle(document.querySelector(".bottom-tab-bar")).display, padding:parseFloat(getComputedStyle(document.querySelector(".dash-grid")).paddingBottom),height:document.querySelector(".bottom-tab-bar").getBoundingClientRect().height,bottom:document.querySelector(".bottom-tab-bar").getBoundingClientRect().bottom,viewport:innerHeight,overflow:document.documentElement.scrollWidth > innerWidth})');
      assert.ok(Math.abs(layout.bottom - layout.viewport) < 2, 'bar anchored to viewport at ' + width); assert.equal(layout.bars, 1); assert.notEqual(layout.visible, 'none'); assert.ok(layout.padding >= layout.height); assert.equal(layout.overflow, false, 'no horizontal overflow at ' + width);
      if (width === 390) { const shot = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(profile, 'seller-mobile.png'), Buffer.from(shot.data, 'base64')); }
    }
  });
  await check('buyer mobile dashboard also has only its own navigation', async () => {
    role = 'buyer'; await navigate('/dashboard');
    await until('!!document.querySelector(".bottom-tab-bar")', 'buyer dashboard');
    assert.equal(await evaluate('document.querySelectorAll(".mobile-nav").length'), 0);
    assert.equal(await evaluate('document.querySelectorAll(".bottom-tab-bar").length'), 1);
  });
  role = 'seller';
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await check('marketplace pages restore validated account links and logout immediately', async () => {
    for (const route of ['/', '/products', '/services', '/jobs']) {
      await navigate(route);
      await until('document.querySelector(".mobile-nav")?.innerText.includes("Log out")', 'account links on ' + route);
      const clearance = await evaluate('({nav:document.querySelector(".mobile-nav").getBoundingClientRect().height,padding:parseFloat(getComputedStyle(document.body).paddingBottom),home:!!document.querySelector(".ap-home"),contentBottom:document.querySelector(".app-content").getBoundingClientRect().bottom,navTop:document.querySelector(".mobile-nav").getBoundingClientRect().top})');
      assert.ok(clearance.home ? clearance.contentBottom <= clearance.navTop + 1 : clearance.padding >= clearance.nav, 'public content clearance on ' + route);
      const label = route === '/' ? '.ap-header-actions' : '.nav-right';
      assert.ok(await evaluate('document.querySelector(' + JSON.stringify(label) + ').innerText.includes("Dashboard")'));
      assert.ok(await evaluate('document.querySelector(' + JSON.stringify(label) + ').textContent.includes("Profile")'));
      await evaluate('document.querySelector(".mobile-nav button").click()');
      await until('document.querySelector(".mobile-nav")?.innerText.includes("Login")', 'logout update');
      assert.equal(await evaluate('localStorage.getItem("token")'), null);
      await evaluate('localStorage.setItem("token","navigation-test-session");window.dispatchEvent(new StorageEvent("storage",{key:"token"}))');
      await until('document.querySelector(".mobile-nav")?.innerText.includes("Log out")', 'revalidate session');
    }
  });
  await check('mobile homepage menu and desktop navigation match session', async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate('/');
    await until('!!document.querySelector(".mobile-nav button")', 'validated home');
    await evaluate('document.querySelector(".ap-menu-button").click()');
    assert.ok(await evaluate('document.querySelector(".ap-mobile-menu").innerText.includes("Log out")'));
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".mobile-nav")).display'), 'none');
    assert.ok(await evaluate('document.querySelector(".ap-header-actions").innerText.includes("Log out")'));
  });
  await check('profile opens settings and dashboard logout preserves unrelated browser storage', async () => {
    await navigate('/dashboard#settings');
    await until('document.body.innerText.includes("Profile Info")', 'profile settings');
    await evaluate('localStorage.setItem("navigation-unrelated","keep");document.querySelector(".dashboard-logout").click()');
    await until('location.pathname === "/login"', 'dashboard logout redirect');
    assert.equal(await evaluate('localStorage.getItem("navigation-unrelated")'), 'keep');
    await evaluate('localStorage.setItem("token","navigation-test-session")');
  });
  await check('session outage does not authenticate cached user or delete token', async () => {
    apiMode = 'offline'; await navigate('/dashboard');
    await until('document.body.innerText.includes("could not verify your session")', 'session outage state');
    assert.equal(await evaluate('document.querySelectorAll(".bottom-tab-bar").length'), 0);
    assert.equal(await evaluate('localStorage.getItem("token")'), 'navigation-test-session');
    apiMode = 'normal'; await evaluate('document.querySelector("[role=alert] button").click()');
    await until('!!document.querySelector(".bottom-tab-bar")', 'retry session validation');
  });
  await check('listing Message opens the correct seller and product without auto-sending',async()=>{
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await navigate('/products/9302');
    await until('document.body.innerText.includes("Fixture listing")','listing fixture');
    await evaluate('Array.from(document.querySelectorAll("button")).find(button=>button.textContent.trim()==="Message").click()');
    await until('location.pathname==="/messages" && !!document.querySelector("textarea[aria-label=Message]")','conversation route');
    assert.equal(await evaluate('new URLSearchParams(location.search).get("to")'),'9003');
    assert.equal(await evaluate('new URLSearchParams(location.search).get("product_id")'),'9302');
    assert.equal(messagePosts.length,0);
    await until('document.body.innerText.includes("Private fixture message")','message history');
  });
  await check('failed sends retain the draft and retry identifier; attachments stay private',async()=>{
    rejectNextMessage=true;
    await evaluate('(()=>{const field=document.querySelector("textarea[aria-label=Message]");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(field,"A fixture reply");field.dispatchEvent(new Event("input",{bubbles:true}));})()');
    await sleep(100);await evaluate('document.querySelector(".send-btn").click()');
    await until('document.querySelector("[role=alert]")?.textContent.includes("Fixture send unavailable")','visible send error');
    assert.equal(await evaluate('document.querySelector("textarea[aria-label=Message]").value'),'A fixture reply');
    await evaluate('document.querySelector(".send-btn").click()');
    await until('document.querySelector("textarea[aria-label=Message]").value === ""','retry accepted');
    assert.equal(messagePosts[0].client_id,messagePosts[1].client_id);
    assert.equal(messagePosts[1].conversation_id,9301);
    await evaluate('(()=>{const transfer=new DataTransfer();transfer.items.add(new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])],"fixture.png",{type:"image/png"}));const field=document.querySelector("input[type=file]");field.files=transfer.files;field.dispatchEvent(new Event("change",{bubbles:true}));})()');
    await until('document.querySelector(".attached-files")?.textContent.includes("fixture.png")','private upload');
    await evaluate('window.dispatchEvent(new Event("focus"))');await sleep(250);
    assert.ok(await evaluate('document.querySelector(".attached-files")?.textContent.includes("fixture.png")'));
    await evaluate('document.querySelector(".send-btn").click()');
    await until('!!document.querySelector(".attachment-download")','attachment bound to message');
    assert.deepEqual(messagePosts.at(-1).attachment_ids,[9401]);
  });
  await check('chat layout clears mobile navigation and works on desktop; self-messaging is blocked',async()=>{
    for(const width of [320,390,1280]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<768});
      const layout=await evaluate('({overflow:document.documentElement.scrollWidth>innerWidth,bottom:document.querySelector(".chat-input-wrap").getBoundingClientRect().bottom,nav:document.querySelector(".mobile-nav").getBoundingClientRect().top})');
      assert.equal(layout.overflow,false,'no chat horizontal overflow at '+width);
      if(width<768)assert.ok(layout.bottom<=layout.nav+1,'composer above bottom bar at '+width);
    }
    await navigate('/messages?to=9001');
    await until('document.body.innerText.includes("You cannot message yourself")','self-message refusal');
  });
  await check('verification, resend and reset UI use API responses without claiming inbox delivery',async()=>{
    await navigate('/verify-email?token=fixture-verification');
    await until('document.body.innerText.toLowerCase().includes("verified")','verification result');
    assert.equal(requests.filter(route=>route==='/api/auth/verify-email/fixture-verification').length,1);
    await navigate('/resend-verification');
    await until('!!document.querySelector("#verification-email")','resend form');
    await evaluate('(()=>{const field=document.querySelector("#verification-email");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(field,"navigation@example.test");field.dispatchEvent(new Event("input",{bubbles:true}));})()');
    await sleep(100);emailMode='failure';
    await evaluate('document.querySelector(".ap-verification-form button").click()');
    await until('document.querySelector("[role=alert]")?.textContent.includes("Email provider unavailable")','resend failure');
    emailMode='normal';await evaluate('document.querySelector(".ap-verification-form button").click()');
    await until('document.querySelector("#verification-feedback")?.textContent.includes("delivery is not yet confirmed")','truthful resend feedback');
    await navigate('/forgot-password');
    await until('!!document.querySelector("input[type=email]")','forgot password form');
    await evaluate('(()=>{const field=document.querySelector("input[type=email]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(field,"navigation@example.test");field.dispatchEvent(new Event("input",{bubbles:true}));})()');
    await sleep(100);await evaluate('document.querySelector("form button[type=submit]").click()');
    await until('document.body.innerText.includes("reset instructions have been requested")','forgot request feedback');
    for(const token of ['fixture-expired-reset','fixture-valid-reset']){
      await navigate('/reset-password?token='+token);
      await until('document.querySelectorAll("input[type=password]").length===2','reset form');
      await evaluate('document.querySelectorAll("input[type=password]").forEach(field=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(field,"fixture-changed-password");field.dispatchEvent(new Event("input",{bubbles:true}));})');
      await sleep(100);await evaluate('Array.from(document.querySelectorAll("button")).find(button=>button.textContent.trim()==="Reset Password").click()');
      if(token.includes('expired'))await until('document.body.innerText.includes("Reset link is invalid or expired")','expired reset error');
      else{await until('document.body.innerText.includes("Password reset!")','successful reset');assert.equal(await evaluate('localStorage.getItem("token")'),null);}
    }
    await navigate('/reset-password');
    await until('document.body.innerText.includes("Invalid link")','missing reset token');
  });
  assert.ok(requests.includes('/api/orders?role=seller&limit=6'), 'Activity comes from orders API');
  assert.equal(errors.length, 0, 'No browser runtime errors: ' + errors.join(', '));
  console.log('RESULT ' + passed.length + ' browser checks passed; all API responses were fixtures.');
  console.log('SCREENSHOTS ' + profile);
  await send('Browser.close');
}
main().catch(error => { console.error('FAIL ' + error.message); process.exitCode = 1; }).finally(() => { ws?.close(); chrome.kill(); });
