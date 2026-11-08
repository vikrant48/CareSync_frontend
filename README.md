# CareSync – Frontend

Angular 19 single-page app for CareSync: patient, doctor and admin portals in one codebase.

- **Live app:** https://caresync-vikrant.vercel.app/
- **Architecture, security and design:** https://caresync-vikrant.vercel.app/docs (source: `public/docs/caresync.md`)

## Run locally

```bash
npm install
npm start
```

The app expects the backend API to be running (see the backend repository). API URLs are set in `environments/`.

## Build

```bash
npx ng build
```

## Editing the public docs

The `/docs` page renders `public/docs/caresync.md` (Markdown with ` ```mermaid ` diagram blocks). Edit that file and redeploy; no code changes needed.
