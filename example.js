var insteon = require('./insteon');
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

