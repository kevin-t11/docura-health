# AWS deployment with Caddy

Domain: **https://docura.kevinnn.xyz**. These steps assume an Ubuntu VM with Docker Engine and Docker Compose installed. Run the commands on the VM.

Caddy runs as a system service on the VM. Docura runs through the existing Docker Compose file:

```text
Internet → Caddy :443 → /api/* → Express :8000
                     → everything else → Next.js :3000
```

## 1. Point the domain at the VM

Assign an EC2 Elastic IP (or a Lightsail static IP), then add this record at the DNS provider for `kevinnn.xyz`:

| Type | Name     | Value                                |
| ---- | -------- | ------------------------------------ |
| A    | `docura` | Your VM's static public IPv4 address |

Use DNS-only mode if your DNS provider offers a proxy. Only add an AAAA record if the VM also has working public IPv6.

In the AWS security group (or Lightsail networking firewall), allow inbound **TCP 80 and 443** from the internet. Allow SSH on **TCP 22** from your IP. If Ubuntu's firewall is enabled, allow the same ports there. Ports 3000 and 8000 already bind to localhost in Compose and do not need public firewall rules.

AWS documents [Elastic IPs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html) and [HTTP/HTTPS security group rules](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html).

## 2. Start Docura

Copy or clone this repository onto the VM. From its root, create `server/.env` from [server/.env.example](../server/.env.example) and fill in your service credentials. Keep the same `SESSION_SECRET` across deployments so workspace cookies stay valid.

```sh
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:8000/api/health
```

The health endpoint should return `{"status":"ok"}`. A successfully exited `migrate` container is expected.

## 3. Install Caddy

Use Caddy's official Ubuntu package. Skip this step if Caddy is already installed. [Installation reference](https://caddyserver.com/docs/install#debian-ubuntu-raspbian).

```sh
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

## 4. Enable the domain

For a new Caddy installation, run these commands from the repository root. If Caddy already serves other sites, add our [Caddyfile](../Caddyfile) site block to `/etc/caddy/Caddyfile` instead of replacing it.

```sh
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

Once DNS points to the VM and ports 80/443 are reachable, Caddy obtains and renews the certificate and redirects HTTP to HTTPS. No Certbot or manually installed certificate is needed. Caddy also forwards the original HTTPS scheme so Express sets secure workspace cookies. [Automatic HTTPS](https://caddyserver.com/docs/automatic-https) · [Proxy headers](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#defaults).

Verify from your computer:

```sh
curl -I http://docura.kevinnn.xyz
curl --fail https://docura.kevinnn.xyz/api/health
```

Expect an HTTPS redirect from the first command and `{"status":"ok"}` from the second. Open **https://docura.kevinnn.xyz** to use the app.

## Updates and logs

After copying updated code to the VM, run `docker compose up -d --build`. Only reload Caddy when its configuration changes. Keep Caddy's `/var/lib/caddy` directory; it contains the certificate state.

```sh
sudo journalctl -u caddy -n 80 --no-pager
docker compose logs --tail=80 api worker client
```

If HTTPS fails, check DNS and inbound ports first. A `502` response means Caddy cannot reach the app; check `docker compose ps` and the application logs. [Caddy service commands](https://caddyserver.com/docs/running#using-the-service).
