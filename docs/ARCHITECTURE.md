# Architecture

This document explains **how the app works**, including how it's deployed in two independent places. For a deep, section-by-section technical reference (data layer, every API route, every page, admin system, gotchas), see [../DOCUMENTATION.md](../DOCUMENTATION.md) — this file is a shorter map that points into it. If you're looking for **how to deploy the Kubernetes copy to the NST SDC cluster**, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## What this app is

A leaderboard that tracks NST students' open-source GitHub contributions: pulls PR/issue data from the GitHub Search API, ranks students by clean merged PRs, and shows it on a public dashboard. See `DOCUMENTATION.md` Section 1 for the full goals/non-goals.

## Two deployments, one codebase

This repository is the original, and it's what's live in production on Vercel — nothing here changes for the Kubernetes deployment. A separate copy repository (`OpenSource_NST_Tracker-k8s`) exists specifically for deploying to the NST SDC Kubernetes cluster. No application code differs between the two; the only things that exist in the K8s copy but not here are deployment-shaped files that Vercel simply doesn't need:

- `Dockerfile`, `.dockerignore` (tuned for a container build)
- `k8s/` manifests (Namespace, Deployment, Service, Ingress, Secret template)
- `.github/workflows/build-and-push.yml` (builds and pushes the Docker image to GHCR)
- `next.config.ts`'s `output: 'standalone'` line
- `app/api/health/route.ts` (a liveness/readiness probe target — Vercel's serverless model has no equivalent need)

Everything else — `app/`, `lib/`, the data model, the caching design — is the exact same system described in `DOCUMENTATION.md`, and applies equally to both deployments.

## Request flow (the same on both deployments)

```
Browser
   │
   ▼
Next.js App Router (Server Components by default)
   │
   ▼
lib/kv.ts  →  KV_REST_API_URL/TOKEN set?
                 YES → Upstash Redis (REST API)
                 NO  → data/kv/*.json on disk
   │
   ▼ (only on cache miss / stale / manual refresh)
GitHub Search + REST APIs (lib/github.ts)
```

Full detail on caching layers, TTLs, and the auto-scaling incremental refresh job: `DOCUMENTATION.md` Section 5.

## Deployment topology: Vercel (this repo, production)

```
GitHub push → Vercel build → Vercel serverless functions
                                     │
                                     ▼
                          Upstash Redis (Vercel KV integration)

GitHub Actions (refresh-cache.yml, every 15 min)
   → POST https://opensource-nst-tracker.vercel.app/api/refresh/incremental
```

Zero-config: connect the repo to Vercel, set env vars, done. See `DOCUMENTATION.md` Section 12.

## Deployment topology: the K8s copy repo (NST SDC cluster)

```
GitHub push to main (in OpenSource_NST_Tracker-k8s)
   │
   ▼
.github/workflows/build-and-push.yml
   → docker build (multi-stage, next.config.ts output:'standalone')
   → push image to ghcr.io/<owner>/opensource_nst_tracker-k8s:latest
                                     │
                                     ▼ (manual, see DEPLOYMENT.md)
                kubectl apply -f k8s/  (via Rancher's browser-based kubectl shell)
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                  ▼
        Deployment (opensource-tracker)      Secret (opensource-tracker-secrets)
        1 pod, health-probed on /api/health   GITHUB_TOKEN, ADMIN_PASSWORD,
                    │                          GITHUB_CLIENT_ID/SECRET, CRON_SECRET,
                    ▼                          KV_REST_API_URL/TOKEN(_READ_ONLY)
        Service (ClusterIP, port 80→3000)
                    │
                    ▼
        Ingress (traefik, host oss-tracker.nstsdc.org)
                    │
                    ▼
        Cloudflare Tunnel + wildcard *.nstsdc.org DNS
        (already configured cluster-wide — zero cert/DNS work per app)
                    │
                    ▼
              https://oss-tracker.nstsdc.org

GitHub Actions (refresh.yml / a future refresh-cache.yml copy, in the K8s repo)
   → POST https://oss-tracker.nstsdc.org/api/refresh/incremental
```

This uses its **own, separate** Upstash Redis database — never the production one described above — so students can deploy, experiment, and even break things on the cluster without any risk to the real leaderboard.

Key differences, explained:

| Aspect | Vercel (this repo) | K8s copy repo |
|---|---|---|
| Build | Vercel's own pipeline | Docker multi-stage build (`Dockerfile`) → GHCR |
| Runtime | Serverless functions | A single long-running Node process (`node server.js`, the Next.js standalone output) in one pod |
| Public HTTPS | Automatic (`*.vercel.app`) | Ingress + Cloudflare Tunnel (`*.nstsdc.org`), automatic once the Ingress exists |
| Deploy trigger | Git push (automatic) | Git push builds the image (automatic); rolling it out to the cluster is a manual `kubectl apply`/`kubectl rollout restart` for now — see DEPLOYMENT.md's closing section on the Fleet/GitOps upgrade path |
| Data store | Vercel's Upstash KV integration (production data) | Its own, separate Upstash Redis instance — never the production database |
| Health check | N/A (serverless) | `GET /api/health` → `{"ok":true}`, used by the Deployment's liveness/readiness probes |

### Why a Secret, not NST Init

The cluster's self-service "NST Init" deploy tool is the easiest path for most student apps, but its automation doesn't have permission to create Kubernetes Secrets — and this app can't run without several (`GITHUB_TOKEN`, `KV_REST_API_URL/TOKEN`, etc.). That's why the K8s copy ships real `k8s/*.yaml` manifests applied via `kubectl` instead. See DEPLOYMENT.md for the exact steps.

### Why GHCR, not the cluster's local registry

The cluster has its own unauthenticated registry (`nst-n1:30500`), but it's only reachable from machines already on/SSH'd into the cluster — not from GitHub-hosted Actions runners. GHCR (`ghcr.io`) works out of the box from GitHub Actions with zero new secrets (the built-in `GITHUB_TOKEN` is enough to push), which is why the CI workflow targets it instead.
