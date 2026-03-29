# Finance App Container Setup

This repository is prepared to run multiple frontend applications in one Docker
container:

- `/` serves a simple portal with a demo login and application launcher
- `/crm/` serves the CRM React app
- `/dashboard/` serves the Dashboard React app

## What is included

- `Dockerfile`: multi-stage build for both React apps plus Nginx runtime
- `docker/nginx.conf`: path-based routing for the portal and both SPAs
- `portal/`: static launcher UI served at the site root
- `docker-compose.yml`: local startup helper

## Run locally with Docker

```bash
docker compose up --build -d
```

Open:

- `http://localhost:8080/`

Demo portal credentials:

- username: `admin`
- password: `admin123`

## Reverse proxy on the host

Point your external Nginx proxy to this container, for example to
`http://127.0.0.1:8080`.

Example host-level Nginx snippet:

```nginx
server {
    listen 80;
    server_name finance.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Important note about login

The portal login is intentionally a demo-only front-end gate so you can verify
the user flow quickly. It is not secure authentication.

Before exposing this publicly, replace it with real authentication such as:

- a backend issuing sessions or JWTs
- proxy-based auth
- Keycloak, Auth0, Azure AD, or another identity provider
