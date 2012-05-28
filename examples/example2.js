/*
** Example2: Connect, Send and Receive Complete Insteon Message Transactions
**
*/
var insteon = require('.././insteon');
var clone = require('clone');
insteon.connect();


insteon.eventEmitter.on('message', function(transaction) {
	console.log('event message::');
    console.log(transaction);
});


var getversion = [0x02, 0x60];
insteon.send(getversion);
