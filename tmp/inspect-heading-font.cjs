const {chromium}=require('C:/Users/samal/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {
  const page=await browser.newPage();
  await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  console.log(await page.locator('#results-heading').evaluate(element=>({family:getComputedStyle(element).fontFamily,weight:getComputedStyle(element).fontWeight,fonts:[...document.fonts].map(font=>({family:font.family,status:font.status,weight:font.weight}))})));
  const client=await page.context().newCDPSession(page);
  await client.send('DOM.enable');await client.send('CSS.enable');
  const document=await client.send('DOM.getDocument');
  const node=await client.send('DOM.querySelector',{nodeId:document.root.nodeId,selector:'#results-heading'});
  console.log(await client.send('CSS.getPlatformFontsForNode',{nodeId:node.nodeId}));
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
