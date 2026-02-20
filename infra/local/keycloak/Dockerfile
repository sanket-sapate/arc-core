FROM quay.io/keycloak/keycloak:latest

# Install the keycloak-event-listener-http provider JAR.
# This SPI sends HTTP POST webhooks on Keycloak user events (REGISTER, LOGIN, etc.)
# Source: https://github.com/vymalo/keycloak-webhook
ADD --chown=keycloak:keycloak \
  https://github.com/vymalo/keycloak-webhook/releases/download/v0.5.0/keycloak-event-listener-http-0.5.0.jar \
  /opt/keycloak/providers/keycloak-event-listener-http.jar

# Pre-build the optimized server image
RUN /opt/keycloak/bin/kc.sh build
