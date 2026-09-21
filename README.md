# Digital Culture Schools

A simple production-ready landing website for Digital Culture Schools, deployed on port 5008.

## Project structure

- `public/` – static site files (HTML, CSS, JS)
- `server.js` – Express server for production
- `deploy/` – service scripts for start, stop, and restart
- `.env.example` – environment variables example

## Install dependencies

```bash
npm install
```

## Run locally

```bash
npm start
```

Then open:

```bash
http://localhost:5008
```

## Production deployment controls

```bash
chmod +x deploy/start.sh deploy/restart.sh deploy/stop.sh
./deploy/start.sh
./deploy/restart.sh
./deploy/stop.sh
```

## Health check

```bash
curl http://localhost:5008/health
```

## Notes

- Port is configured to `5008` by default.
- This project is suitable for a live educational landing page.
- You can later connect the site to a custom domain like `Digital-Culture-Schools`.
