var utils = require('./utils.js');
var config = require('./config.js');

exports.parser = function insteonParser() {
    // collect incoming bytes and return a complete insteon message(s) http://www.insteon.net/sdk/forum/topic.asp?TOPIC_ID=927
    var data = [];
    var messages = [];
    var msglen = -1;
    var date = new Date();
    var start = '';

    return function (emitter, buffer) {
        for(var i=0; i < buffer.length; i++) {
            b = buffer[i];
            //console.log(utils.dec2hexstr(b));
            if(start != '' && date.getTime() - start > config.INSTEON_PLM_TIME_LIMIT) {
                //if(data.length != 0) console.log('parser: Incomplete message ('+byteArrayToHexString(data)+') discarded, exceeded time limit');
                data = [];
                msglen = -1;
                start = '';
            }
            if(b == config.INSTEON_PLM_START && msglen == -1) {
                //if(data.length != 0) console.log('parser: Incomplete message ('+byteArrayToHexString(data)+') discarded, unknown command length');
                data = [];
                msglen = 0;
                start = date.getTime();
            }
            if(b == config.INSTEON_PLM_NAK && msglen == -1) {
                msglen = 1;
            }
            data.push(b);

            if(data.length == 2 && msglen == 0) {
                // get message length based on command
                msglen = utils.getInsteonMessageLength(data[1]);
            } else if(data.length == 6 && utils.dec2hexstr(data[1]) == '62') {
                // check for extended message
                if(data[5]&&16 == 1) {  // message flag byte AND 16 (00010000)
                    msglen = 23;
                }
            } else if(data.length > 0 && msglen == data.length) {
                // completed message
                messages.push(data);
                data = [];
                msglen = -1;
                start = '';
            }
        }
        // emit all completed messages
        messages.forEach(function (msg, i, array) {
            emitter.emit('data', msg);
        });
        messages = [];
    };
}

