# Security policy

## Reporting a problem

Please don't open a public issue for security problems. Report them privately through [GitHub's private vulnerability reporting](https://github.com/mochiicakes/git-pals/security/advisories/new) for this repository.

Include what you found, how to reproduce it, and what an attacker could do with it. You'll get a reply within a week.

## Supported versions

Only the latest release of the current major version (`v1`) receives fixes.

## How git-pals handles your token

- The token is read from the Action's inputs, masked in logs, and sent only to the GitHub GraphQL API.
- It is never written to disk or into the generated SVG.
- The SVG contains aggregate numbers only: no repository, commit, file or organisation names.
