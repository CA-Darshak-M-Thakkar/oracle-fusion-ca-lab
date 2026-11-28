// usage: node shoot.mjs [id ...]  -> /workspace/oracle-review/shots-ebs/<id>.png (replica, 1:1)
import { chromium } from '/workspace/oracle-review/lab/node_modules/@playwright/test/index.mjs';
import fs from 'fs';
const screens = JSON.parse(fs.readFileSync('/workspace/oracle-review/lab/src/data/ebs/screens.json','utf8'));
const ids = process.argv.length > 2 ? process.argv.slice(2) : screens.map(s=>s.id);
const b = await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const p = await b.newPage({viewport:{width:1500,height:900}, deviceScaleFactor:1});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
for (const id of ids) {
  await p.goto('http://127.0.0.1:5199/#ebs-replica/'+id+'?data=manual'); await p.reload(); await p.waitForTimeout(400);
  const el = p.getByTestId('ebs-'+id);
  await el.screenshot({path:`/workspace/oracle-review/shots-ebs/${id}.png`});
}
console.log('shot',ids.length,'errors',errs.slice(0,3));
await b.close();
