# 🎶 Vinyl Music Player

> A frontend pet project — an interactive 3D vinyl record player with real audio playback

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Babylon.js](https://img.shields.io/badge/Babylon.js-BB464B?style=for-the-badge&logo=babylondotjs&logoColor=white)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white)

## 📸 Project Preview

![View](https://docs.google.com/uc?id=1R30vvDzTUWzNaWAYn7PmLPmfNut1UqtA)

## 🎯 Project Goal

This project was built as a **learning pet project** with the main purpose to:

- **Learn Babylon.js** — build and animate a 3D scene from `.glb` models entirely in code
- **Practice 3D animations** — tonearm lift/rotate, disc swap, smooth spin acceleration/deceleration
- **Work with the Web Audio API** — audio playback, track progress, volume control, and audio output device selection

## 🚀 Tech Stack

### Core Technologies

- **React 19** — UI library for building the application
- **TypeScript** — typed superset of JavaScript
- **Vite (Rolldown)** — fast dev server and bundler
- **Tailwind CSS 4** — utility-first CSS framework

### 3D & Animation

- **Babylon.js** — 3D engine for rendering the vinyl player scene
- **Motion** — UI animations

### Additional Tools

- **TanStack Query (React Query)** — server state management and caching for track data

## ✨ Features

### 🎵 3D Vinyl Player

- Fully interactive 3D vinyl record player built with Babylon.js
- Loaded from `.glb` models (vinyl body, disc, tonearm, center label)
- Camera orbit restricted to vertical rotation only for a clean viewing angle

### 🎬 Animations

- **Tonearm** — lifts, rotates to/from the disc, and lowers with cubic easing
- **Disc swap** — the disc slides out, changes its cover art texture, and slides back in
- **Spin acceleration** — the disc gradually picks up speed with a quadratic ease-in curve
- **Spin deceleration** — the disc smoothly slows down before stopping when changing tracks

### 🔊 Audio Playback

- Full playback controls: play, pause, next, previous
- Track progress bar with hover time preview tooltip
- Volume slider with mute/low/high volume icons
- Audio output device selection (via `setSinkId`)
- Auto-advances to the next track when the current one ends
- Pauses gracefully on the last track

## 🛠 Setup and Scripts

### Prerequisites

- Node.js (recommended **v18+**)
- **pnpm** (or npm/yarn)

### Install dependencies

```bash
pnpm install
```

### Start development server

```bash
pnpm dev
```

### Build for production

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

## 📁 Project Structure

```text
src/
├── api/                          # API client and React Query hooks
│   ├── constants.ts              # API base URL
│   └── queries.ts                # useGetTracks query hook
├── components/
│   ├── Accordion/                # Collapsible genre sections
│   ├── Bar/                      # Playlist sidebar
│   ├── ChangeAudioDevice/        # Audio output device selector
│   ├── Loader/                   # Loading spinner
│   ├── Player/                   # Audio player controls & progress bar
│   ├── Tooltip/                  # Hover tooltip component
│   └── Vinyl/                    # 3D Babylon.js vinyl player scene
├── root/                         # App root component
├── types/                        # TypeScript type definitions
├── utils/                        # Helper utilities
│   ├── calcAudioDuration.ts      # Audio duration calculation
│   ├── constants.ts              # Shared constants
│   └── guards.ts                 # Type guards
├── index.css                     # Global styles
└── index.tsx                     # Entry point
```

---

This project is a **learning pet project** focused on **Babylon.js 3D rendering and animation** combined with **Web Audio API** playback in a modern React + TypeScript frontend.
