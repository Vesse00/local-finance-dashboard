# Security Policy

## Supported Versions

The project is in active development. Security fixes are provided for the latest code on the default branch.

| Version | Supported |
| ------- | --------- |
| master | :white_check_mark: |
| older commits | :x: |

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

Use one of these private channels:

1. GitHub Security Advisory (preferred):
   - Go to the repository Security tab.
   - Click "Report a vulnerability".
2. Private contact email:
   - none.contactpl@gmail.com

## What to Include in a Report

Please include as much detail as possible:

- affected area (frontend, backend, auth, database, file upload, etc.),
- clear reproduction steps,
- expected behavior vs actual behavior,
- impact assessment,
- proof of concept (if available),
- environment details (OS, browser, app version, commit hash).

## Response Timeline

- Initial acknowledgment: within 72 hours.
- Status update: within 7 days.
- Target fix time: depends on severity and complexity.

## Disclosure Policy

- We follow coordinated disclosure.
- Please allow time for a fix before public disclosure.
- After a fix is released, we may publish a security note/changelog entry.

## Security Best Practices for Contributors

- Never commit secrets, tokens, or private keys.
- Keep dependencies updated and review advisories.
- Validate and sanitize user-controlled input.
- Minimize sensitive data in logs.
- Use least-privilege principles for any integrations.

Thank you for helping keep MeBase and its users safe.
