# 📁 Digital Scrapbook Assets

This directory contains visual assets used throughout the Digital Scrapbook design system.

## Folder Structure

```
assets/
├── paper/          # Paper background textures (light, dark, notebook, kraft)
├── textures/       # Overlay textures (grain, noise, vintage)
├── tape/           # Washi tape strip images
├── doodles/        # Hand-drawn SVG doodles (heart, flower, star, cloud, smile)
├── stickers/       # Decorative sticker PNG/SVG images
├── stamps/         # Rubber stamp style graphics
├── polaroid/       # Polaroid frame overlays and decorations
└── backgrounds/    # Full-page background images
```

## Usage

Import assets directly from their folder:

```tsx
import heartDoodle from "../assets/doodles/heart.svg";
import paperLight from "../assets/paper/paper-light.webp";
```

## Guidelines

- **SVG** preferred for doodles, stickers, stamps (scalable, tiny file size)
- **WebP** preferred for paper textures and backgrounds (smaller than PNG)
- Keep file sizes under 50KB where possible
- Use transparent backgrounds for stickers and stamps
