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



const baseUrl = process.env.BRAUZIE_BASE_URL || "https://accounts.google.com/o/oauth2/v2/auth";
const tokenUrl = process.env.BRAUZIE_TOKEN_URL || "https://www.googleapis.com/oauth2/v4/token";
const client_id = process.env.BRAUZIE_CLIENT_ID || "12345678-asd123asd123asd123.apps.googleusercontent.com";
const client_secret = process.env.BRAUZIE_CLIENT_SECRET || "xxxxxxxxxxxxxxx";

const brauzieFolder = process.env.HOME + "/.brauzie";
const brauzieFile = brauzieFolder + "/jwt.json";
const brauzieTokenFile = brauzieFolder + "/id-token.json";

if (argv._[0] === "login") {
    if (argv['direct-grant']) {}
    else {
        fp(9000, (err, PORT) => {
            const authEndpoint = "/brauzie";
            const redirectUrl = "http://localhost:" + PORT + authEndpoint;

            (async () => {
                await open(baseUrl + '?scope=openid email profile&response_type=code&access_type=offline&redirect_uri=' + redirectUrl + "&client_id=" + client_id);
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
                        client_secret: client_secret,
                        redirect_uri: redirectUrl,
                        grant_type: 'authorization_code'
                    };

                    axios.post(tokenUrl, qs.stringify(req))
                        .then(response => {
                            const token = response.data;
                            const jowt = saveTokenHandler(token);
                            if (argv.silent) {
                                res.send(
                                    "<script>\n" +
                                    "    window.close();\n" +
                                    "</script>"
                                );
                            } else {
                                res.send(
                                    "<div style='max-width: 800px; margin: 0 auto;'>" +
                                      "<div style='font-family: monospace;text-align: center;padding: 20px;font-size: 32px;background: #f2f2f2;font-weight: bold;'>" +
                                        "Hi " + (jowt.given_name || jowt.preferred_username) + "! This is ~brauzie :)" +
                                      "</div>" +
                                      "<div style='font-family: monospace; padding: 20px 20px; background: #d9d9d9;'>" +
                                        "You have been successfully authenticated. <br>" +
                                        "Your JWT token was saved to ~/.brauzie/jwt.json. <br>" +
                                        "Its json representation is pasted below. <br>" +
                                      "</div>" +
                                      "<div style='white-space: pre; font-family: monospace; padding: 20px; background: #f0f8ff; overflow: auto; word-wrap: normal; overflow-wrap: normal;'>" +
                                        JSON.stringify(jwt.decode(token["id_token"]).payload, null, 2) +
                                      "</div>" +
                                    "</div>"
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
else if (argv._[0] === "logout") {}

function saveTokenHandler(token) {
    if (!argv.quite) console.log(token.access_token);
    const decodedIdTokenJWT = jwt.decode(token.id_token).payload;

    if (!fs.existsSync(brauzieFolder)) fs.mkdirSync(brauzieFolder);
    fs.writeFileSync(brauzieFile, JSON.stringify(token, null, 2));
    fs.writeFileSync(brauzieTokenFile, JSON.stringify(decodedIdTokenJWT, null, 2));
    return decodedIdTokenJWT;
}
