import { chromium } from '/workspace/oracle-review/lab/node_modules/@playwright/test/index.mjs';
const b = await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const p = await b.newPage();
await p.goto('file:///workspace/oracle-review/guide/P2P-tutor-quick-guide.html'); await p.waitForTimeout(600);
await p.pdf({path:'/workspace/oracle-review/guide/P2P-tutor-quick-guide.pdf', width:'420mm', height:'297mm', printBackground:true});
await b.close(); console.log('pdf ok');
