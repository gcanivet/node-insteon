/*
** node-insteon
** ------------
** main driver for node insteon, exposes
**  * parser: raw serial port parser for insteon messages
**  * connect: connect to insteon plm (powerlinc modem)
** 
*/ 
var utils = require('./utils.js');
var config = require('./config.js');
var send = require('./send.js');
var receive = require('./receive.js');
var SerialPort = require('serialport').SerialPort;

/*
** Exported Interface 
*/
var parser = exports.parser = require('./parser.js').parser; // v.0.0.3 compatibility
exports.send = send.send;
exports.sendRawSerial = send.sendRawSerial;
exports.eventEmitter = config.eventEmitter;
exports.setMessageFlags = utils.setMessageFlags;

exports.connect = function connect(port) {
	// re-connect
    if(config.sp != null) {
        config.sp.close();
        config.sp.removeAllListeners();
		config.sp = null;
    }
    console.log('connect::opening serialport');
	if(port == undefined) port = '/dev/ttyS0';

    config.sp = new SerialPort(port, {
        baudrate: 19200,
        databits: 8,
        stopbits: 1,
        parity: 0,
        flowcontrol: 0,
        parser: parser()
    });
	/*
	config.sp.on('end', function() {});
	config.sp.on('close', function() {});
	config.sp.on('error', function() {});
	*/
	config.PLM_BUSY = true; // queue messages until connection confirmed
    config.sp.once('data', function(data) {
	    console.log('connect::read serial hex: '+utils.byteArrayToHexStringArray(data));
    	console.log('connect::serial port connected');
		config.sp.on('data', receive.serialport_handler);
		config.PLM_BUSY = false;
    	config.expired_count = 0;
	});

	// verify connection
	var timerid = null;
	var verify = function() {
		if(!config.PLM_BUSY) clearInterval(timerid);
		console.log('connect::verify connection with getversion');
		var getversion = [0x02, 0x60]; // get IM info
    	send.sendRawSerial(getversion);
	}
	timerid = setInterval(verify, 1000);
}

/*
** Built-in Events and Event Handlers
*/
setInterval(send.dequeue, 250); // always check for queued commands (by default, send() dequeues immediately)
config.eventEmitter.on('cleanup', receive.cleanup);
//config.eventEmitter.on('message', someEvent);
