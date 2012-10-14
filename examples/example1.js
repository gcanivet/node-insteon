/*
** Example 1: This example does not show usage of the node-insteon package.  This is an illustration
**            of the serialport package with some.  It should output a list of ports available on
**            the system, followed by an unending interval of "PLM getVersion"
*/
var SerialPort = require("serialport")

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
	//if(r) console.log("    received: " + r) //This is meaningless?  See the sp.on("data") below.
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
    parser: SerialPort.parsers.raw
})


//This data must be buffered.  Run and you'll see sometimes the data is complete, but other times it is partial.
//That it is not consistent means we need to collect it somehow before processing.
sp.on("data", function (data) {
	console.log("got data: "+ data.toString('hex'))
})
//Two things here.  This is on setInterval to demonstrate the need for buffering.  But also, if we
//just write to port immediatly after initialization, we'll receive error of port not connected yet.
//I'm thinking there must be a callback feature for "on connect".  similarly to above, writes need buffering.
//0260 is the PLM command for getVersion
setInterval(function(){ sp.write(new Buffer([0x02, 0x60]), cb) }, 2000)