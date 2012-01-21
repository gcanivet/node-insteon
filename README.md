Insteon Parser
==============

Implements a parser for an INSTEON Power Line Modem (PLM) to build your own controller. 

Install
-------

npm install serialport
npm install insteon

How to Use
----------

Sample code:

	var insteon = require('insteon');
	var SerialPort = require('serialport').SerialPort;
	var sp = new SerialPort('/dev/ttyS0', {
	    baudrate: 19200,
	    databits: 8,
	    stopbits: 1,
	    parity: 0,
	    flowcontrol: 0,
	    parser: insteon.parser()
	});

	sp.on('data', function(data) {
		console.log(data);
	});


