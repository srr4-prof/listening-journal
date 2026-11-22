# Listening Journal — Radical Sonics

*Encyclopedia of Sounds*, 2025-present. A searchable A–Z website of student listening journal entries, set like a book.

## What's in this repository

| File | What it does |
| --- | --- |
| `index.html` | The page itself. |
| `styles.css` | How it looks: colours, type, layout. |
| `script.js` | How it works: loading, sorting, search, the A–Z letters, reading pages, Contributors. |
| `settings.js` | **The only file you normally edit:** title, cover text, and where the entries come from. |
| `listening journal entries.csv` | All entries. The site reads this file. |
| `listening journal contributors.csv` | All contributors. The site reads this file. |
| `listening journal entries.xlsx` | The same two lists as an Excel workbook (tabs: Entries, Contributors), for editing. The site does not read this file. |

## Put it online with GitHub Pages

1. Upload all the files to the main (top) folder of your repository. Keep the file names exactly as they are.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick your main branch and the **/ (root)** folder, and save.
4. After a minute or two, GitHub shows the address of your site at the top of that page, usually `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

Opening `index.html` straight from your computer will say "The entries didn't load". Browsers block a page opened from your disk from reading other files. It works once it's on GitHub Pages.

## Adding or changing entries

The spreadsheet needs these column headings, exactly:

- **Entries:** `Title (no article)` · `Full Title` · `Journal Entry` · `Semester`
- **Contributors:** `Name` · `Volume` · `Semester`

Rows can be in any order; the site sorts entries by the first column. A new semester or volume appears on the site automatically.

**Option 1 — edit the files in the repository**

1. Open `listening journal entries.xlsx` in Excel (or Numbers, or Google Sheets) and make your changes.
2. Save each tab as CSV. In Excel: **File → Save As → CSV UTF-8 (Comma delimited)**. Use *CSV UTF-8*, not plain *CSV*, or curly quotes and accented letters will break.
   - Entries tab → `listening journal entries.csv`
   - Contributors tab → `listening journal contributors.csv`
3. Upload the new CSV files (and the updated .xlsx, to keep it current) to the repository, replacing the old ones. The site updates within a minute or two.

**Option 2 — run the site from a Google Sheet**

1. Open `listening journal entries.xlsx` in Google Sheets.
2. **File → Share → Publish to web.** Choose the **Entries** tab and **Comma-separated values (.csv)**, click Publish, and copy the link. Repeat for the **Contributors** tab.
3. In `settings.js`, paste the two links in place of the file names:
   ```js
   DATA_URL: "https://docs.google.com/spreadsheets/d/e/…/pub?gid=…&single=true&output=csv",
   CONTRIBUTORS_URL: "https://docs.google.com/spreadsheets/d/e/…/pub?gid=…&single=true&output=csv",
   ```
4. Commit `settings.js`. From then on, editing the Google Sheet updates the site within about five minutes. You no longer need the CSV files in the repository.

## Changing the words on the cover

Edit `settings.js`:

```js
BOOK_TITLE: "Listening Journal",
PUBLISHER: "Radical Sonics",
SUBTITLE: "Encyclopedia of Sounds",
COVER_DATES: "2025-present",
ORGANIZED_BY: "Organized by Sarah Rara"
```

## Accessibility

The site works with screen readers and the keyboard: titles are announced cleanly, opening an entry moves to its title, Previous/Next announce the next entry, Escape closes a page, and motion is switched off for visitors who have asked their device to reduce it.
