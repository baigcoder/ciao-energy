# CIAO ENERGY — ASSET PIPELINE & INVENTORY SPECIFICATION

## 1. 3D Model Assets

| Asset Identifier | Format | Dimensions / Vertex Count | Material Assigns | Origin / Hosting URL |
|:---|:---|:---|:---|:---|
| **Can Mesh (`can.glb`)** | GLB (binary glTF) | ~4,200 vertices, optimized geometry | `Shell` (Label material), Body (Metallic aluminum rim/cap) | `https://cdn.skaald.com/ciaoenergy/webgl/can.glb` |
| **Pedestal Base (`base.glb`)**| GLB (binary glTF) | ~2,800 vertices | `baseMaterial` (Floor disc & Ceiling disc) | `https://cdn.skaald.com/ciaoenergy/webgl/base.glb` |

---

## 2. Textures & Shading Maps

| Texture Purpose | Format | Resolution | Color Space | Origin URL |
|:---|:---|:---|:---|:---|
| **Label 1 (Double Litchi)** | AVIF / WebP | 2048 × 1024 | SRGBColorSpace | `https://cdn.skaald.com/ciaoenergy/textures/ciao-energy_texture_double-litchi.avif` |
| **Label 2 (Coco Citron Vert)** | AVIF / WebP | 2048 × 1024 | SRGBColorSpace | `https://cdn.skaald.com/ciaoenergy/textures/ciao-energy_texture_coco-citron-vert.avif` |
| **Label 3 (Kiwi Concombre)** | AVIF / WebP | 2048 × 1024 | SRGBColorSpace | `https://cdn.skaald.com/ciaoenergy/textures/ciao-energy_texture_Kiwi-Concombre.avif` |
| **Label 4 (Pêche Blanche)** | AVIF / WebP | 2048 × 1024 | SRGBColorSpace | `https://cdn.skaald.com/ciaoenergy/textures/ciao-energy_texture_peche-blanche.avif` |
| **Label 5 (Pomme Rhubarbe)** | AVIF / WebP | 2048 × 1024 | SRGBColorSpace | `https://cdn.skaald.com/ciaoenergy/textures/ciao-energy_texture_pomme-rhubarbe.avif` |
| **Label 6 (Abricot Framboise)** | AVIF / WebP | 2048 × 1024 | SRGBColorSpace | `https://cdn.skaald.com/ciaoenergy/textures/ciao-energy_texture_abricot_framboise.avif` |
| **Can Metallic Map** | AVIF / WebP | 1024 × 512 | Linear (Data) | `https://cdn.prod.website-files.com/69fb53371d5b8e9c3f4e4c69/6a0edb0e83db8ea830f2875d_5b37bb5107a2849b546a7b5d4bd06ef4_can-metallic-2.avif` |
| **Spotlight Mask Map** | AVIF / WebP | 512 × 512 | Linear (Data) | `https://cdn.prod.website-files.com/69fb53371d5b8e9c3f4e4c69/6a0dda5d7623b3bbf4dd327a_72448b0503e6054a4c92df14f52d7eef_spot-mask.avif` |
| **HDRI Environment** | Radiance HDR | 1024 × 512 | Linear HDR | `https://cdn.skaald.com/ciaoenergy/webgl/hdri2.hdr` |

---

## 3. Typography Assets

