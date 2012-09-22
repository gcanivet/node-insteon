Insteon Parser
==============

A node based INSTEON controller for sending and receiving INSTEON commands including a standalone parser for an INSTEON Power Line Modem (PLM) to build your own controller.

Features
--------
	* implements PLM request/response model
	* message queue
	* retry mechanism
	* reconnect mechanism


Install
-------
	npm install serialport
	npm install insteon
	npm install clone (optional: example2.js)

How to Use
----------
See examples

Experimental
------------
This is not production ready; in particular there are many known issues or portions of the insteon protocol that are not implemented fully or possibly correctly. Any help is appreciated ;)
	
Connection Tips
---------------
This has been tested with the following environments and devices:

PowerLinc Serial Dual Band Modem (#2413S) connected to Ubuntu 14.0 via Windows 7 host VMWare Player. 
* As long as the VM recognizes the host serial port, you should be able to connect using port "/dev/ttyS0"
	
PowerLinc Portable USB (#2448A7) connected to MacBook Air OSX 10.7.4. 
* To activate the USB, must install the MAC OSX drivers:
	http://www.ftdichip.com/Drivers/VCP.htm
	http://www.ftdichip.com/Support/Documents/AppNotes/AN_134_FTDI_Drivers_Installation_Guide_for_MAC_OSX.pdf
* Once installed, you should be able to connect using a port similar to "/dev/tty.usbserial-A8006Xpl"

PowerLinc USB Modem (#2412U) connected to Ubuntu 11.10 via Windows 7 host VMWare Player.
* To activate the USB drivers, must install the Windows drivers:
	http://www.ftdichip.com/Drivers/VCP.htm
* Once installed, and the VM recognized the host USB port, you should be able to connect using port "/dev/USBS0"

Note, others reported needing to comment out "parity" and "flowcontrol" for it to work (#2413U). 

License
-------
Please share your work or contact for commercial use

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png" /></a><br /><span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">node-insteon</span> by <a xmlns:cc="http://creativecommons.org/ns#" href="https://github.com/gcanivet/node-insteon" property="cc:attributionName" rel="cc:attributionURL">Graeme Canivet</a> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/">Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License</a>.
