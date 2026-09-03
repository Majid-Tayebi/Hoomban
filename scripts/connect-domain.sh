#!/usr/bin/env bash
# Connect hoomban.ir (and optional pb/www) to this server: nginx + Let's Encrypt + .env
# Usage:
#   bash scripts/connect-domain.sh
#   DOMAIN=hoomban.ir bash scripts/connect-domain.sh
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN="${DOMAIN:-hoomban.ir}"
WWW="www.${DOMAIN}"
PB="pb.${DOMAIN}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@${DOMAIN}}"
SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
CERT_DIR="./nginx/certs"
WEBROOT="./nginx/certbot"

mkdir -p "$WEBROOT" "$CERT_DIR"

resolve_a() {
	local name="$1"
	dig +short A "$name" 2>/dev/null | grep -E '^[0-9.]+$' | head -1 || true
}

echo "==> Server IP: ${SERVER_IP:-unknown}"
echo "==> Checking DNS for ${DOMAIN}..."

APEX_IP="$(resolve_a "$DOMAIN")"
WWW_IP="$(resolve_a "$WWW")"
PB_IP="$(resolve_a "$PB")"

echo "    ${DOMAIN}     -> ${APEX_IP:-NOT SET}"
echo "    ${WWW} -> ${WWW_IP:-NOT SET}"
echo "    ${PB}  -> ${PB_IP:-NOT SET}"

if [ -z "$APEX_IP" ] || [ "$APEX_IP" != "$SERVER_IP" ]; then
	cat <<EOF

DNS هنوز به این سرور اشاره نمی‌کند.
در پنل دامنه این رکوردها را بگذارید (A):

  ${DOMAIN}      → ${SERVER_IP}
  ${WWW}  → ${SERVER_IP}
  ${PB}   → ${SERVER_IP}

بعد از اعمال DNS (معمولاً چند دقیقه تا چند ساعت) دوباره اجرا کنید:
  bash scripts/connect-domain.sh

فعلاً Nginx برای دامنه آماده می‌شود؛ تا DNS درست شود فقط با IP کار می‌کند.
EOF
fi

echo "==> Applying Nginx domain config..."
docker compose up -d nginx

# Update .env public URLs (HTTP until certs exist)
SCHEME=http
if [ -f "$CERT_DIR/live/${DOMAIN}/fullchain.pem" ]; then
	SCHEME=https
fi

APP_URL="${SCHEME}://${DOMAIN}"
PB_URL="${SCHEME}://${PB}"

if [ -f .env ]; then
	sed -i "s|^PUBLIC_APP_URL=.*|PUBLIC_APP_URL=${APP_URL}|" .env
	sed -i "s|^PUBLIC_POCKETBASE_URL=.*|PUBLIC_POCKETBASE_URL=${PB_URL}|" .env
	sed -i "s|^ORIGIN=.*|ORIGIN=${APP_URL}|" .env
	if grep -q '^COOKIE_SECURE=' .env; then
		if [ "$SCHEME" = https ]; then
			sed -i 's|^COOKIE_SECURE=.*|COOKIE_SECURE=true|' .env
		else
			sed -i 's|^COOKIE_SECURE=.*|COOKIE_SECURE=false|' .env
		fi
	else
		echo "COOKIE_SECURE=$([ "$SCHEME" = https ] && echo true || echo false)" >> .env
	fi
	if ! grep -q '^SERVER_HOST=' .env; then
		echo "SERVER_HOST=${DOMAIN}" >> .env
	else
		sed -i "s|^SERVER_HOST=.*|SERVER_HOST=${DOMAIN}|" .env
	fi
fi

# Try Let's Encrypt only when apex DNS points here
if [ -n "$APEX_IP" ] && [ "$APEX_IP" = "$SERVER_IP" ]; then
	CERT_DOMAINS=(-d "$DOMAIN")
	[ "$WWW_IP" = "$SERVER_IP" ] && CERT_DOMAINS+=(-d "$WWW")
	[ "$PB_IP" = "$SERVER_IP" ] && CERT_DOMAINS+=(-d "$PB")

	echo "==> Requesting Let's Encrypt certificate..."
	docker run --rm \
		-v "$(pwd)/nginx/certbot:/var/www/certbot" \
		-v "$(pwd)/nginx/certs:/etc/letsencrypt" \
		certbot/certbot certonly --webroot -w /var/www/certbot \
		"${CERT_DOMAINS[@]}" \
		--email "$EMAIL" --agree-tos --non-interactive --keep-until-expiring \
		|| echo "!! Certbot failed (DNS/propagation). HTTP on port 80 still works."

	if [ -f "$CERT_DIR/live/${DOMAIN}/fullchain.pem" ]; then
		echo "==> Writing HTTPS nginx config..."
		cat > ./nginx/ssl-enabled.conf <<EOF
server {
	listen 443 ssl;
	http2 on;
	server_name ${DOMAIN} ${WWW};

	ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
	ssl_session_timeout 1d;
	ssl_session_cache shared:SSL:10m;
	ssl_protocols TLSv1.2 TLSv1.3;

	location / {
		proxy_pass http://sveltekit;
		include /etc/nginx/proxy-params.conf;
	}
}

server {
	listen 443 ssl;
	http2 on;
	server_name ${PB};

	ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
	ssl_session_timeout 1d;
	ssl_session_cache shared:SSL:10m;
	ssl_protocols TLSv1.2 TLSv1.3;

	location / {
		proxy_pass http://pocketbase;
		include /etc/nginx/proxy-params.conf;
		proxy_read_timeout 300s;
	}
}

# Redirect HTTP → HTTPS for domain hosts
server {
	listen 80;
	server_name ${DOMAIN} ${WWW} ${PB};

	location /.well-known/acme-challenge/ {
		root /var/www/certbot;
	}

	location / {
		return 301 https://\$host\$request_uri;
	}
}
EOF
		# Remove duplicate default HTTP domain handling conflict: ssl-enabled adds its own :80
		# Keep default_server on IP in main nginx.conf — but now we have two listen 80 for same names.
		# Prefer the redirect server; main file still has hoomban.ir on default_server which is OK for IP.

		sed -i "s|^PUBLIC_APP_URL=.*|PUBLIC_APP_URL=https://${DOMAIN}|" .env
		sed -i "s|^PUBLIC_POCKETBASE_URL=.*|PUBLIC_POCKETBASE_URL=https://${PB}|" .env
		sed -i "s|^ORIGIN=.*|ORIGIN=https://${DOMAIN}|" .env
		sed -i 's|^COOKIE_SECURE=.*|COOKIE_SECURE=true|' .env

		docker compose exec -T nginx nginx -t
		docker compose exec -T nginx nginx -s reload || docker compose up -d nginx

		echo "==> Rebuilding app once for HTTPS public URLs (cached)..."
		bash scripts/deploy.sh
	fi
else
	echo "==> Skipping SSL until DNS A record for ${DOMAIN} = ${SERVER_IP}"
	docker compose exec -T nginx nginx -t
	docker compose exec -T nginx nginx -s reload || docker compose up -d nginx
fi

cat <<EOF

==============================================
  Domain wiring
==============================================
  Site:        ${APP_URL}/
  PocketBase:  ${PB_URL}/_/
  IP fallback: http://${SERVER_IP}/

  DNS required:
    A  ${DOMAIN}      ${SERVER_IP}
    A  ${WWW}  ${SERVER_IP}
    A  ${PB}   ${SERVER_IP}

  Fast deploy after code changes:
    bash scripts/deploy.sh
==============================================
EOF
