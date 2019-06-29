# K8s authentication with brauzie

### 1. Enable OIDC authentication plugin (kube-apiserver):
```bash
minikube start --vm-driver=xhyve --cpus 4 --memory 8192 \
  --extra-config=kubelet.serialize-image-pulls=false \
  --extra-config=apiserver.oidc-issuer-url=https://auth.maslick.ru/auth/realms/brauzie \
  --extra-config=apiserver.oidc-client-id=web \
  --extra-config=apiserver.oidc-username-claim=email \
  --extra-config=apiserver.oidc-username-prefix="oidc:" \
  --extra-config=apiserver.oidc-groups-claim=groups \
  --extra-config=apiserver.oidc-groups-prefix="oidc:"
```

### 2. Enable OIDC authorization via RBAC:
```bash
kubectl config use-context minikube
k create clusterrolebinding oidc-users --clusterrole view --group oidc:/cluster-users
k create clusterrolebinding oidc-admin --clusterrole cluster-admin --group oidc:/cluster-admins
```

### 3. Obtain token with brauzie and enjoy:
```bash
./k8s-auth.sh
k get po --all-namespaces
```

### 4. Change user
If you want to change the user, simply run ``brauzie logout`` and then ``./k8s-auth.sh`` again
