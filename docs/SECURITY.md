# Security notes

- Firebase web configuration is delivered to the browser. The four `VITE_FIREBASE_*` values identify the client app; they do not replace authentication, Firestore rules, or Firebase project restrictions.
- Never put Firebase Admin credentials, service-account JSON, private API keys, or deployment tokens in Vite variables or committed files.
- `.env*` files are ignored except `.env.example`. Verify local environment files stay untracked before committing.
- `firestore.rules` scopes profile, favourite, weekly plan, and shopping-list access to `request.auth.uid == uid` and validates the stored document shapes. Review and publish rules in the intended Firebase project before enabling user writes.
- CI requests only `contents: read`, runs on GitHub-hosted runners, and does not receive Firebase secrets. Do not add secrets to pull-request validation from forks.
- Automated unit/component/service tests mock Firebase and TheMealDB. No Firebase Emulator Suite is currently configured, so rules have not been verified through emulator tests.
- TheMealDB's free key is for development and educational access; arrange appropriate access/licensing before public production use.

## Repository settings to configure manually

Recommended GitHub settings: require pull requests for the default branch, require the `Lint, typecheck, test, build` status check, restrict direct pushes to the default branch, and enable automatic deletion of merged branches. These settings are recommendations only; this repository change does not alter GitHub branch protection.
