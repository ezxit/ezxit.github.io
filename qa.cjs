async (page) => {
  await page.reload();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.evaluate(() => document.activeElement.blur());
  const sizes = [[1440,1000,'desktop'],[375,812,'mobile'],[844,390,'landscape']];
  const report = [];
  for (const [width,height,name] of sizes) {
    await page.setViewportSize({width,height});
    for (let i=0;i<8;i++) {
      await page.evaluate(n=>goTo(n),i);
      await page.waitForTimeout(100);
      const data=await page.evaluate(()=>{
        const s=document.querySelector('.slide.active');
        const rect=s.getBoundingClientRect();
        const footer=s.querySelector('.slide-bottom').getBoundingClientRect();
        const bad=[];
        for(const e of s.querySelectorAll('h1,h2,p,figure,figcaption,.steps,.year,.comparison,.conclusion,.energy,.impact')) {
          const r=e.getBoundingClientRect();
          if(r.width&&r.height&&(r.left<rect.left-1||r.right>rect.right+1||r.top<rect.top-1||r.bottom>rect.bottom+1))bad.push({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,30),rect:{x:r.x,y:r.y,w:r.width,h:r.height}});
          if(e.closest('.slide-body')&&r.bottom>footer.top+1)bad.push({footerOverlap:e.className||e.tagName,text:e.textContent.slice(0,30)});
        }
        return {page:current+1,bad,images:[...s.querySelectorAll('img')].every(x=>x.complete&&x.naturalWidth>0),overflow:document.documentElement.scrollWidth>innerWidth};
      });
      report.push({viewport:name,...data});
      if(name!=='landscape')await page.screenshot({path:`output/playwright/${name}-${i+1}.png`,scale:'css',animations:'disabled'});
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>goTo(0));
  await page.keyboard.press('ArrowRight');
  const keyboard=await page.evaluate(()=>current===1);
  await page.getByRole('button',{name:'讲稿',exact:true}).click();
  const notes=await page.locator('#notes').isVisible();
  await page.screenshot({path:'output/playwright/notes.png',scale:'css',animations:'disabled'});
  await page.getByRole('button',{name:'关闭讲稿'}).click();
  await page.getByRole('button',{name:'总览',exact:true}).click();
  await page.locator('.overview-item').nth(5).click();
  const overview=await page.evaluate(()=>current===5&&!document.querySelector('#overviewDialog').open);
  await page.evaluate(()=>resetTimer());
  await page.getByRole('button',{name:'开始4分钟排练计时'}).click();
  await page.waitForTimeout(1100);
  const ticking=await page.evaluate(()=>getElapsed()>1&&running);
  await page.getByRole('button',{name:'暂停排练计时'}).click();
  const paused=await page.evaluate(()=>!running&&elapsed>1);
  const auto=await page.evaluate(()=>{
    $('autoAdvance').checked=true;elapsed=30;startedAt=performance.now();running=true;paintTimer();const advance=current===1;
    elapsed=240;startedAt=performance.now();paintTimer();const finish=current===7&&!running&&$('timerValue').textContent==='00:00';
    $('autoAdvance').checked=false;resetTimer();return {advance,finish};
  });
  await page.getByRole('button',{name:'参考资料',exact:true}).click();
  const sources=await page.locator('#sourcesDialog').isVisible()&&await page.locator('#imageCredits li').count()===6;
  await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await page.evaluate(()=>getComputedStyle(document.querySelector('.slide.active')).animationName==='none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  const externalAssets=await page.evaluate(()=>[...document.querySelectorAll('img')].filter(x=>!x.src.startsWith('data:')).length);
  await page.evaluate(()=>goTo(0));
  await page.evaluate(r=>window.qaReport=r,{report,errors,keyboard,notes,overview,ticking,paused,auto,sources,reduced,externalAssets});
  return {report,errors,keyboard,notes,overview,ticking,paused,auto,sources,reduced,externalAssets};
}
