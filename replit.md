# Running on Replit

This is the imported static Arabic hospital website. Keep its existing plain
HTML/CSS/JavaScript structure; no package installation or database is required.

## Run

Use the **Start application** workflow (the Run button). It runs:

```sh
node build.js && python3 -m http.server 5000 --bind 0.0.0.0
```

Node.js rebuilds the static site, then Python's built-in development server
serves it on port 5000. Open `/` for the website and `/admin/` for the content
editor. No secrets or external services are needed to preview the site.

## Editing

- Edit `content.json` or files in `src/`, then restart the workflow to rebuild.
- Do not edit generated HTML, `assets/`, `admin/`, or `news/` directly:
  `node build.js` replaces them.
- The admin editor saves edits only in the current browser. To retain its edits
  in the repository, use its ZIP export and the process in `README.md`.

## Preview limitations

- The website remains in its imported review mode, with search indexing blocked.
- The admin editor has no built-in authentication.
- Python's server is for development only and exposes repository files through
  the preview URL. Do not use it as a production server or share the preview
  with untrusted visitors.
- Apache `.htaccess` settings do not apply to this development server.
- The contact form opens the visitor's email application; it does not send
  messages through a backend.
- Before publishing, follow the launch checklist in `README.md`, protect the
  editor, and serve only generated public files.
