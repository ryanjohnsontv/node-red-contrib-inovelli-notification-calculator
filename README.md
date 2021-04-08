# Inovelli Notification Calculator

Forked from the exceptionally wonderful https://github.com/pdong/node-contrib-inovelli-status-manager repo.

This node allows you to easily set the appropriate values to send to your Inovelli Red Series switches.

It should be used in conjunction with the node-red–contrib-home-assistant-websocket add on and the output should
be connected to an api-call-service node. This node will automatically fill in the appropriate fields for that node.

If you notice any problems open an issue or a pull request, I'll respond ASAP.  Thanks!

## Features
-   [x] Support for OZW and Z-Wave JS (Requires Home Assistant 2021.4.0 or newer)
-   [x] Allows all fields to be controlled by the payload of an incoming message
-   [x] Use color-convert library to accept color names, RGB arrays, hexadecimals, or hue value as input
-   [x] Automatically convert input values to proper format (ie. "2 Hours" = 168 for Inovelli math)
-   [x] Detect color input to properly convert to Inovelli's hue range
-   [x] Support for ALL Inovelli Red Series switches

## Installation
```
git clone https://github.com/ryanjohnsontv/node-red-contrib-inovelli-notification-calculator.git

npm i node-red-contrib-inovelli-notification-calculator

reboot
```
**For supervised installations I recommend adding the add-on "SSH & Web Terminal", add '- npm' as a package in the configuration for this add-on, then navigate to the Node-RED directory (```cd config/node-red```) and follow the above installation instructions.
