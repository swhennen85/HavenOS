# HavenOS homepage redesign package

Replace these two files in your existing HavenOS repository:
- `src/App.tsx`
- `src/styles.css`

No dependency changes are required.

## Included
- Redesigned responsive homepage and stronger visual identity.
- Twelve service discovery categories instead of eight.
- Category-to-search interaction, URL query persistence, and clear search-state feedback.
- Sections explaining the intended user journey, verification, source information, and reviewed community contributions.
- 211 links, accessibility focus states, and reduced-motion support.

## Important implementation boundary
The search interface is still a front-end shell. It does not query Supabase, show live resource results, or claim that any provider has been verified. The database, map, and reviewed contribution workflow remain future integration work.

## Apply and verify
From the HavenOS project folder, run:

```powershell
& ".\\tools\\node-runtime\\npm.cmd" run typecheck
& ".\\tools\\node-runtime\\npm.cmd" run build
```

If both succeed:

```powershell
git add src/App.tsx src/styles.css
git commit -m "Redesign HavenOS resource discovery homepage"
git push origin main
```
