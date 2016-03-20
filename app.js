var express = require("express");
var fs = require("fs");
var async = require("async");
var path = require("path");
var bodyParser = require("body-parser");
var uuid = require("uuid");

fs.mkdir("data", function(error) {
    if(error && error.code != "EEXIST") {
        console.error("Failed to create data dir", error);
    }
});

var app = express();

app.use(function defaultResponseCharset(req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8");
    next();
});

app.use(bodyParser.json());

app.use(function requestStartLogger(req, res, next) {
    console.log("Started request", { body: req.body, params: req.params, query: req.query, url: req.url });
    next();
});

app.use(function responseLogger(req, res, next) {
    var knownStatus = 200;

    var oldStatus = res.status;
    res.status = function(status) {
        knownStatus = status;
        return oldStatus.apply(res, arguments);
    }

    var oldSend = res.send;
    res.send = function(data) {
        console.log("Responded %s:", knownStatus, data);
        return oldSend.apply(res, arguments);
    }

    next();
});

app.get("/content", function(req, res) {
    if(!req.query.long) {
        return res.status(400).send({ error: "Missing long arg" });
    }
    if(!req.query.lat) {
        return res.status(400).send({ error: "Missing lat arg" });
    }
    fs.readdir("data", function(error, files) {
        if(error) {
            console.error("Failed to get data list", error);
            return res.status(500).send({ error: "Failed to get data" });
        }
        async.map(files, function(file, callback) {
            fs.readFile(path.join("data", file), function(error, buf) {
                if(error) {
                    return callback(error);
                }
                callback(null, buf.toString());
            });
        }, function(error, notes) {
            if(error) {
                console.error("Failed to read data", error);
                return res.status(500).send({ error: "Failed to get data" });
            }
            res.send({ notes: notes });
        });
    });
});

app.post("/note", function(req, res) {
    if(!req.body.long) {
        return res.status(400).send({ error: "Missing long arg" });
    }
    if(!req.body.lat) {
        return res.status(400).send({ error: "Missing lat arg" });
    }
    if(!req.body.text) {
        return res.status(400).send({ error: "Missing text arg" });
    }
    fs.writeFile(path.join("data", uuid.v4() + "__" + req.body.long + "__" + req.body.lat), req.body.text, function(error) {
        if(error) {
            console.error("Failed to save note", error);
            return res.status(500).send({ error: "Failed to save note" });
        }
        res.send();
    });
});

app.listen(3009);
