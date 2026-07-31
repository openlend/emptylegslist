# emptylegslist

Static site for emptylegslist.com. Vercel deploys the repo root on every push to main.

- index.html  listings page, reads public.empty_legs from Supabase
- quote.html   charter quote form, posts to the charter-lead edge function
  - vercel.json  cleanUrls so /quote serves quote.html
