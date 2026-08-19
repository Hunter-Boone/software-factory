# widget-api — mini software factory demo

A deliberately small, zero-dependency JSON API used to demo a three-stage
"software factory" built out of GitHub Actions and the Claude Code Action.

## The factory

| Stage | Trigger | Workflow |
| --- | --- | --- |
| Spec | issue opened | `.github/workflows/factory-spec.yml` |
| Implement | issue labelled `approved` | `.github/workflows/factory-implement.yml` |
| Review | pull request opened | `.github/workflows/factory-review.yml` |

Issue → spec comment → (human labels `approved`) → PR → review comment → human merges.

## The app

```bash
npm start          # http://localhost:3000
npm test
```

Routes: `GET /health`, `GET /widgets`, `GET /widgets/count`, `GET /metrics`.
