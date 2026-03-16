# RoomCraft Furniture Visualizer

RoomCraft is a web-based room design system for furniture consultations. It supports accurate 2D planning, interactive 3D visualization, and reusable saved designs.

## Core Features
- Designer login and dashboard workflow.
- Create room specification (size, height, wall/floor colors).
- 2D layout editor (drag, rotate, resize, shading).
- Multi-room plan view.
- 3D viewport with orbit + inside controls.
- Color and shading controls (room + item + global).
- Save, edit, delete, and reopen designs.
- Undo/redo history support.
- Accessibility toggles (high contrast, larger text, reduced motion).

## Innovation Features Added
- Snap-to-grid alignment (0.1m) for move/resize.
- Split 2D + 3D view mode.
- Export 2D plan to PNG for consultation/report evidence.
- Selected item live measurement readout.

## Technology
- React 19
- Vite
- Three.js
- Browser local storage persistence

## Run Locally
1. `npm install`
2. `npm run dev`
3. `npm run lint`
4. `npm run build`

## Coursework Documentation
Full report and appendices are included under `docs/`:
- Main report draft: `docs/report/PUSL3122_Report.md`
- Design artifacts: `docs/design/`
- Evaluation artifacts: `docs/evaluation/`
- Scrum/process artifacts: `docs/scrum/`

Before submission:
- Replace placeholder GitHub/YouTube links in the report.
- Export report markdown to a single PDF.
- Insert final screenshots from running app and prototypes.
