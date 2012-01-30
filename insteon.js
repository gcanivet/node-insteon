var INSTEON_PLM_START = 0x02;
var INSTEON_PLM_ACK = 0x06;
var INSTEON_PLM_NAK = 0x15;
var INSTEON_PLM_TIME_LIMIT = 240; 	// insteonParser(); all messages must complete in 240ms else discard

var INSTEON_MESSAGES = {
    // commands sent from an IM to Host
    '50' : {type: 'Insteon Standard Message Received', len: 11},
    '51' : {type: 'Insteon Extended Message Received', len: 25},
    '52' : {type: 'X10 Received', len: 4},
    '53' : {type: 'ALL-Linking Completed', len: 10},
    '54' : {type: 'Button Event Report', len: 3},
    '55' : {type: 'User Reset Detected', len: 2},
    '56' : {type: 'ALL-Link Cleanup Failure Report', len: 7},
    '57' : {type: 'ALL-Link Record Response', len: 10},
    '58' : {type: 'ALL-Link Cleanup Status Report', len: 3},
    // response from commands sent from Host to IM
    '60' : {type: 'Get IM Info', len: 9}, //
    '61' : {type: 'Send ALL-Link Command', len: 6},
    '62' : {type: 'Send INSTEON Standard or Extended Message'}, // no defined length [must check message flag]
    '63' : {type: 'Send X10', len: 5},
    '64' : {type: 'Start ALL-Linking', len: 5},
    '65' : {type: 'Cancel ALL-Linking', len: 3},
    '66' : {type: 'Set Host Device Category', len: 6},
    '67' : {type: 'Reset the IM', len: 3},
    '68' : {type: 'Set INSTEON ACK Message Byte', len: 4},
    '69' : {type: 'Get First ALL-Link Record', len: 3},
    '6a' : {type: 'Get Next ALL-Link Record', len: 3},
    '6b' : {type: 'Set IM Configuration', len: 4},
    '6c' : {type: 'Get ALL-Link Record for Sender', len: 3},
    '6d' : {type: 'LED On', len: 3},
    '6e' : {type: 'LED Off', len: 3},
    '6f' : {type: 'Manage ALL-Link Record', len: 12},
    '70' : {type: 'Set INSTEON NAK Message Byte', len: 4},
    '71' : {type: 'Set INSTEON ACK Message Two Bytes', len: 5},
    '72' : {type: 'RF Sleep', len: 3},
    '73' : {type: 'Get IM Configuration', len: 6}
};

function dec2hexstr(str) {
    // padding to at least 2 places
	var hex = Number(str).toString(16);
    while(hex.length < 2) {
        hex = '0' + hex;
    }
    return hex;
}

function getInsteonMessageLength(aByte) {
    // given insteon command code (second byte) return expected length of message
    var cmd = dec2hexstr(aByte);
    if(typeof(INSTEON_MESSAGES[cmd]) != undefined) {
        if(cmd == '62') return 9; // assume standard
        return INSTEON_MESSAGES[cmd].len;
    }
    return -1; // not implemented
}

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
            //console.log(dec2hexstr(b));
            if(start != '' && date.getTime() - start > INSTEON_PLM_TIME_LIMIT) {
                //if(data.length != 0) console.log('parser: Incomplete message ('+byteArrayToHexString(data)+') discarded, exceeded time limit');
                data = [];
                msglen = -1;
                start = '';
            }
            if(b == INSTEON_PLM_START && msglen == -1) {
                //if(data.length != 0) console.log('parser: Incomplete message ('+byteArrayToHexString(data)+') discarded, unknown command length');
                data = [];
                msglen = 0;
                start = date.getTime();
            }
            if(b == INSTEON_PLM_NAK && msglen == -1) {
                msglen = 1;
            }
            data.push(b);

            if(data.length == 2 && msglen == 0) {
                // get message length based on command
                msglen = getInsteonMessageLength(data[1]);
            } else if(data.length == 6 && dec2hexstr(data[1]) == '62') {
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

