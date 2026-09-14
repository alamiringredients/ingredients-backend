# Local recruitment email

The Holo mail package uses SMTP. Local defaults in `.env.example` point to Mailpit on `127.0.0.1:1025`, with TLS disabled and no SMTP credentials.

Install and start Mailpit on macOS:

```sh
brew install mailpit
brew services start mailpit
```

Open http://127.0.0.1:8025 to inspect messages sent from the Applications dashboard. Mailpit captures messages locally. Configure a real SMTP service through the `MAIL_*` environment variables for production, then clear cached configuration with `npx holo config:clear`.

Applications and reply history are stored in `career_applications` and `career_replies`. CVs use the private `applications` storage disk and are downloaded through the authorized admin route. Deleting an application removes its CV and reply history.

`npx holo migrate` creates the tables. The main database seeder runs `careers_about` for the localized About and Careers page defaults and five original job records, and `roles` grants the Super admin permissions. Content seeders preserve subsequent CMS edits.
