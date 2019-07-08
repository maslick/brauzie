#!/usr/bin/env bash

BRAUZIE_CLUSTER_NAME=${BRAUZIE_CLUSTER_NAME:=brauzie-cluster}
BRAUZIE_CLUSTER_ADDRESS=${BRAUZIE_CLUSTER_ADDRESS:=https://googles.com}

NAME=$(cat ~/.brauzie/id-token.json | jq -r '.preferred_username')
EMAIL=$(cat ~/.brauzie/id-token.json | jq -r '.email')
ID_TOKEN=$(cat ~/.brauzie/jwt.json | jq -r '.id_token')
REFRESH_TOKEN=$(cat ~/.brauzie/jwt.json | jq -r '.refresh_token')

# add cluster
kubectl config --kubeconfig brauzie set-cluster ${BRAUZIE_CLUSTER_NAME} --server ${BRAUZIE_CLUSTER_ADDRESS}

# add credentials
kubectl config --kubeconfig brauzie set-credentials ${EMAIL} \
    --auth-provider=oidc \
    --auth-provider-arg=idp-issuer-url="${BRAUZIE_KC_URL}/auth/realms/${BRAUZIE_REALM}" \
    --auth-provider-arg=client-id=${BRAUZIE_CLIENT_ID} \
    --auth-provider-arg=id-token=${ID_TOKEN} \
    --auth-provider-arg=refresh-token=${REFRESH_TOKEN} \
    --auth-provider-arg=client-secret=${BRAUZIE_CLIENT_SECRET}

# add context
kubectl config --kubeconfig brauzie set-context ${BRAUZIE_CLUSTER_NAME}-${NAME} \
    --cluster ${BRAUZIE_CLUSTER_NAME} \
    --namespace default \
    --user=${EMAIL} \
    >/dev/null 2>&1

# use context
kubectl config --kubeconfig brauzie use-context ${BRAUZIE_CLUSTER_NAME}-${NAME}

kubectl config --kubeconfig brauzie view > ~/.brauzie/k8s.json
