var http = require("http");
var fs = require("fs");
var aws = require("aws-sdk");

var api_url = "http://webapi.aitalk.jp/webapi/v2/ttsget.php";

exports.handler = function(event, context) {
    var request_url = api_url +
        "?username=" + encodeURI(event.aitalk_username) +
        "&password=" + encodeURI(event.aitalk_password) +
        "&text=" + encodeURI(event.text) +
        "&speaker_name=" + encodeURI(event.aitalk_speaker_name) +
        "&volume=" + encodeURI(event.aitalk_volume) +
        "&speed=" + encodeURI(event.aitalk_speed) +
        "&pitch=" + encodeURI(event.aitalk_pitch) +
        "&range=" + encodeURI(event.aitalk_range) +
        "&ext=wav&use_wdic=1";

    var outFile = fs.createWriteStream("/tmp/" + event.filename);
    // start download
    http.get(request_url, function(res) {

        // output as a file
        res.pipe(outFile);

        // download end
        res.on("end", function() {
            outFile.close();

            // open the wav file as a js object and putObject to S3
            var s3 = new aws.S3();
            fs.readFile("/tmp/" + event.filename, function(err, data) {
                if (err) {
                    return console.log(err);
                }
                var params = {
                    Bucket: event.bucket,
                    Key: event.filename,
                    Body: data,
                    ContentType: "audio/wav",
                    ACL: "public-read"
                };
                s3.putObject(params, function(err, data) {
                    console.log(err, data);
                });
            });

        });
    }).on("error", function(e) {
        context.done("error", e);
    });
};
