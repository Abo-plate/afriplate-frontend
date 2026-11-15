const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../src/app/lib/endpoints.js'),'utf8').replaceAll('export const','const')+';module.exports={API_ORIGIN,API_BASE};';
for(const input of ['https://api.example.test','https://api.example.test/','https://api.example.test/api','https://api.example.test/api/'])test('normalized API endpoint: '+input,()=>{
  const context={module:{exports:{}},process:{env:{NEXT_PUBLIC_API_URL:input}}};
  vm.runInNewContext(source,context);
  assert.equal(context.module.exports.API_ORIGIN,'https://api.example.test');
  assert.equal(context.module.exports.API_BASE,'https://api.example.test/api');
});
