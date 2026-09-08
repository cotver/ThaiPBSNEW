# Nginx deployment for pavilions.thaipbs.or.th

This setup publishes the website through Nginx while allowing `/admin` only
from the company network.

## Required network layout

```text
Internet user
  -> pavilions.thaipbs.or.th (58.97.53.52)
  -> public TCP 80/443
  -> NAT to 172.16.202.65 TCP 80/443 (Nginx)
  -> 127.0.0.1:3008 (Next.js)
```

The public NAT/firewall rule for TCP `3008` must be removed. If public users can
reach `58.97.53.52:3008`, they can bypass Nginx and its `/admin` restriction.

A domain without a port uses TCP 80 for HTTP or TCP 443 for HTTPS. If the
network team exposes only public port 3008, the URL must contain `:3008`, and a
different internal port/layout will be required.

## 1. Commit and upload these files through GitHub

On the development PC:

```bash
git add ecosystem.config.cjs deploy/nginx
git commit -m "Add secure Nginx reverse proxy deployment"
git push
```

Do not commit `.env`; it can contain production secrets.

On the server, change `/srv/ThaiPBSNEW` below if the repository is elsewhere:

```bash
cd /srv/ThaiPBSNEW
git pull
```

## 2. Ask the network and DNS team for these changes

1. Public DNS A record: `pavilions.thaipbs.or.th` -> `58.97.53.52`.
2. Public TCP 80 -> `172.16.202.65:80`.
3. Public TCP 443 -> `172.16.202.65:443`.
4. Remove public TCP 3008 forwarding to `172.16.202.65:3008`.
5. For convenient LAN access, internal DNS should resolve
   `pavilions.thaipbs.or.th` to `172.16.202.65` (split DNS).

Do not continue with certificate creation until public DNS and TCP 80 reach the
server.

## 3. Confirm the actual company client subnet

The supplied config allows `172.16.0.0/12`, meaning every address from
`172.16.0.0` through `172.31.255.255`. This is convenient but broader than a
single office subnet.

Ask the network team for every subnet used by company users and VPN users. For
example, if the only valid subnet is `172.16.202.0/24`, replace:

```nginx
allow 172.16.0.0/12;
```

with:

```nginx
allow 172.16.202.0/24;
```

Add one `allow` line for each approved subnet, followed by `deny all`.

## 4. Install Nginx and Certbot

For Ubuntu or Debian:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

If the server uses RHEL, Rocky Linux, AlmaLinux, or another distribution, use
that distribution's Nginx and Certbot packages instead.

## 5. Install the site configuration

```bash
sudo cp /srv/ThaiPBSNEW/deploy/nginx/pavilions.thaipbs.or.th.conf /etc/nginx/sites-available/pavilions.thaipbs.or.th
sudo ln -s /etc/nginx/sites-available/pavilions.thaipbs.or.th /etc/nginx/sites-enabled/pavilions.thaipbs.or.th
sudo nginx -t
sudo systemctl reload nginx
```

If the symbolic-link command says the file already exists, do not recreate it;
continue with `sudo nginx -t`.

For a distribution without `sites-available` and `sites-enabled`, copy the file
to `/etc/nginx/conf.d/pavilions.thaipbs.or.th.conf` instead.

## 6. Rebuild and restart the application securely

The committed PM2 configuration now starts Next.js with
`-H 127.0.0.1`. Therefore, port 3008 accepts connections only from the server
itself, while Nginx can still proxy to it.

Use the project's normal release process. A typical PM2 deployment is:

```bash
cd /srv/ThaiPBSNEW
npm ci
npm run build
pm2 reload ecosystem.config.cjs --update-env
pm2 save
```

Confirm the application is reachable locally and port 3008 is loopback-only:

```bash
curl -I http://127.0.0.1:3008/
sudo ss -lntp | grep ':3008'
```

The listening address should be `127.0.0.1:3008`, not `0.0.0.0:3008`.

## 7. Test HTTP before requesting the certificate

From a company LAN computer:

```bash
curl -I http://pavilions.thaipbs.or.th/
curl -I http://pavilions.thaipbs.or.th/admin
```

Both should reach the application. A login redirect from `/admin` is normal.

From an external connection, such as a phone with Wi-Fi disabled:

```bash
curl -I http://pavilions.thaipbs.or.th/
curl -I http://pavilions.thaipbs.or.th/admin
```

The home page should respond normally, while `/admin` should return
`HTTP/1.1 403 Forbidden`.

Also verify that `http://58.97.53.52:3008/` does not connect.

## 8. Enable HTTPS

After public DNS and TCP 80 are working:

```bash
sudo certbot --nginx -d pavilions.thaipbs.or.th --redirect
sudo nginx -t
sudo systemctl reload nginx
```

Test automatic certificate renewal:

```bash
sudo certbot renew --dry-run
```

Repeat the LAN and external tests using `https://`.

## 9. Firewall verification

The server should accept inbound TCP 80 and 443. Port 3008 should not be exposed
by the router or server firewall. Binding the application to `127.0.0.1` adds a
second layer of protection even if a firewall rule is accidentally changed.

## Troubleshooting

- `502 Bad Gateway`: check `pm2 status`, then test
  `curl -I http://127.0.0.1:3008/` on the server.
- Everyone gets `403` on `/admin`: the company client subnet is missing from the
  Nginx `allow` list. Check the client address in
  `/var/log/nginx/pavilions.access.log`.
- External users can open `/admin`: make sure traffic is not reaching port 3008
  directly and check whether another proxy/load balancer is in front of Nginx.
  If so, configure trusted real-client-IP handling before relying on IP rules.
- Nginx reports `client intended to send too large body`: increase
  `client_max_body_size` to the approved upload limit.
