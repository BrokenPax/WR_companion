The Weimar Republic Companion deployment notes.

The live GitHub Pages app is served from the `gh-pages` branch.

Normal workflow:
- Commit changes to `main`.
- Push `main` to GitHub.
- The `Publish GitHub Pages` workflow mirrors `main` to `gh-pages`.

Manual fallback if Actions is unavailable:

  git push origin main:gh-pages

The app is a static PWA. When changing `app.js`, update the script version in
`index.html` and the cached app asset in `sw.js` so existing browser installs
request the new app shell instead of an old service-worker copy.
