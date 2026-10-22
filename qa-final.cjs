async (page) => {
  const assert = (condition, message, detail) => {
    if (!condition) throw new Error(message + (detail ? ': ' + JSON.stringify(detail) : ''));
  };
  const errors = [];
  const onError = error => errors.push(String(error));
  page.on('pageerror', onError);
  const layouts = [];
  const fullscreen = [];
  const chromeState = () => page.evaluate(() => ['.app-head', '.control-bar', '.bottom-progress'].map(selector => {
    const node = document.querySelector(selector);
    if (!node) return { selector, missing: true };
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return { selector, display: style.display, visibility: style.visibility, opacity: Number(style.opacity), width: rect.width, height: rect.height };
  }));
  const checkHidden = async label => {
    const state = await chromeState();
    assert(await page.evaluate(() => !!document.fullscreenElement), 'Browser did not enter real fullscreen', label);
    assert(state.every(item => !item.missing && item.display === 'none' && item.width === 0 && item.height === 0), 'Fullscreen chrome must use display:none', { label, state });
    for (const selector of ['.app-head', '.control-bar', '.bottom-progress']) assert(!await page.locator(selector).isVisible(), 'Fullscreen chrome remains visible', { label, selector });
    return state;
  };
  try {
    await page.reload();
    await page.waitForFunction(() => typeof goTo === 'function' && document.querySelectorAll('.slide').length === 8);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
      document.activeElement?.blur();
    });
    const stripped = await page.evaluate(() => ({
      removed: [...document.querySelectorAll('#notes,#notesBtn,#overviewBtn,#overviewDialog,#overviewGrid,#timerBtn,#timerValue,#timingProgress,.timing-progress,#autoAdvance,#resetTimer,.speaker-info,#speakerTime')].map(node => node.id || node.className),
      bottomButtons: [...document.querySelectorAll('.control-bar button')].map(button => button.id).sort(),
      timing: /\b\d{1,2}\s*[:\uff1a]\s*\d{2}\b|\d+\s*(?:\u5206\u949f|\u79d2)|\u8ba1\u65f6|\u5012\u8ba1\u65f6/.test(document.title + '\n' + [...document.querySelectorAll('.slide')].map(slide => slide.textContent).join('\n')),
      allImagesLoaded: [...document.images].every(image => image.complete && image.naturalWidth > 0)
    }));
    assert(stripped.removed.length === 0 && !stripped.timing, 'Removed feature or report duration remains in the presentation', stripped);
    assert(JSON.stringify(stripped.bottomButtons) === JSON.stringify(['fullBtn', 'next', 'prev']), 'Bottom navigation contains extra controls', stripped.bottomButtons);
    assert(stripped.allImagesLoaded, 'A presentation image did not load');

    for (const [width, height, name] of [[1440, 1000, 'desktop'], [375, 812, 'mobile']]) {
      await page.setViewportSize({ width, height });
      for (let index = 0; index < 8; index++) {
        await page.evaluate(value => goTo(value), index);
        await page.waitForTimeout(120);
        const layout = await page.evaluate(() => {
          const slide = document.querySelector('.slide.active');
          const bounds = slide.getBoundingClientRect();
          const viewport = document.querySelector('#viewport').getBoundingClientRect();
          const footer = slide.querySelector('.slide-bottom')?.getBoundingClientRect();
          const bad = [];
          for (const node of slide.querySelectorAll('h1,h2,h3,p,figure,figcaption,.steps,.comparison,.conclusion,.energy,.impact,.principle,.experiment,.formula,.result')) {
            const rect = node.getBoundingClientRect();
            if (!rect.width || !rect.height) continue;
            if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1 || (footer && node.closest('.slide-body') && rect.bottom > footer.top + 1)) bad.push({ tag: node.tagName, className: node.className, text: node.textContent.trim().slice(0, 40) });
            if (node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 2 && !node.matches('figure')) bad.push({ textOverflow: node.className || node.tagName });
          }
          return {
            page: current + 1, bad,
            images: [...slide.querySelectorAll('img')].every(image => image.complete && image.naturalWidth > 0),
            fits: bounds.left >= viewport.left - 1 && bounds.right <= viewport.right + 1 && bounds.top >= viewport.top - 1 && bounds.bottom <= viewport.bottom + 1,
            overflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
            timedTitle: /\d+\s*\u5206\u949f|\u8ba1\u65f6|\u5012\u8ba1\u65f6/.test(document.title)
          };
        });
        layouts.push({ viewport: name, ...layout });
        assert(layout.page === index + 1 && layout.images && layout.fits && !layout.overflow && !layout.bad.length && !layout.timedTitle, 'Final slide layout regression', { viewport: name, layout });
        await page.screenshot({ path: `output/playwright/final-${name}-${index + 1}.png`, scale: 'css', animations: 'disabled' });
      }

      await page.evaluate(() => { goTo(0); document.activeElement?.blur(); });
      const normal = await chromeState();
      assert(normal.every(item => !item.missing && item.display !== 'none' && item.width > 0 && item.height > 0), 'Presentation chrome is missing outside fullscreen', { viewport: name, normal });
      await page.locator('#fullBtn').click();
      await page.waitForFunction(() => !!document.fullscreenElement, undefined, { timeout: 5000 });
      await page.waitForTimeout(150);
      const entered = await checkHidden(name + ': entered');
      await page.screenshot({ path: `output/playwright/final-${name}-fullscreen.png`, scale: 'css', animations: 'disabled' });
      const dimensions = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
      for (const y of [dimensions.height - 2, dimensions.height - 35, dimensions.height - 75]) {
        await page.mouse.move(Math.round(dimensions.width / 2), Math.max(1, y));
        await page.waitForTimeout(80);
        await checkHidden(name + ': pointer at y=' + y);
      }
      await page.screenshot({ path: `output/playwright/final-${name}-fullscreen-bottom-hover.png`, scale: 'css', animations: 'disabled' });
      await page.keyboard.press('ArrowRight');
      assert(await page.evaluate(() => current === 1), 'Keyboard navigation failed in fullscreen', name);
      await checkHidden(name + ': after arrow navigation');
      await page.keyboard.press('f');
      await page.waitForFunction(() => !document.fullscreenElement, undefined, { timeout: 5000 });
      await page.waitForTimeout(150);
      const restored = await chromeState();
      assert(restored.every((item, index) => !item.missing && item.display === normal[index].display && item.width > 0 && item.height > 0), 'F did not restore the normal controls', { viewport: name, normal, restored });
      assert(await page.locator('#prev').isVisible() && await page.locator('#next').isVisible() && await page.locator('#fullBtn').isVisible(), 'Bottom controls did not return after leaving fullscreen', name);
      fullscreen.push({ viewport: name, entered, bottomHoverHidden: true, keyboard: true, restored });
      await page.locator('#prev').click();
      assert(await page.evaluate(() => current === 0), 'Previous button failed after fullscreen', name);
      await page.keyboard.press('ArrowRight');
      assert(await page.evaluate(() => current === 1), 'Arrow navigation failed after fullscreen', name);
      await page.locator('#sourcesBtn').click();
      assert(await page.locator('#sourcesDialog').isVisible(), 'Sources dialog failed after fullscreen', name);
      assert(await page.locator('#imageCredits li').count() >= 6, 'Image credits are incomplete', name);
      await page.keyboard.press('Escape');
      assert(!await page.locator('#sourcesDialog').isVisible(), 'Sources dialog did not close with Escape', name);
    }

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => goTo(0));
    await page.screenshot({ path: 'output/playwright/final-cover.png', scale: 'css', animations: 'disabled' });
    await page.pdf({ path: 'output/playwright/print-check.pdf', printBackground: true, preferCSSPageSize: true });
    assert(errors.length === 0, 'Browser runtime errors', errors);
    const result = { errors, layouts, stripped, fullscreen, sources: true, allImagesLoaded: stripped.allImagesLoaded };
    await page.evaluate(value => { window.qaFinalReport = value; }, result);
    return result;
  } finally {
    if (await page.evaluate(() => !!document.fullscreenElement).catch(() => false)) await page.evaluate(() => document.exitFullscreen());
    page.off('pageerror', onError);
  }
}
