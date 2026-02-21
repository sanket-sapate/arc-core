FROM quay.io/keycloak/keycloak:latest

# Install the keycloak-webhook providers.
# Since v0.8.3 the project is split into modules; the HTTP provider depends on
# core, so both JARs must be present in /opt/keycloak/providers/.
# https://github.com/vymalo/keycloak-webhook/releases/tag/v0.10.0-rc.1
ADD --chown=keycloak:keycloak \
  https://github.com/vymalo/keycloak-webhook/releases/download/v0.10.0-rc.1/keycloak-webhook-provider-core-0.10.0-rc.1-all.jar \
  /opt/keycloak/providers/keycloak-webhook-provider-core.jar

ADD --chown=keycloak:keycloak \
  https://github.com/vymalo/keycloak-webhook/releases/download/v0.10.0-rc.1/keycloak-webhook-provider-http-0.10.0-rc.1-all.jar \
  /opt/keycloak/providers/keycloak-event-listener-http.jar

# Pre-build the optimized server image
RUN /opt/keycloak/bin/kc.sh build
