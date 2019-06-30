#!/usr/bin/env bash

NAME=$(cat ~/.brauzie/id-token.json | jq -r '.preferred_username')
EMAIL=$(cat ~/.brauzie/id-token.json | jq -r '.email')
ID_TOKEN=$(cat ~/.brauzie/jwt.json | jq -r '.id_token')
REFRESH_TOKEN=$(cat ~/.brauzie/jwt.json | jq -r '.refresh_token')

kubectl config set-context minikube-oidc-$NAME --cluster minikube --user=$EMAIL --namespace=default >/dev/null 2>&1
kubectl config use-context minikube-oidc-$NAME

kubectl config set-credentials $EMAIL \
    --auth-provider=oidc \
    --auth-provider-arg=idp-issuer-url="${BRAUZIE_KC_URL}/auth/realms/${BRAUZIE_REALM}" \
    --auth-provider-arg=client-id=$BRAUZIE_CLIENT_ID \
    --auth-provider-arg=id-token=$ID_TOKEN \
    --auth-provider-arg=refresh-token=$REFRESH_TOKEN \
    --auth-provider-arg=client-secret=$BRAUZIE_CLIENT_SECRET
