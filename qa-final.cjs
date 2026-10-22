async (page) => {
  await page.reload();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width:375,height:812});
  const mobile=[];
  for(const n of [1,4,7]){
    await page.evaluate(i=>goTo(i),n);
    await page.waitForTimeout(150);
    await page.screenshot({path:`output/playwright/final-mobile-${n+1}.png`,scale:'css',animations:'disabled'});
    mobile.push(await page.evaluate(()=>({page:current+1,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth})));
  }
  await page.getByRole('button',{name:'讲稿',exact:true}).click();
  const modalOpen=await page.evaluate(()=>notesModal&&document.activeElement.id==='closeNotes'&&$('viewport').inert&&document.querySelector('.control-bar').inert);
  await page.keyboard.press('Shift+Tab');
  const trapped=await page.evaluate(()=>!!document.activeElement.closest('#notes'));
  await page.keyboard.press('Escape');
  const restored=await page.evaluate(()=>$('notes').hidden&&!$('viewport').inert&&document.activeElement.id==='notesBtn');
  await page.evaluate(()=>{goTo(0.5);$('autoAdvance').checked=true;elapsed=30;startedAt=performance.now();running=true;paintTimer()});
  const automatic=await page.evaluate(()=>current===1&&$('autoAdvance').checked);
  await page.keyboard.press('ArrowRight');
  const manualOverride=await page.evaluate(()=>current===2&&!$('autoAdvance').checked);
  await page.evaluate(()=>{resetTimer();$('toast').hidden=true});
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>goTo(0));
  await page.getByRole('button',{name:'全屏',exact:true}).click();
  const full=await page.evaluate(()=>!!document.fullscreenElement);
  if(full)await page.evaluate(()=>document.exitFullscreen());
  await page.screenshot({path:'output/playwright/final-cover.png',scale:'css',animations:'disabled'});
  await page.pdf({path:'output/playwright/print-check.pdf',printBackground:true,preferCSSPageSize:true});
  return {errors,mobile,modalOpen,trapped,restored,automatic,manualOverride,full,allImagesLoaded:await page.evaluate(()=>[...document.images].every(x=>x.complete&&x.naturalWidth>0))};
}
