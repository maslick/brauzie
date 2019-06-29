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


let kcUrl = process.env.BRAUZIE_KC_URL || "https://auth.maslick.ru";
let realm = process.env.BRAUZIE_REALM || "brauzie";
let client_id = process.env.BRAUZIE_CLIENT_ID || "web";

let baseUrl = kcUrl + "/auth/realms/"+ realm + "/protocol/openid-connect";
const brauzieFile = process.env.HOME + "/.brauzie";

if (argv._[0] === "login") {
    fp(9000, (err, PORT) => {
        const authEndpoint = "/helloworld";
        const redirectUrl = "http://localhost:" + PORT + authEndpoint;

        (async () => {
            await open(baseUrl + '/auth?client_id=' + client_id + '&response_type=code&redirect_uri=' + redirectUrl);
        })();

        app.get(authEndpoint, (req, res) => {
            const code = req.query.code;
            if (code) {
                const data = {
                    code: code,
                    client_id: client_id,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUrl
                };

                axios.post(baseUrl + "/token", qs.stringify(data))
                    .then(response => {
                        const token = response.data;
                        console.log(token.access_token);
                        const decodedJWT = jwt.decode(token.access_token).payload;
                        let name = decodedJWT.given_name || decodedJWT.preferred_username;

                        fs.writeFileSync(brauzieFile, JSON.stringify(token, null, 2));
                        if (argv.silent) {
                            res.send("" +
                                "<script>\n" +
                                "    window.close();\n" +
                                "</script>"
                            );
                        } else {
                            res.send(
                                "<h1>Hi " + name + "! This is ~brauzie :)</h1>" +
                                "<p>You have been successfully authenticated. " +
                                "Your access token was saved to ~/.brauzie. You can close me now :)" +
                                "</p>"
                            );
                        }
                        if (!argv.debug) process.exit(0);
                    })
                    .catch(reason => {
                        console.error("error!!");
                        res.send("" +
                            "<script>\n" +
                            "    window.close();\n" +
                            "</script>"
                        );
                        if (!argv.debug) process.exit(1);
                    });
            }
        });
        app.listen(PORT)
    });
}
else if (argv._[0] === "logout") {
    if (!fs.existsSync(brauzieFile)) {
        console.log("Cannot logout, you should login first!");
        process.exit(1);
    }

    const refreshToken = JSON.parse(fs.readFileSync(brauzieFile)).refresh_token;
    const data = {
        client_id: client_id,
        refresh_token: refreshToken
    };
    axios.post(baseUrl + "/logout", qs.stringify(data))
        .then(response => {
            console.log("successfully logged out");
            fs.unlinkSync(brauzieFile);
            process.exit(0);
        })
        .catch(reason => {
            console.log("Could not logout :(");
            process.exit(1);
        });
}


