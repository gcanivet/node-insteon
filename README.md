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
	
License
-------
Please share your work or contact for commercial use

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png" /></a><br /><span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">node-insteon</span> by <a xmlns:cc="http://creativecommons.org/ns#" href="https://github.com/gcanivet/node-insteon" property="cc:attributionName" rel="cc:attributionURL">Graeme Canivet</a> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/">Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License</a>.
