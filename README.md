# Dinner Doodle

**Live:** https://dinner-doodle-ten.vercel.app

Type a word ("hunter", "octopus", "someone sneezing") and get two simple black-pen doodles to copy on paper: **Easiest** and **Easy**. Made for doodle battles at the dinner table.

- `index.html`: the whole app (no build step)
- `api/doodle.js`: Vercel function that asks OpenAI's image API for a doodle

Each doodle is one low-quality `gpt-image-2` image (under 1¢), so a search of two costs about 1¢.

## Run locally

```sh
cp .env.example .env.local   # add your OpenAI key and a passcode
vercel dev
```

## Deploy

1. Pushing to `main` deploys automatically (the repo is connected to Vercel). `vercel --prod` also works.
2. Add the environment variables `OPENAI_API_KEY` and `DOODLE_PASSCODE`.
3. On your phone, open the site in Safari → Share → **Add to Home Screen**.

OpenAI may ask you to verify your organization before image models work, and it's worth setting a monthly spend limit on your OpenAI account.
