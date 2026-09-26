---
name: Exousia Cinematic System
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e3beb8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#aa8984'
  outline-variant: '#5a403c'
  surface-tint: '#ffb4a8'
  primary: '#ffb4a8'
  on-primary: '#690000'
  primary-container: '#8b0000'
  on-primary-container: '#ff907f'
  inverse-primary: '#b52619'
  secondary: '#ffb4a8'
  on-secondary: '#680201'
  secondary-container: '#8c1f14'
  on-secondary-container: '#ff9f90'
  tertiary: '#c8c6c5'
  on-tertiary: '#313030'
  tertiary-container: '#434242'
  on-tertiary-container: '#b1aeae'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#920703'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#ffb4a8'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#891d12'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Bebas Neue
    fontSize: 72px
    fontWeight: '400'
    lineHeight: 72px
    letterSpacing: 0.1em
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Bebas Neue
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: 0.05em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.15em
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style

The design system is a premium, cinematic interface rooted in the aesthetic of high-stakes scientific mystery and electromagnetic anomalies. It evokes the feeling of a high-end research facility’s terminal—atmospheric, authoritative, and slightly volatile.

The style is a fusion of **Digital-Analog Hybrid** and **Cinematic Minimalism**. It relies on light-to-dark transitions rather than physical borders. Visual interest is driven by atmospheric bloom, subtle film grain textures, and "flickering" states that suggest a system operating on the edge of a stable reality. Every interaction should feel like a pulse of energy being directed through a cathode-ray tube.

## Colors

The palette is anchored in absolute darkness to maximize the impact of "light-bleed" effects. 

- **The Void:** Use `#050505` for main backgrounds to create a true black canvas.
- **The Fog:** Use `#0a0a0a` and `#1a1a1a` for surface layering and container backgrounds, creating a sense of depth without distinct edges.
- **The Signal:** Deep Crimson (`#8b0000`) and Dark Red (`#660000`) serve as the primary conduits of information. These colors should rarely be flat; they are almost always accompanied by a Gaussian blur glow to simulate illumination in a dark environment.
- **The Readout:** Use `#e0e0e0` for primary text. When used for headers, apply a subtle Crimson outer glow to suggest the text is backlit.

## Typography

The typography system balances cinematic impact with technical precision.

- **Headlines:** Utilize **Bebas Neue** for an authoritative, vertical, and cinematic feel. Large headers should feature a subtle "chromatic aberration" effect—a 1px offset of red and blue channels—to mimic lens distortion.
- **Body:** Use **Geist** for its clean, technical, and slightly cold aesthetic. It provides high legibility against dark backgrounds.
- **Labels & Data:** Use **JetBrains Mono** for all metadata, timestamps, and status readouts. This reinforces the "laboratory terminal" narrative. 

Text should never be pure white. All typography should have a slight opacity (85-90%) to allow the background texture to bleed through.

## Layout & Spacing

The layout philosophy follows a **Cinematic Wide** model. Content is often centered with significant lateral negative space to create a feeling of isolation and focus.

- **Grid:** Use a 12-column fluid grid for desktop with wide margins (`64px`) to compress the content area, forcing a focused, tunnel-vision experience.
- **Negative Space:** Embrace extreme vertical spacing between sections (`120px+`) to allow the background "fog" and grain textures to dominate.
- **Mobile:** Transition to a 4-column grid with `20px` margins. Typography scales aggressively to maintain the dramatic impact of the headlines.

## Elevation & Depth

In this design system, depth is achieved through **Atmospheric Bloom** rather than shadows. 

- **Tonal Layers:** Surfaces do not "float" with shadows. Instead, elevated elements use a slightly lighter background (`#1a1a1a`) and a "rim light" effect—a 1px inner stroke on the top and left edges using a low-opacity Crimson or Ash Grey.
- **Glow & Bloom:** Active elements (like buttons or selected states) should emit a soft, diffused `30px` Gaussian blur glow in Crimson.
- **Texture Overlay:** A global film grain or noise overlay (opacity 3-5%) must sit atop the entire UI to kill the "digital perfection" of the hex codes and provide a tactile, analog feel.

## Shapes

The shape language is strictly **Sharp (0)**. To maintain the brutal, technical feel of a laboratory instrument, rounded corners are avoided. 

Every container and button should be a perfect rectangle. If a container requires visual distinction, use "clipped corners" (45-degree chamfers) on the top-right and bottom-left to emphasize a military or industrial engineering aesthetic.

## Components

- **Buttons:** Rectangular with no fill and a 1px Crimson border. On hover, the button fills with a semi-transparent Crimson, and the text gains a "flicker" animation (opacity cycling between 70% and 100% rapidly).
- **Input Fields:** A single bottom border (1px) in Ash Grey. When focused, the border turns Crimson and emits a soft glow. The cursor should be a solid block rather than a line.
- **Cards/Containers:** No background fill by default. Use a 1px semi-transparent border or a subtle vertical gradient that fades from `#1a1a1a` to `#050505`.
- **Status Indicators:** Use a "Digital Glitch" effect for warnings. These elements should occasionally shift 2-3 pixels horizontally to simulate signal interference.
- **Scanlines:** Apply a subtle, repeating horizontal line pattern (1px height, 4px gap, 2% opacity) over image headers to reinforce the CRT screen narrative.
- **Progress Bars:** Segmented blocks rather than a smooth continuous line, mimicking old hardware loading sequences.