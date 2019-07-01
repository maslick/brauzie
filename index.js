#! /usr/bin/env node

const open = require('open');
const express = require('express');
const app = express();
const axios = require('axios');
const qs = require('qs');
const argv = require('yargs').argv;
const fs = require("fs");
const fp = require("find-free-port");
const jwt = require("jws");


const kcUrl = process.env.BRAUZIE_KC_URL || "https://google.com";
const realm = process.env.BRAUZIE_REALM || "";
const client_id = process.env.BRAUZIE_CLIENT_ID || "";

const client_secret = process.env.BRAUZIE_CLIENT_SECRET || "";
const username = process.env.BRAUZIE_USERNAME || "";
const password = process.env.BRAUZIE_PASSWORD || "";

const baseUrl = kcUrl + "/auth/realms/"+ realm + "/protocol/openid-connect";
const brauzieFolder = process.env.HOME + "/.brauzie";
const brauzieFile = brauzieFolder + "/jwt.json";
const brauzieTokenFile = brauzieFolder + "/id-token.json";

if (argv._[0] === "login") {
    if (argv['direct-grant']) {
        const req = {
            client_id: client_id,
            client_secret: client_secret,
            username: username,
            password: password,
            grant_type: 'password',
            scope: 'openid'
        };

        axios.post(baseUrl + "/token", qs.stringify(req))
            .then(response => {
                const jwt = saveTokenHandler(response.data);
                process.exit(0);
            })
            .catch(error => {
                console.error("Error while fetching token :(");
                const errMsg = error.response.data;
                if (errMsg) console.error(JSON.stringify(errMsg));
                process.exit(1);
            });
    }
    else {
        fp(9000, (err, PORT) => {
            const authEndpoint = "/brauzie";
            const redirectUrl = "http://localhost:" + PORT + authEndpoint;

            (async () => {
                await open(baseUrl + '/auth?scope=openid&client_id=' + client_id + '&response_type=code&redirect_uri=' + redirectUrl);
            })();

            let server = app.listen(PORT);
            setTimeout(() => {
                server.close();
                console.log("Timeout reached :(");
            }, 2 * 1000 * 60);

            app.get(authEndpoint, (req, res) => {
                const code = req.query.code;
                if (code) {
                    const req = {
                        code: code,
                        client_id: client_id,
                        grant_type: 'authorization_code',
                        redirect_uri: redirectUrl,
                        client_secret: client_secret
                    };

                    axios.post(baseUrl + "/token", qs.stringify(req))
                        .then(response => {
                            const jwt = saveTokenHandler(response.data);
                            if (argv.silent) {
                                res.send(
                                    "<script>\n" +
                                    "    window.close();\n" +
                                    "</script>"
                                );
                            } else {
                                res.send(
                                    "<h1>Hi " + (jwt.given_name || jwt.preferred_username) + "! This is ~brauzie :)</h1>" +
                                    "<p>You have been successfully authenticated. " +
                                    "Your access token was saved to ~/.brauzie. You can close me now :)" +
                                    "</p>"
                                );
                            }
                            server.close();
                            process.exit(0);
                        })
                        .catch(error => {
                            console.error("Error while exchanging code for JWT token :(");
                            const errMsg = error.response.data;
                            if (errMsg) console.error(JSON.stringify(errMsg));
                            res.send(
                                "<script>\n" +
                                "    window.close();\n" +
                                "</script>"
                            );
                            server.close();
                            process.exit(1);
                        });
                }
            });
        });
    }
}
else if (argv._[0] === "logout") {
    if (!fs.existsSync(brauzieFile)) {
        console.log("Cannot logout, you must login first :(");
        process.exit(1);
    }

    const refreshToken = JSON.parse(fs.readFileSync(brauzieFile)).refresh_token;
    const req = {
        client_id: client_id,
        refresh_token: refreshToken,
        client_secret: client_secret
    };
    axios.post(baseUrl + "/logout", qs.stringify(req))
        .then(response => {
            console.log("Successfully logged out :)");
            fs.unlinkSync(brauzieFile);
            fs.unlinkSync(brauzieTokenFile);
            process.exit(0);
        })
        .catch(error => {
            console.log("Could not logout :(");
            const errMsg = error.response.data;
            if (errMsg) console.error(JSON.stringify(errMsg));
            process.exit(1);
        });
}

function saveTokenHandler(token) {
    if (!argv.quite) console.log(token.access_token);
    const decodedJWT = jwt.decode(token.access_token).payload;
    const decodedIdTokenJWT = jwt.decode(token.id_token).payload;

    if (!fs.existsSync(brauzieFolder)) fs.mkdirSync(brauzieFolder);
    fs.writeFileSync(brauzieFile, JSON.stringify(token, null, 2));
    fs.writeFileSync(brauzieTokenFile, JSON.stringify(decodedIdTokenJWT, null, 2));
    return decodedIdTokenJWT;
}

