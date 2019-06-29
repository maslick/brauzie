#!/usr/bin/env bash

brauzie login --quite

NAME=$(cat ~/.brauzie/id-token.json | jq -r '.preferred_username')
EMAIL=$(cat ~/.brauzie/id-token.json | jq -r '.email')
ID_TOKEN=$(cat ~/.brauzie/jwt.json | jq -r '.id_token')

kubectl config set-context minikube-oidc-$NAME --cluster minikube --user=$EMAIL --namespace=default >/dev/null 2>&1
kubectl config use-context minikube-oidc-$NAME

kubectl config set-credentials $EMAIL \
    --auth-provider=oidc \
    --auth-provider-arg=idp-issuer-url="https://auth.maslick.ru/auth/realms/brauzie" \
    --auth-provider-arg=client-id=web \
    --auth-provider-arg=id-token=$ID_TOKEN
