/*
** Example 1: This example does not show usage of the node-insteon package except for the parser.
**            The output should be a list of ports available on the system followed by a recurring
**            PLM getVersion reply.
*/

//You may need to correct the paths in the requires to suit your environment.
var insteon = require('insteon')        //necessary for insteon.parser()
var SerialPort = require("serialport")  //everything else in this example.

var listCallback = function(error, ports){
	if(error){
		console.log("When generating port list, received error: " + error)
	}else{
		console.log("The following serial ports are available on your system:")
		for(port in ports){
			console.log("    Port " + port + ":")
			console.log("        path: " + ports[port].comName)
			console.log("        make: " + ports[port].manufacturer)
			console.log("        id  : " + ports[port].pnpId)
		}
		console.log("done listing ports.")
	}
}
SerialPort.list(listCallback)

var cb = function(e, r){
	console.log("Wrote to port.")
	if(e) console.log("    received error: " + e)
	//if(r) console.log("    received: " r) //This is meaningless because it's partial?  See the sp.on("data") below.
}
var serialport = SerialPort.SerialPort
var port = "/dev/ttyUSB0"  //change this to suit your system.
                           //If you're not sure, try running this example as it should list available ports.
console.log("opening " + port)
var sp = new serialport(port, {
    baudrate: 19200,
    databits: 8,
    stopbits: 1,
    parity: 'none',
    flowcontrol: false,
    //Graeme already provided a parser to buffer the data received on the serial port.  Only have one line
    //below uncommented to see the difference.  Without buffering, sometimes the data received will be partial.
    //parser: SerialPort.parsers.raw
    parser: insteon.parser()
})

sp.on('data', function(data) {
    console.log("    Got data: " + data.toString('hex'))  //we don't need .toString('hex') when using insteon.parser()
                                                          //but it makes output prettier when using raw parser.
})

//Two things here.  This is on setInterval to demonstrate the need for buffering.  But also, if we
//just write to port immediatly after initialization, we'll receive error of port not connected yet.
//I'm thinking there must be a callback feature for "on connect".  similarly to above, writes need buffering.
//0260 is the PLM command for getVersion
setInterval(function(){ sp.write(new Buffer([0x02, 0x60]), cb) }, 2000)