# Security Policy

## Supported Versions

The following versions of Notarion are currently supported with security updates:
updates:

| Version | Supported          |
| ------- | ------------------ |
| v0.1.x  | :white_check_mark: |
| < v0.1  | :x:                |

## Reporting a Vulnerability

We take the security of our project seriously. If you believe you have found a security vulnerability, please report it to us as soon as possible.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please follow these steps:

1.  **Private Disclosure**: Send an email to the maintainer at [salvatorecorvaglia@gmail.com](mailto:salvatorecorvaglia@gmail.com) (or use GitHub's "Report a vulnerability" feature if enabled).
2.  **Provide Details**: Include as much information as possible, including:
    - Description of the vulnerability.
    - Steps to reproduce the issue.
    - Potential impact.
    - Any suggested fixes or mitigations.
3.  **Wait for Response**: We will acknowledge your report within 48 hours and provide a timeline for a fix if necessary.

## Security Features

**Notarion** implements several security best practices out of the box:

- **Magic-Byte MIME Validation**: Backend verifies file headers to ensure file types match their extensions.
- **Rate Limiting**: Protection against brute-force and DoS attacks (100 requests/15 min generic, 10 requests/15 min IPFS).
- **Secure Headers**: Uses `helmet` middleware to set security-focused HTTP headers.
- **Input Sanitization**: Server-side validation via `express-validator` and `zod`.
- **Error Handling**: Prevents information leakage through generic error responses in production.
- **CORS Protection**: Configurable allowed origins to prevent unauthorized cross-origin requests.

## Security Best Practices for Deployment

- **Environment Variables**: Ensure `.env` is never committed to version control (already in `.gitignore`).
- **Database Access**: Keep MongoDB bound to `127.0.0.1` or use a VPC/Internal network in production.
- **Regular Updates**: Keep dependencies up to date using `npm update` or tools like Dependabot.
