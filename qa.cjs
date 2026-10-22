async (page) => {
  const assert = (condition, message, detail) => {
    if (!condition) throw new Error(message + (detail ? ': ' + JSON.stringify(detail) : ''));
  };
  const errors = [];
  const onError = error => errors.push(String(error));
  page.on('pageerror', onError);
  const report = [];
  let phase = 'load';
  try {
    await page.reload();
    await page.waitForFunction(() => typeof goTo === 'function' && document.querySelectorAll('.slide').length === 8);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
      document.activeElement?.blur();
    });
    const structure = await page.evaluate(() => {
      const removed = '#notes,#notesBtn,#closeNotes,#notesHeading,#notesPerson,#notesTitle,#notesScript,#notesCue,#notesSource,#overviewDialog,#overviewBtn,.overview-item,#overviewGrid,#timerBtn,#timerValue,#timerIcon,#timingProgress,.timing-progress,#autoAdvance,#resetTimer,.speaker-info,#speakerTime,#helpBtn,#helpDialog,.app-head strong';
      const timing = /\b\d{1,2}\s*[:\uff1a]\s*\d{2}\b|[\d\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]+\s*(?:\u5206[\u949f\u9418]|\u79d2)|(?:\u5012)?[\u8ba1\u8a08][\u65f6\u6642]|[\u62a5\u5831]\u544a[\u65f6\u6642][\u957f\u9577]|\u6f14[\u8bb2\u8b1b][\u65f6\u6642][\u957f\u9577]/;
      const chineseCopy = document.title + '\n' + [...document.querySelectorAll('.slide,.app-head')].map(node => node.textContent).join('\n') + '\n' + [...document.images].map(image => image.alt).join('\n');
      return {
        removed: [...document.querySelectorAll(removed)].map(node => node.id || node.className),
        bottomButtons: [...document.querySelectorAll('.control-bar button')].map(button => button.id).sort(),
        headerButtons: [...document.querySelectorAll('.app-head button')].map(button => button.id).sort(),
        headerHasKeyHint: !!document.querySelector('.app-head .key-hint'),
        staleLabels: /[\u8bb2\u8b1b]\u7a3f|[\u603b\u7e3d][\u89c8\u89bd]|(?:\u5012)?[\u8ba1\u8a08][\u65f6\u6642]/.test(document.body.innerText),
        lang: document.documentElement.lang,
        traditionalCopy: document.querySelector('#sourcesBtn')?.textContent.trim() === '\u53c3\u8003\u8cc7\u6599' && document.querySelector('#title2')?.textContent.trim() === '\u4f0f\u6253\u7684\u96fb\u5806' && document.querySelector('#title8')?.textContent.includes('\u5169\u9805\u8ca2\u737b'),
        simplifiedCopy: /\u53c2\u8003\u8d44\u6599|\u7535\u5806|\u7535\u6c60|\u53d1\u7535|\u7535\u78c1\u611f\u5e94|\u73b0\u4ee3\u751f\u6d3b|\u4e24\u9879\u8d21\u732e/.test(chineseCopy),
        timedSlides: [...document.querySelectorAll('.slide')].flatMap((slide, index) => timing.test(slide.textContent) ? [index + 1] : []),
        timedTitle: timing.test(document.title),
        externalAssets: [...document.images].filter(image => !image.src.startsWith('data:')).length
      };
    });
    assert(structure.removed.length === 0, 'Removed controls or in-page narration remain', structure.removed);
    assert(JSON.stringify(structure.bottomButtons) === JSON.stringify(['fullBtn', 'next', 'prev']), 'Bottom bar must contain exactly previous, next and fullscreen buttons', structure.bottomButtons);
    assert(JSON.stringify(structure.headerButtons) === JSON.stringify(['sourcesBtn']) && structure.headerHasKeyHint, 'Header must contain only sources and its keyboard hint', structure);
    assert(structure.lang === 'zh-Hant' && structure.traditionalCopy && !structure.simplifiedCopy, 'Traditional Chinese language or representative copy is incorrect', structure);
    assert(!structure.staleLabels && !structure.timedTitle && !structure.timedSlides.length, 'Presentation still exposes narration, overview or report duration', structure);
    assert(structure.externalAssets === 0, 'Presentation images must work offline', structure.externalAssets);

    for (const [width, height, name] of [[1440, 1000, 'desktop'], [375, 812, 'mobile'], [844, 390, 'landscape']]) {
      await page.setViewportSize({ width, height });
      for (let index = 0; index < 8; index++) {
        phase = `${name} slide ${index + 1}`;
        await page.evaluate(value => goTo(value), index);
        await page.evaluate(async () => {
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          await Promise.all(document.querySelector('.slide.active').getAnimations().map(animation => animation.finished.catch(() => {})));
        });
        const result = await page.evaluate(() => {
          const active = document.querySelector('.slide.active');
          const bounds = active.getBoundingClientRect();
          const viewport = document.querySelector('#viewport').getBoundingClientRect();
          const footer = active.querySelector('.slide-bottom')?.getBoundingClientRect();
          const bad = [];
          const visible = node => {
            if (!node) return false;
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
          };
          for (const node of active.querySelectorAll('h1,h2,h3,p,figure,figcaption,.steps,.year,.comparison,.conclusion,.energy,.impact,.material,.principle,.experiment,.formula,.result,.label,.eyebrow')) {
            if (!visible(node)) continue;
            const rect = node.getBoundingClientRect();
            const text = node.textContent.trim().slice(0, 45);
            if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1) bad.push({ type: 'slideBounds', tag: node.tagName, className: node.className, text });
            if (footer && node.closest('.slide-body') && rect.bottom > footer.top + 1) bad.push({ type: 'footerOverlap', tag: node.tagName, className: node.className, text });
            if (node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 2 && !node.matches('figure')) bad.push({ type: 'textOverflow', tag: node.tagName, className: node.className, text });
          }
          return {
            page: current + 1, bad,
            activeSlides: document.querySelectorAll('.slide.active').length,
            images: [...active.querySelectorAll('img')].every(image => image.complete && image.naturalWidth > 0),
            overflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
            stageFits: bounds.left >= viewport.left - 1 && bounds.right <= viewport.right + 1 && bounds.top >= viewport.top - 1 && bounds.bottom <= viewport.bottom + 1,
            pageCount: document.querySelector('#pageNow')?.textContent,
            controlsVisible: ['prev', 'next', 'fullBtn', 'sourcesBtn'].every(id => visible(document.getElementById(id))),
            timedTitle: /\d+\s*\u5206[\u949f\u9418]|(?:\u5012)?[\u8ba1\u8a08][\u65f6\u6642]/.test(document.title)
          };
        });
        report.push({ viewport: name, ...result });
        assert(result.page === index + 1 && result.activeSlides === 1, 'goTo must activate exactly the requested slide', { viewport: name, index, result });
        assert(result.images && !result.overflow && result.stageFits && !result.bad.length, 'Slide layout or image regression', { viewport: name, index, result });
        assert(Number(result.pageCount) === index + 1 && result.controlsVisible && !result.timedTitle, 'Navigation, header or browser title regression', { viewport: name, index, result });
        await page.screenshot({ path: `output/playwright/${name}-${index + 1}.png`, scale: 'css', animations: 'disabled' });
      }
    }

    phase = 'keyboard';
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => { goTo(0); document.activeElement?.blur(); });
    assert(await page.locator('#prev').isDisabled(), 'Previous button must be disabled on the first slide');
    await page.locator('#next').click();
    assert(await page.evaluate(() => current === 1), 'Next button does not advance');
    await page.keyboard.press('ArrowRight');
    assert(await page.evaluate(() => current === 2), 'Right arrow does not advance');
    await page.keyboard.press('ArrowLeft');
    assert(await page.evaluate(() => current === 1), 'Left arrow does not return');
    await page.keyboard.press('End');
    assert(await page.evaluate(() => current === 7) && await page.locator('#next').isDisabled(), 'End key or final-slide boundary is broken');
    await page.keyboard.press('Home');
    assert(await page.evaluate(() => current === 0), 'Home key does not return to the cover');
    await page.locator('#prev').evaluate(button => button.blur());
    await page.keyboard.press('n');
    await page.keyboard.press('o');
    await page.keyboard.press('t');
    await page.keyboard.press('?');
    assert(await page.evaluate(() => current === 0 && !document.querySelector('dialog[open]') && !document.querySelector('#notes')), 'Removed shortcuts still trigger a presentation feature');

    phase = 'sources';
    await page.locator('#sourcesBtn').click();
    assert(await page.locator('#sourcesDialog').isVisible(), 'Sources dialog does not open');
    const credits = await page.locator('#imageCredits li').count();
    assert(credits >= 6, 'Image source credits are incomplete', credits);
    await page.screenshot({ path: 'output/playwright/sources.png', scale: 'css', animations: 'disabled' });
    await page.keyboard.press('ArrowRight');
    assert(await page.evaluate(() => current === 0), 'Arrow keys must not change slides while a dialog is open');
    await page.keyboard.press('Escape');
    assert(!await page.locator('#sourcesDialog').isVisible(), 'Escape does not close sources');
    phase = 'removed help';
    await page.keyboard.press('?');
    assert(await page.evaluate(() => !document.querySelector('#helpBtn,#helpDialog,.app-head strong,dialog[open]')), 'Removed help control, heading or shortcut remains');

    phase = 'swipe';
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => goTo(2));
    const touch = await page.context().newCDPSession(page);
    try {
      for (const [start, end, expected] of [[300, 70, 3], [70, 300, 2]]) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start, y: 350 }] });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: end, y: 350 }] });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        assert(await page.evaluate(value => current === value, expected), 'Horizontal touch swipe does not navigate', { start, end, expected });
      }
    } finally {
      await touch.detach();
    }

    phase = 'reduced motion';
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reduced = await page.evaluate(() => getComputedStyle(document.querySelector('.slide.active')).animationName === 'none');
    assert(reduced, 'Reduced-motion preference is not respected');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => goTo(0));
    assert(errors.length === 0, 'Browser runtime errors', errors);
    const result = { report, errors, structure, credits, keyboard: true, swipe: true, sources: true, removedHelp: true, traditionalChinese: true, reduced };
    await page.evaluate(value => { window.qaReport = value; }, result);
    return result;
  } catch (error) {
    throw new Error(`${phase} at ${page.url()}: ${error.message}`);
  } finally {
    page.off('pageerror', onError);
  }
}
