// usage: node shoot_ppt.mjs  -> ppt/img/ebs-<id>.png and ppt/img/fus-<id>.png at 2x (needs vite on 5199)
import { chromium } from '/workspace/oracle-review/lab/node_modules/@playwright/test/index.mjs';
import fs from 'fs';
const screens = JSON.parse(fs.readFileSync('/workspace/oracle-review/lab/src/data/ebs/screens.json','utf8'));
const b = await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const p = await b.newPage({viewport:{width:1500,height:900}, deviceScaleFactor:2});
for (const s of screens) {
  await p.goto('http://127.0.0.1:5199/#ebs-replica/'+s.id); await p.reload(); await p.waitForTimeout(300);
  await p.getByTestId('ebs-'+s.id).screenshot({path:`/workspace/oracle-review/ppt/img/ebs-${s.id}.png`});
}
const g = await b.newPage({viewport:{width:2100,height:1000}, deviceScaleFactor:2});
await g.goto('http://127.0.0.1:5199/#ebs-replica'); await g.reload(); await g.waitForTimeout(1500);
for (const s of screens) await g.locator('#'+s.id+' [data-testid=fusion-view]').screenshot({path:`/workspace/oracle-review/ppt/img/fus-${s.id}.png`});
console.log('ok',screens.length); await b.close();
