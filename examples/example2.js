/*
** Example2: Connect, Send and Receive Complete Insteon Message Transactions
**
** How to use example
** ------------------
** npm install clone
**
*/
var insteon = require('.././insteon');
var clone = require('clone');
insteon.connect();


insteon.eventEmitter.on('message', function(transaction) {
	console.log('event message::');
    message = clone(transaction);

    delete message.timerid; // does not jsonify
    console.log(message);
});


var getversion = [0x02, 0x60];
insteon.send(getversion);