| Font Family | Weight / Style | Format | Usage | Origin URL |
|:---|:---|:---|:---|:---|
| **Franklin Gothic Atf** | 900 Black Italic | WOFF2 | Display titles, benefit headers | `https://cdn.prod.website-files.com/69fb53371d5b8e9c3f4e4c69/6a0b3ae273b9c591afba279f_Franklin_Gothic_ATF_Black_Italic.woff2` |
| **Geist** | 300 Light | WOFF2 | Body paragraphs, tasting notes | `https://cdn.prod.website-files.com/69fb53371d5b8e9c3f4e4c69/6a0d6cd3df7330778e84acee_Geist-Light.woff2` |
| **Geist** | 400 Regular | WOFF2 | FAQ questions, buttons | `https://cdn.prod.website-files.com/69fb53371d5b8e9c3f4e4c69/6a17254d942eb32e84bde0f0_Geist-Regular.woff2` |
| **Geistmono** | 400 Regular | WOFF2 | Technical badges, percentage, audio | `https://cdn.prod.website-files.com/69fb53371d5b8e9c3f4e4c69/6a0b0eef462d20ff07b9cbe9_GeistMono-Regular.woff2` |

---

## 4. Audio SFX Assets

| Sound Key | Format | File Size | Description | Origin URL |
|:---|:---|:---|:---|:---|
| `change` | MP3 / 44.1kHz | ~18 KB | UI swipe click on can change | `https://cdn.prod.website-files.com/69fb53371d5b8e9c3f4e4c69/6a1931adeeccb22ae319671f_a05ee47a5e61560727f7dfe21194a4b9_CIAO-ENERGY-defilementui.mp3` |
| `enter` | MP3 / 44.1kHz | ~26 KB | Double mechanical click on hero exit | `https://cdn.prod.website-files.com/69fb53371d5b8e9c3f4e4c69/6a1932a8b13b5bf33b3a1339_c5c6e6976127365d417e66b413c7973e_CIAO-ENERGY-doubleclic-canette.mp3` |
| `benefits` | MP3 / 44.1kHz | ~32 KB | Atmospheric chime on benefit enter | `https://cdn.prod.website-files.com/69fb53371d5b8e9c3f4e4c69/6a19377501bbf3759e07daeb_3c593ea845e9d3018a1e70a20d53b230_CIAO-ENERGY-transition2.mp3` |
| `click` | MP3 / 44.1kHz | ~14 KB | Clean tactile click on menu / buttons | `https://cdn.prod.website-files.com/69fb53371d5b8e9c3f4e4c69/6a193703d7e9f8e098677ed1_dd3a7d784cae6dde94102dfd0857c348_CIAO-ENERGY-Clickui.mp3` |

---

## 5. Media & Video Loops

| Media Purpose | Formats | Poster | Origin URL |
|:---|:---|:---|:---|
| **Loader Video** | WebM / MP4 | `Ciao-energy_loader.avif` | `https://cdn.skaald.com/ciaoenergy/loader/Ciao-energy_loader-v2.webm` |
| **Double Litchi Loop** | WebM / MP4 | `Ciao-energy_background_double-litchi.avif` | `https://cdn.skaald.com/ciaoenergy/loop/Ciao-energy_background_double-litchi.webm` |
| **Coco Citron Loop** | WebM / MP4 | `Ciao-energy_background_coco-citron.avif` | `https://cdn.skaald.com/ciaoenergy/loop/Ciao-energy_background_coco-citron.webm` |
| **Kiwi Concombre Loop** | WebM / MP4 | `Ciao-energy_background_kiwi-concombre.avif` | `https://cdn.skaald.com/ciaoenergy/loop/Ciao-energy_background_kiwi-concombre.webm` |
| **Pêche Blanche Loop** | WebM / MP4 | `Ciao-energy_background_peche-blanche.avif` | `https://cdn.skaald.com/ciaoenergy/loop/Ciao-energy_background_peche-blanche.webm` |
| **Pomme Rhubarbe Loop** | WebM / MP4 | `Ciao-energy_background_pomme-rhubarbe.avif` | `https://cdn.skaald.com/ciaoenergy/loop/Ciao-energy_background_pomme-rhubarbe.webm` |
| **Abricot Framboise Loop** | WebM / MP4 | `Ciao-energy_background_abricot-framboise.avif` | `https://cdn.skaald.com/ciaoenergy/loop/Ciao-energy_background_framboise.webm` |
