# Git Workflow

## Branching Strategy

**Never push directly to `main`.** Always create a feature branch.

### Branch Naming Convention

Use prefixes to indicate branch type:

- `feat/` - New features (e.g., `feat/biometric-lock`)
- `fix/` - Bug fixes (e.g., `fix/cloudflared-timeout`)
- `docs/` - Documentation changes (e.g., `docs/update-setup`)
- `chore/` - Maintenance, dependencies, config (e.g., `chore/upgrade-expo`)
- `refactor/` - Code refactoring (e.g., `refactor/qr-payload`)
- `test/` - Adding or updating tests (e.g., `test/auth-flow`)

### Workflow

1. Create a branch: `git checkout -b feat/your-feature-name`
2. Make focused, atomic commits using [Conventional Commits](https://www.conventionalcommits.org/)
3. Push to your fork: `git push -u origin feat/your-feature-name`
4. Open a Pull Request against `main`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(mobile): add biometric lock screen`
- `fix(cli): handle missing cloudflared gracefully`
- `docs: update README with new setup steps`
