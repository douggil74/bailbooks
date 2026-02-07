# Deployment & Project Map

## Vercel Projects

| Vercel Project | GitHub Repo | Git Remote | Domain(s) | Purpose |
|---|---|---|---|---|
| **bailbonds-financed** | `douggil74/bailbonds-financed` | `financed` | `bailbondsfinanced.com`, `bailmadesimple.com`, `bailbondsmadesimple.com` | Marketing website (public-facing) |
| **bailmadesimple** | `douggil74/bailmadesimple` | `origin` | `bailmadesimple.vercel.app` | Case Management (`/admin`) |
| **bailbooks** | `douggil74/bailbooks` | `bailbooks` | `bailbooks.vercel.app` | BailBooks accounting (`/books`) |

All three Vercel projects deploy the **same codebase**. The middleware in `middleware.ts` routes by hostname:
- `bailbooks.vercel.app` → redirects `/` to `/books`
- `bailmadesimple.vercel.app` → redirects `/` to `/admin`
- Everything else (bailbondsfinanced.com) → shows marketing site at `/`

## How to Deploy

All three share one local repo at `/Users/doug/bailmadesimple/`.

```bash
# Push to all three repos (triggers auto-deploy on each Vercel project)
git push origin main        # → bailmadesimple.vercel.app
git push financed main      # → bailbondsfinanced.com
git push bailbooks main     # → bailbooks.vercel.app

# Or push to all at once:
git remote | xargs -I {} git push {} main

# Manual deploy (only deploys to bailmadesimple project):
npx vercel --prod
```

## Vercel Project IDs

| Project | ID |
|---|---|
| bailbonds-financed | `prj_QoSqR97eTlhKAgpLbg2nEjmUkkCG` |
| bailmadesimple | `prj_UOCAACytOZxwurBEif2sc8YF8VU6` |
| bailbooks | `prj_A7DQ9gzXjeYvKycHIU66aWgPtLKl` |

## Other Vercel Projects (non-bail)

| Project | Domain | Repo |
|---|---|---|
| recovery-app | eliterecoverysystem.com | `douggil74/elite-recovery-app` |
| elite-recovery-la | eliterecoveryla.com | (same or separate) |
| osint-backend | osint-backend-...vercel.app | `douggil74/elite-recovery-osint` |
| busy-preacher-mvp | thebusychristianapp.com | `douggil74/busy-preacher-mvp` |
| payroll-calandar-bs | payroll-calandar-bs-...vercel.app | `douggil74/payroll_calandarBS` |

## Domain Inventory

| Domain | Points To |
|---|---|
| `bailbondsfinanced.com` | bailbonds-financed project |
| `bailmadesimple.com` | bailbonds-financed project |
| `bailbondsmadesimple.com` | bailbonds-financed project (alias) |
| `bailmadesimple.vercel.app` | bailmadesimple project (auto) |
| `bailbooks.vercel.app` | bailbooks project (auto) |
| `eliterecoverysystem.com` | recovery-app project |
| `eliterecoveryla.com` | elite-recovery-la project |
| `thebusychristianapp.com` | busy-preacher-mvp project |

## Important Rules

1. **Never change branding in legal documents** (`app/api/onboard/generate-pdf/route.ts`) — the DBA "Elite Bail Bonds dba BailBonds Financed" is a legal name used in court
2. **Always push to all 3 remotes** when making changes that affect routing, branding, or shared code
3. **`npx vercel --prod`** from this directory only deploys to `bailmadesimple` — it does NOT update `bailbondsfinanced.com` or `bailbooks.vercel.app`
4. The middleware hostname detection determines what each domain shows — do not change without understanding the routing
