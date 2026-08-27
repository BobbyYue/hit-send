# Security Policy

## Supported version

Security fixes are applied to the latest version on the `main` branch.

## Reporting a vulnerability

Do not open a public issue for vulnerabilities involving credential exposure, unauthorized message access, cross-user data leakage, remote code execution, or unsafe external actions. Use GitHub's private vulnerability reporting feature for this repository.

Include the affected component, reproduction steps using synthetic data, expected impact, and any known mitigation. Do not include real credentials, conversation text, tenant identifiers, or private document URLs.

## Security boundaries

- The Skill must never send or post a message.
- The H5 interface must not store submitted message text or request conversation history by default.
- Feishu/Lark app secrets and model tokens belong only in server-side environment variables.
- A production H5 deployment must use HTTPS and an independently authenticated model endpoint.
