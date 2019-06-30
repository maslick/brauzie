# =brauzie=


[![npm (scoped)](https://img.shields.io/npm/v/@maslick/brauzie.svg)](https://www.npmjs.com/package/@maslick/brauzie)
[![npm download count](https://img.shields.io/npm/dt/@maslick/brauzie.svg)](https://npmcharts.com/compare/@maslick/brauzie?minimal=true)
[![npm bundle size](https://img.shields.io/badge/size-4kB-green.svg)](https://www.npmjs.com/package/@maslick/brauzie)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)


Often times when debugging *security* for your web-applications you need to quickly get the access token from your Identity provider (e.g. Keycloak) and fire a GET/POST request to your backend server using ``curl`` or ``httpie``. Some people use [Postman](https://www.getpostman.com/), some do it manually. Both approaches are time-consuming and nerve-wracking.
*Brauzie* was designed with an idea of a fast and simple CLI tool for fetching access tokens for Keycloak public clients. 

## Features
* easy-to-use CLI
* obtains OIDC token via *Authorization Code flow*
* decodes JWT token
* tested with Keycloak
* can be used for k8s authentication (see [here](k8s-authz.md))

## Installation
```
npm i -g @maslick/brauzie
```

## Usage
First, set your configuration via environment variables:
```bash
export BRAUZIE_KC_URL=http://auth.maslick.ru
export BRAUZIE_REALM=brauzie
export BRAUZIE_CLIENT_ID=web
```

Then you can login/logout:
```bash
brauzie login
brauzie login --quite
brauzie logout
```
*Brauzie* uses the **Authorization Code flow** (see the OAuth2.0 [specs](https://oauth.net/2/grant-types/authorization-code/)).
After you execute the ``login`` command, *Brauzie* will open up a browser window where you will have to login to your public OIDC client with username/password. Then it will exchange the ``authorization_code`` for the JWT token and save it to ``~/.brauzie/jwt.json``:
```bash
cat ~/.brauzie/jwt.json
{
  "access_token": "xxxxx.yyyyy.zzzzz",
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "refresh_token": "zzzzz.yyyyy.xxxxx",
  "token_type": "bearer",
  "id_token": "aaaaa.bbbbb.ccccc",
  "not-before-policy": 0,
  "session_state": "620a5ee7-1596-4669-ac7a-115738f2210c",
  "scope": "profile email"
}
```
Unless ``--quite`` is specified, *Brauzie* will output the ``access_token`` to stdout.
It will also put the decoded ``id_token`` to ``~/.brauzie/id-token.json``:
```bash
cat ~/.brauzie/id-token.json
{
  "jti": "fffd0c04-f971-4328-8116-fa4cbabd4978",
  "exp": 1561839325,
  "nbf": 0,
  "iat": 1561839025,
  "iss": "https://auth.maslick.ru/auth/realms/brauzie",
  "aud": "web",
  "sub": "3f6d7531-cf67-4702-a62a-8efcf914d904",
  "typ": "ID",
  "azp": "web",
  "auth_time": 1561839025,
  "session_state": "c298f25b-60ac-4e55-825a-2a66cbfa0cfc",
  "acr": "1",
  "email_verified": true,
  "name": "Admin Adminović",
  "groups": [
    "/cluster-admins"
  ],
  "preferred_username": "admin",
  "given_name": "Admin",
  "family_name": "Adminović",
  "email": "admin@admin.si"
}
```

Logout will invalidate the current user session and delete the contents of the ``~/.brauzie/`` directory.


## Advanced usage
```bash
export TOKEN=`brauzie login`
curl -H "Authorization: Bearer $TOKEN" htts://example.com
```

```bash
cat ~/.brauzie | jq -r '.access_token'
cat ~/.brauzie | jq -r '.refresh_token'
```

```bash
TOKEN=$(cat ~/.brauzie/jwt.json | jq -r '.access_token') 
http http://httpbin.org/get  "Authorization: Bearer $TOKEN"
```

```bash
echo $(cat ~/.brauzie/id-token.json | jq -r '.name')
```

## Testing
* Import [sample-realm.json](sample-realm.json) to your Keycloak instance.
* Add user/s via Keycloak web console.
