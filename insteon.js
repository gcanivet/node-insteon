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
exports.sendSerial = send.sendSerial;
exports.eventEmitter = config.eventEmitter;

exports.connect = function connect(port) {
    if(config.sp != null) {
        config.sp.close();
        config.sp.removeAllListeners();
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
    console.log('connect::serial port connected');
    config.sp.on('data', receive.handler);
    config.expired_count = 0;

	var getversion = [0x02, 0x60];
    send.sendSerial(getversion);
}

/*
** Built-in Events and Event Handlers
*/
setInterval(send.dequeue, 250); // always check for queued commands (by default, send() dequeues immediately)
config.eventEmitter.on('cleanup', receive.cleanup);
//receive.eventEmitter.on('message', someEvent);
