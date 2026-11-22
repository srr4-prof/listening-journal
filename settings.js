/* ------------------------------------------------------------------
   SETTINGS — the only part you need to edit.

   DATA_URL is where the page reads its entries from.
   • Google Sheets: File → Share → Publish to web → pick the sheet →
     "Comma-separated values (.csv)" → Publish, then paste the link here.
     Edits to that Google Sheet then show on the site within a few minutes.
   • Or leave it as "listening journal entries.csv" and upload a CSV file with that name
     next to this page. Replace the file to update the site.

   The sheet needs these four column headings in row 1:
     Title (no article) | Full Title | Journal Entry | Semester
   Rows can be in any order — the page sorts them itself.
   ------------------------------------------------------------------ */
window.JOURNAL_SETTINGS = {
  DATA_URL: "listening journal entries.csv",
  BOOK_TITLE: "Listening Journal",
  PUBLISHER: "Radical Sonics",
  SUBTITLE: "Encyclopedia of Sounds",
  COVER_DATES: "2025-present",
  // Contributors: a second sheet with the headings Name | Volume | Semester.
  // For Google Sheets, publish that tab as CSV too and paste its link here.
  CONTRIBUTORS_URL: "listening journal contributors.csv",
  ORGANIZED_BY: "Organized by Sarah Rara"
};
