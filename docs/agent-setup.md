# Create a status page with an agent

Paste this into a coding agent with terminal access:

```text
https://pongo.sh
Create a status page for Acme.
```

The agent follows [llms.txt](https://pongo.sh/llms.txt) to the [create-pongo skill](https://pongo.sh/skills/create-pongo/SKILL.md). It asks which services to monitor and their URLs, then clones Pongo, writes the configuration, starts the app and scheduler, and verifies a recorded check for each service.

To supply the URLs up front:

```text
https://pongo.sh
Create a status page for Acme. Monitor https://acme.example and
https://api.acme.example/health every minute. Run it locally.
```

Replace the example URLs with your services. The local default uses SQLite, one-minute checks, a ten-second timeout, and no notifications. The public page is at `/shared/<slug>` on the local server. Local setup does not publish it to the internet.

If an agent does not discover the instructions from the homepage, paste the direct link:

```text
Read https://pongo.sh/llms.txt and follow the setup skill it links to.
Create a status page for Acme.
```

## Deploy the page

```text
https://pongo.sh
Create a status page for Acme monitoring https://acme.example.
Deploy it to my Docker server and protect the admin pages with a password.
```

The agent asks for missing hosting access or database configuration. A server or container needs a persistent database and a running scheduler. Vercel needs a remote database and uses cron; the bundled schedule checks every 30 minutes. Request a supported faster schedule or a separate scheduler if you need one-minute checks.

Provider credentials and tokens belong in local environment files or your host's secret store. The agent can complete a local setup while deployment access is unavailable. Pongo.sh itself is a demo; it does not host new instances for you.

## Install the skill

Installation is optional. The website links work without an installed skill for agents that can read URLs. To make the skill available across projects in agents that support `~/.agents/skills/`, save it there:

```bash
mkdir -p ~/.agents/skills/create-pongo
curl --fail --silent --show-error --location \
  https://pongo.sh/skills/create-pongo/SKILL.md \
  -o ~/.agents/skills/create-pongo/SKILL.md
```

For Claude Code, use `~/.claude/skills/create-pongo/SKILL.md` instead. For a project-local install, use your agent's project skills directory. The skill is self-contained and needs no extra scripts.

From a checkout, you can copy [public/skills/create-pongo/](../public/skills/create-pongo/) into the appropriate skills directory. For Codex, invoke it explicitly with:

```text
Use $create-pongo to create a status page for Acme monitoring
https://acme.example and https://api.acme.example/health.
```

## Check the result

The agent should return the page URL, actual check outcomes, changed configuration paths, and restart commands. Open the public page without logging in and confirm that it lists your services and has recorded check data. A down service is a monitoring result, not a reason to mark it healthy.

| Symptom | Check |
| --- | --- |
| Page loads but checks never arrive | Keep `bun scheduler` running alongside `bun dev`, using the same `DATABASE_URL`. |
| New service is missing | Register its config in `pongo/monitors/index.ts` and use that registry key in the dashboard's `monitors` list. Restart the scheduler. |
| `/shared/<slug>` returns 404 | Register the dashboard in `pongo/dashboards/index.ts`, set `public: true`, and use its `slug` in the URL. |
| SQLite build tries PostgreSQL migrations | Run `bun run db:sqlite:migrate` followed by `bunx next build`; the current `bun run build` database check does not recognize `file:` URLs. |

For manual configuration, see the [README](../README.md#quick-start) and [.env.example](../.env.example).
