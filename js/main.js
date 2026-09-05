(function fitText() {
  var container  = document.querySelector('.hero-text-container');
  var el          = document.querySelector('.hero-title');
  var textSpan    = document.getElementById('fm-text');
  if (!container || !el || !textSpan) return;

  // Ensure span behaves as an intrinsic-width element for accurate DOM measurement
  textSpan.style.display = 'inline-block';

  function scale() {
    // 1. Determine available width inside container
    var containerStyle = window.getComputedStyle(container);
    var padding = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
    var targetW = container.clientWidth - padding;

    // 2. Set test size
    var testSize = 200;
    el.style.fontSize = testSize + 'px';
    
    // Force reflow and fetch applied styles
    var elStyle = window.getComputedStyle(el);
    var text = textSpan.textContent.trim();
    
    // 3. Measure DOM layout width (includes letter-spacing padding on the right)
    var rect = textSpan.getBoundingClientRect();
    var measuredVisualW = rect.width;
    var leftSideBearing = 0;
    
    // 4. Use Canvas for exact visual ink bounds
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      ctx.font = elStyle.fontWeight + ' ' + testSize + 'px ' + elStyle.fontFamily;
      
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = elStyle.letterSpacing;
        var metrics = ctx.measureText(text);
        if (metrics.actualBoundingBoxLeft !== undefined && metrics.actualBoundingBoxRight !== undefined) {
          measuredVisualW = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
          leftSideBearing = -metrics.actualBoundingBoxLeft;
        }
      } else {
        // DOM Fallback: Adjust for trailing negative letter-spacing
        var ls = parseFloat(elStyle.letterSpacing);
        if (!isNaN(ls)) {
          measuredVisualW = rect.width - ls; // if ls is negative, this increases visual width
        }
      }
    } catch (e) {
      // Silent fallback to standard measurement
    }

    // 5. Calculate new font size
    var scaleRatio = targetW / measuredVisualW;
    var newSize = testSize * scaleRatio;
    
    // 6. Apply calculated size and offset
    el.style.fontSize = newSize + 'px';
    var finalLeftOffset = leftSideBearing * scaleRatio;
    el.style.marginLeft = -finalLeftOffset + 'px';
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scale);
  }
  
  scale();
  
  // Debounce resize to prevent performance issues
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(scale, 100);
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll('.hero-slide');
  const progressBar = document.getElementById('hero-progress-bar');
  if(slides.length === 0) return;

  let currentIndex = 0;
  const slideDuration = 4000; // 4 seconds per image
  let startTime;
  let animationFrame;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.remove('active', 'exit');
      if(i === index) {
        slide.classList.add('active');
      } else if (i === (index - 1 + slides.length) % slides.length) {
        slide.classList.add('exit');
      }
    });
    
    startTime = performance.now();
    cancelAnimationFrame(animationFrame);
    updateProgress(startTime);
  }

  function updateProgress(timestamp) {
    const elapsed = timestamp - startTime;
    let progress = (elapsed / slideDuration) * 100;
    
    if (progress >= 100) {
      progress = 100;
      progressBar.style.width = '100%';
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    } else {
      progressBar.style.width = progress + '%';
      animationFrame = requestAnimationFrame(updateProgress);
    }
  }

  // Start first slide
  showSlide(currentIndex);
});

document.addEventListener("DOMContentLoaded", () => {
  const outerSection = document.querySelector('.horizontal-scroll-outer');
  const track = document.querySelector('.horizontal-track');
  const viewport = document.querySelector('.horizontal-viewport');
  
  if(!outerSection || !track || !viewport) return;

  let maxScroll = 0;

  function updateMaxScroll() {
    // Calculate how far the track can move horizontally
    maxScroll = track.scrollWidth - viewport.clientWidth;
  }

  // Update dimensions on resize
  const resizeObserver = new ResizeObserver(() => {
    updateMaxScroll();
    handleScroll();
  });
  resizeObserver.observe(track);
  resizeObserver.observe(viewport);

  function handleScroll() {
    const rect = outerSection.getBoundingClientRect();
    const scrollHeight = rect.height - window.innerHeight;
    
    // Calculate scroll progress relative to the outer section (0 to 1)
    let progress = -rect.top / scrollHeight;
    progress = Math.max(0, Math.min(1, progress));
    
    // Map progress to horizontal translation
    const translateX = -(progress * maxScroll);
    
    // Apply transform without smoothing (scroll-driven feels more native)
    track.style.transform = `translate3d(${translateX}px, 0, 0)`;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Initial state
  updateMaxScroll();
  handleScroll();
});
