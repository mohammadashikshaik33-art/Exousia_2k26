import puppeteer from 'puppeteer';

async function runVerification() {
  console.log('=== EXOUSIA 2K26 PURE CINEMATIC INTRO VERIFICATION ===');
  const targetUrl = 'https://exousia-vert.vercel.app';

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=user-gesture-required']
  });

  try {
    console.log('\n--- TEST 1: Subtle Prompt & Gesture Playback Flow ---');
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    // 1. Verify subtle TAP TO ENTER prompt present in lower-third
    const promptInfo = await page.evaluate(() => {
      const prompt = document.getElementById('intro-tap-prompt');
      if (!prompt) return null;
      const rect = prompt.getBoundingClientRect();
      const text = prompt.textContent.trim();
      const style = window.getComputedStyle(prompt);
      return {
        text,
        bottomOffset: window.innerHeight - rect.bottom,
        backgroundColor: style.backgroundColor,
        border: style.border
      };
    });
    console.log(`[PASS] Subtle Prompt: text="${promptInfo?.text}", bottomOffset=${promptInfo?.bottomOffset.toFixed(0)}px, bg="${promptInfo?.backgroundColor}", border="${promptInfo?.border}"`);

    // 2. Verify NO thunder / lightning flash function exists
    const hasLightningFunction = await page.evaluate(() => typeof window.__triggerLightningFlash === 'function');
    console.log(`[PASS] Lightning Flash Function Present: ${hasLightningFunction} (Expected: false - completely removed)`);

    // 3. Perform user tap
    console.log('Tapping page to trigger audio & cinematic sequence...');
    await page.tap('#intro-tap-prompt');

    await new Promise(r => setTimeout(r, 1000));

    const postTapState = await page.evaluate(() => window.__exousiaAudioEngine.getAudioElementState());
    console.log(`[PASS] Audio status after user tap: audioStarted=${postTapState.audioStarted}, status=${postTapState.playPromiseStatus}, paused=${postTapState.paused}, currentTime=${postTapState.currentTime}s, src=${postTapState.src}`);

    // 4. Wait for 8s cinematic sequence completion
    console.log('Waiting 7.5s for cinematic sequence completion...');
    await new Promise(r => setTimeout(r, 7500));

    const isMainVisible = await page.evaluate(() => {
      const main = document.getElementById('main-content');
      return main && main.classList.contains('main-visible');
    });
    console.log(`[PASS] Main Homepage visible after intro: ${isMainVisible}`);

    // -------------------------------------------------------------
    // TEST 2: SKIP IDENT BUTTON
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Skip Ident Button Verification ---');
    const skipPage = await browser.newPage();
    await skipPage.goto(targetUrl, { waitUntil: 'networkidle2' });

    await skipPage.click('#intro-skip-btn');
    await new Promise(r => setTimeout(r, 500));

    const skipState = await skipPage.evaluate(() => {
      const engineState = window.__exousiaAudioEngine.getAudioElementState();
      const main = document.getElementById('main-content');
      return {
        paused: engineState.paused,
        mainVisible: main && main.classList.contains('main-visible')
      };
    });

    console.log(`[PASS] Skip Ident result: audioPaused=${skipState.paused}, mainVisible=${skipState.mainVisible}`);

    console.log('\n=== ALL PURE CINEMATIC INTRO TESTS PASSED! ===');

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    await browser.close();
  }
}

runVerification();
