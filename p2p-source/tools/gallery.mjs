import { chromium } from '/workspace/oracle-review/lab/node_modules/@playwright/test/index.mjs';
const ids = process.argv.slice(2);
const b = await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const p = await b.newPage({viewport:{width:2100,height:1000}});
const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://127.0.0.1:5199/#ebs-replica'); await p.reload(); await p.waitForTimeout(1500);
for (const id of ids) await p.locator('#'+id).screenshot({path:`/workspace/oracle-review/previews/gallery-${id}.png`});
console.log('sections',await p.locator('section').count(),'toggle buttons',await p.locator('[data-testid^=ds-]').count(),'errors',errs);
await b.close();
