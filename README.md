# =brauzie=


[![npm (scoped)](https://img.shields.io/npm/v/@maslick/brauzie.svg)](https://www.npmjs.com/package/@maslick/brauzie)
[![npm download count](https://img.shields.io/npm/dt/@maslick/brauzie.svg)](https://npmcharts.com/compare/@maslick/brauzie?minimal=true)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)


*Brauzie* was designed as an easy-to-use CLI tool for fetching access tokens for Keycloak public clients. 
Often times when debugging security for your web-applications you need to quickly get the access token from your Identity provider (e.g. Keycloak) and fire a GET/POST request to your backend server using ``curl`` or ``httpie``.

## Installation
```
npm i -g @maslick/brauzie
```

## Usage
First, set your configuration via environment variables:
```
export BRAUZIE_KC_URL=http://auth.maslick.ru
export BRAUZIE_REALM=brauzie
export BRAUZIE_CLIENT_ID=web
```

Then you can login/logout:
```
brauzie login
brauzie logout
```
*Brauzie* uses the **Authorization Code flow** (see the OAuth2.0 [specs](https://oauth.net/2/grant-types/authorization-code/)).
After launching the ``login`` command *Brauzie* will open up a browser window where you have to login to your public OIDC client. Then it will exchange the ``authorization_code`` for the JWT token and save it to ``~/.brauzie``:
```
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
Logout will invalidate the current user session and delete the ``~/.brauzie`` file.


## Advanced usage
```
export TOKEN=`brauzie login`
curl -H "Authorization: Bearer $TOKEN" htts://example.com
```

```
cat ~/.brauzie | jq -r '.access_token'
cat ~/.brauzie | jq -r '.refresh_token'
```

```
TOKEN=$(cat ~/.brauzie | jq -r '.access_token') 
http http://httpbin.org/get  "Authorization: Bearer $TOKEN"
```

## Testing
* Import [sample-realm.json](sample-realm.json) to your Keycloak instance.
* Add user/s via Keycloak web console.
