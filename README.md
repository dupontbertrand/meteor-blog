# Meteor Blog

A mini blog example app running on Meteor 3.6.1 with built-in roles & permissions, MJML email templates, and dev-mode mail preview.

**Live demo:** https://example-simple-blog.sandbox.galaxycloud.app

## Quick Start

```bash
git clone https://github.com/dupontbertrand/meteor-blog.git
cd meteor-blog
meteor npm ci
meteor
```

Open http://localhost:3000

## Test Accounts

| Email                | Password   | Role        |
|----------------------|------------|-------------|
| admin@test.com       | password   | Admin       |
| moderator@test.com   | password   | Moderator   |
| editor@test.com      | password   | Editor      |
| viewer@test.com      | password   | Viewer      |

## Roles & Permissions

Roles form a hierarchy: **admin > moderator > editor > viewer**. Each role inherits permissions from the roles below it.

| Permission         | Viewer | Editor | Moderator | Admin |
|--------------------|--------|--------|-----------|-------|
| Read posts         | ✓      | ✓      | ✓         | ✓     |
| Write comments     | ✓      | ✓      | ✓         | ✓     |
| Create posts       |        | ✓      | ✓         | ✓     |
| Edit own posts     |        | ✓      | ✓         | ✓     |
| Hide/unhide posts  |        |        | ✓         | ✓     |
| Delete comments    |        |        | ✓         | ✓     |
| Edit all posts     |        |        |           | ✓     |
| Delete posts       |        |        |           | ✓     |
| Manage users       |        |        |           | ✓     |

## Features

- **Auth** — `accounts-password` with login/register
- **Roles** — Meteor's built-in `roles` package (since 3.1) with hierarchical permissions
- **Email** — MJML templates for post published & new comment notifications
- **Mail Preview** — [`dupontbertrand:mail-preview`](https://atmospherejs.com/dupontbertrand/mail-preview) captures emails at `/__meteor_mail__/` in dev mode
- **Routing** — `ostrio:flow-router-extra` with auth guards
- **UI** — Bootstrap 5, Blaze templates
- **Bundler** — Rspack

## Stack

- Meteor 3.6.1 / Blaze
- Bootstrap 5
- MJML (email templates)
- Rspack 2 with `@meteorjs/rspack` 3
- TypeScript collections and server API using Meteor's native package declarations

## Types and Tests

After installing dependencies:

```bash
meteor npm run typecheck
meteor npm test
meteor npx playwright install chromium
meteor npm run test:e2e
```

`typecheck` runs `meteor types` before TypeScript. Generated declarations in
`.meteor/types` stay out of Git. Run `meteor npm run types` after changing Meteor
packages to refresh editor types. The Blaze templates and UI remain JavaScript;
the collections, methods, publications, and email renderer use strict TypeScript.

The server tests cover MongoDB writes and MJML rendering from private assets.
The browser tests cover registration, login/logout, posts, comments, role
permissions, hide/unhide, user management, and notification emails in mail preview.
They start a development app on port 3100 and use the seeded test accounts.
Run them against a local development database. Set `E2E_PORT` to use another port.

## Mail Preview

All emails sent in dev mode are captured and viewable at:

http://localhost:3000/__meteor_mail__/

Try creating a post or writing a comment to see the MJML emails rendered in the preview.

For production, set `MAIL_URL` to your SMTP connection URL. Mail preview is only
available in development.

## Project Structure

```
imports/
├── api/
│   ├── posts/       # Collection, methods, publications
│   ├── comments/    # Collection, methods, publications
│   └── users/       # Methods, publications
├── startup/
│   ├── server/      # Fixtures, email config, API registration
│   └── client/      # Routes
├── ui/
│   ├── layouts/body/  # Navbar + {{> yield}}
│   └── pages/         # login, posts-list, post-detail, post-edit, users
└── email/
    └── render.ts      # MJML template loader
private/
└── email-templates/   # .mjml files
```

## License

MIT
