# PartsRoom Warehouse

A web app for ordering and issuing parts at a repair warehouse. It's built with React and Vite and uses a "Smart Home" soft-UI style.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # builds the site into docs/
```

## Deploy (GitHub Pages)

1. Upload the project to the repository. The `docs/` folder must be included.
2. Open **Settings → Pages**.
3. Set **Source** to *Deploy from a branch*.
4. Set **Branch** to `main`, then choose **/docs**.
5. Click **Save**.

After any change, run `npm run build` again and upload the new `docs/`.

## Project structure

```
src/
  main.jsx               entry point: fonts, icons, styles
  App.jsx                tabs, data (localStorage), Excel export/import
  config.js              warehouse password and storage keys
  data/demo.js           demo parts for the first launch
  lib/                   storage, utils, Excel helpers
  components/
    PartInput.jsx        Part Number autocomplete
    PrintModal.jsx       print preview
    PasswordModal.jsx    login on phones, "Clear History" confirmation
    ui.jsx               Field, Stepper, SearchBox, Stat, Toast
    morph/               the six morphing buttons
      SubmitMorph        Submit → spinner → ✓
      AddStepper         Add → − n +
      DecideMorph        Issue / Reject → status badge
      StaffMorph         Staff → password field in the header
      ExportMorph        Excel → progress → file ✓
      OrderPill          order pill → card
  views/                 Order, Warehouse, Inventory, By Table
  styles/
    tokens.css           every colour, shadow and size
    base.css · ui.css · morph.css · views.css
```

## Alignment rules

- **Numbers.** All digits use `tabular-nums`. Codes and quantities use IBM Plex Mono.
- **Content inside controls.** Buttons, badges and steppers use `inline-flex` with `align-items:center`, a fixed height and `line-height:1`. Icons are spaced with `gap`, not `margin`.
- **Icons.** `.fa-solid` icons share one box, `1.15em` wide with `line-height:1`.
- **Tables.** All cells use `vertical-align: middle`.

## Notes

- The password in `src/config.js` only hides staff screens in the UI. It is not real protection, because anyone can read it in the site's code.
- Data is stored in the browser's `localStorage`, so it is separate for each computer and browser.
- Excel export and import use SheetJS from a CDN, so they need an internet connection.
