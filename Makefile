# ThaiPBSNEW - PM2 Makefile
# ThaiPBSNEW Next.js app (:3008)

.PHONY: install dev build deploy start-current rescue-uploads list-releases rollback build-deploy pull pull-build-deploy stop restart restart-prod status logs logs-dev clean delete save

APP_NAME=ThaiPBSNEW
APP_TEST_NAME=ThaiPBSNEW-test
APP_DIR=.
PORT=3008
INSTANCES=2
NODE_OPTIONS=--max-old-space-size=4096
RELEASES_DIR=.releases
CURRENT_LINK=.current
KEEP_RELEASES=3
SHELL := /bin/sh

RSYNC_EXCLUDES=\
	--exclude .git \
	--exclude .next \
	--exclude node_modules \
	--exclude payload-uploads \
	--exclude $(RELEASES_DIR) \
	--exclude $(CURRENT_LINK) \
	--exclude $(CURRENT_LINK).tmp

# --- Install dependencies ---
install:
	npm install

# --- Development (run dev with PM2) ---
dev:
	pm2 start npm --name "$(APP_TEST_NAME)" --cwd $(APP_DIR) -- run dev -- -p $(PORT)

# --- Pull latest code ---
pull:
	git pull

# --- Build app ---
build:
	NODE_OPTIONS="$(NODE_OPTIONS)" npm run build

# --- Deploy production: pull, build a release, then replace/reload the PM2 process ---
deploy: pull
	@set -eu; \
	ROOT_DIR="$$(pwd)"; \
	RELEASE_ID=$$(date +%Y%m%d%H%M%S); \
	RELEASE_DIR="$(RELEASES_DIR)/$$RELEASE_ID"; \
	mkdir -p "$(RELEASES_DIR)"; \
	mkdir -p payload-uploads/media payload-uploads/videos; \
	rsync -a --delete $(RSYNC_EXCLUDES) ./ "$$RELEASE_DIR"/; \
	git rev-parse HEAD > "$$RELEASE_DIR/REVISION"; \
	cd "$$RELEASE_DIR"; \
	npm ci; \
	NODE_OPTIONS="$(NODE_OPTIONS)" npm run build; \
	cd - >/dev/null; \
	ln -sfn "$(RELEASES_DIR)/$$RELEASE_ID" "$(CURRENT_LINK).tmp"; \
	mv -Tf "$(CURRENT_LINK).tmp" "$(CURRENT_LINK)"; \
	echo "Deploying release $$RELEASE_ID ($$(cat "$(CURRENT_LINK)/REVISION"))"; \
	pm2 delete "$(APP_NAME)" 2>/dev/null || true; \
	THAIPBSNEW_CWD="$$ROOT_DIR/$(CURRENT_LINK)" pm2 start ecosystem.config.cjs --update-env; \
	pm2 save; \
	ls -1dt "$(RELEASES_DIR)"/* | tail -n +$$(($(KEEP_RELEASES) + 1)) | xargs -r rm -rf

# --- Start/reload the currently active release ---
start-current:
	mkdir -p payload-uploads/media payload-uploads/videos
	THAIPBSNEW_CWD="$$(pwd)/$(CURRENT_LINK)" pm2 startOrReload ecosystem.config.cjs --update-env

# --- Copy uploads stranded inside old release folders back into persistent storage ---
rescue-uploads:
	@set -eu; \
	mkdir -p payload-uploads/media payload-uploads/videos; \
	if [ -d "$(RELEASES_DIR)" ]; then \
		find "$(RELEASES_DIR)" -path "*/payload-uploads/media" -type d -exec sh -c 'cp -an "$$1"/. payload-uploads/media/ 2>/dev/null || true' sh {} \; ; \
		find "$(RELEASES_DIR)" -path "*/payload-uploads/videos" -type d -exec sh -c 'cp -an "$$1"/. payload-uploads/videos/ 2>/dev/null || true' sh {} \; ; \
	fi; \
	echo "Recovered uploads into payload-uploads/media and payload-uploads/videos"

# --- Show available releases, newest first ---
list-releases:
	@set -eu; \
	if [ -d "$(RELEASES_DIR)" ]; then \
		ls -1dt "$(RELEASES_DIR)"/* 2>/dev/null | xargs -r -n 1 basename; \
	else \
		echo "No releases found in $(RELEASES_DIR)"; \
	fi

# --- Restore a previous release: make rollback RELEASE=20260623141038 ---
rollback:
	@set -eu; \
	if [ -z "$(RELEASE)" ]; then \
		echo "Usage: make rollback RELEASE=<release-id>"; \
		exit 1; \
	fi; \
	case "$(RELEASE)" in *[!0-9]* ) \
		echo "Invalid RELEASE value. Use a timestamp from: make list-releases"; \
		exit 1; \
	esac; \
	RELEASE_DIR="$(RELEASES_DIR)/$(RELEASE)"; \
	if [ ! -d "$$RELEASE_DIR" ]; then \
		echo "Release not found: $$RELEASE_DIR"; \
		exit 1; \
	fi; \
	ln -sfn "$$RELEASE_DIR" "$(CURRENT_LINK).tmp"; \
	mv -Tf "$(CURRENT_LINK).tmp" "$(CURRENT_LINK)"; \
	mkdir -p payload-uploads/media payload-uploads/videos; \
	pm2 delete "$(APP_NAME)" 2>/dev/null || true; \
	THAIPBSNEW_CWD="$$(pwd)/$(CURRENT_LINK)" pm2 start ecosystem.config.cjs --update-env; \
	pm2 save

# --- Build then deploy through a release directory ---
build-deploy: deploy

# --- Pull, build, then deploy through a release directory ---
pull-build-deploy: deploy

# --- Process control ---
stop:
	pm2 stop "$(APP_TEST_NAME)" 2>/dev/null || true
	pm2 stop "$(APP_NAME)" 2>/dev/null || true

restart:
	pm2 restart "$(APP_TEST_NAME)" 2>/dev/null || true
	pm2 restart "$(APP_NAME)" 2>/dev/null || true

restart-prod:
	pm2 restart "$(APP_NAME)"

delete:
	pm2 delete "$(APP_TEST_NAME)" 2>/dev/null || true
	pm2 delete "$(APP_NAME)" 2>/dev/null || true

# --- Info ---
status:
	pm2 status

logs:
	pm2 logs "$(APP_NAME)"

logs-dev:
	pm2 logs "$(APP_TEST_NAME)"

# --- Save PM2 process list ---
save:
	pm2 save

# --- Clean build files ---
clean:
	rm -rf .next
	rm -rf node_modules/.cache
