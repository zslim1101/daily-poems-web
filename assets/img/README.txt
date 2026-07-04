HOW TO ADD BACKGROUND PHOTOS
============================

1. Copy your photo into this folder (assets/img/).
   Example:  us-beach.jpg

2. Open  data/backgrounds.json  and add the filename to the list.
   Example:
       [
         "us-beach.jpg",
         "first-date.jpg"
       ]

3. Save. The site shows a different photo each day, cycling
   through the list. Same photo stays for the whole day, then
   changes at midnight.

Tips:
- Use .jpg / .jpeg / .png / .webp
- Landscape photos (wider than tall) look best as backgrounds.
- Keep files reasonably small (< 1 MB each) so the page loads fast.
- If the list is empty, the site falls back to the rose gradient.
