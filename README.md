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

	var getversion = new Buffer([0x02, 0x60]);
	sp.write(getversion);
	
License
-------
Please share your work or contact for commercial use

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png" /></a><br /><span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">node-insteon</span> by <a xmlns:cc="http://creativecommons.org/ns#" href="https://github.com/gcanivet/node-insteon" property="cc:attributionName" rel="cc:attributionURL">Graeme Canivet</a> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/">Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License</a>.
