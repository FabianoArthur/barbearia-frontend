# Contributing

Thanks for taking the time to help.

1. Use Node.js 22+ and install with `npm ci`.
2. Create a branch from `main` (`feat/...`, `fix/...`).
3. Keep changes focused and add or update tests for logic you touch.
4. Before opening a pull request, run:

   ```bash
   npm run lint && npm run format:check && npm run typecheck && npm run test:run && npm run build
   ```

5. Write commit messages in the [Conventional Commits](https://www.conventionalcommits.org/)
   style (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).

No backend is needed for UI work: `VITE_DEMO=true npm run dev` runs the app on
an in-memory API with invented data (`src/demo`).

UI copy is in Brazilian Portuguese; code, comments and docs are in English.
