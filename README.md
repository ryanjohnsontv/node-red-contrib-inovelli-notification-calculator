# Inovelli Notification Calculator

Forked from the exceptionally wonderful https://github.com/pdong/node-contrib-inovelli-status-manager repo.

This node allows you to easily set the appropriate values to send to your Inovelli Red Series switches.

If you notice any problems open an issue or a pull request, I'll respond ASAP.  Thanks!

## Features
-   Support for OZW and Z-Wave JS (Requires Home Assistant 2021.4.0 or newer)
-   Allows all fields to be controlled by the payload of an incoming message
-   Use color-convert library to accept color names, RGB arrays, hexadecimals, or hue value as input
-   Automatically convert input values to proper format (ie. "2 Hours" = 168 for Inovelli math)
-   Detect color input to properly convert to Inovelli's hue range
-   Support for ALL Inovelli Red Series switches
-   Easily clear notifications


## How to use

This node should be used in conjunction with the node-red–contrib-home-assistant-websocket plaette, and the output should
be connected to an api-call-service node. This node will automatically fill in the appropriate fields for that node. [Example flows are provided in this repo](https://github.com/ryanjohnsontv/node-red-contrib-inovelli-notification-calculator/tree/main/examples).

### Z-Wave Integration

You are able to choose between Z-Wave JS, OpenZWave, or Z-Wave (deprecated) as your integration. This can also be set via msg.payload.zwave (zwave_js, ozw, or zwave).

### Entity ID/Node ID

Depending on your Z-Wave integration, you'll have the option to add one ID, or a comma delimited list of IDs, or your corresponding device(s). For Z-Wave JS you can set this entity ID in the Home Assistant call-service node, in this node, or send a message with your ID(s) in the msg.payload.entity_id field. For OZW you cna set the ID(s) in this node or send a messages with your ID(s) in the msg.payload.node_id field.

### Switch Type

This option lets you specify your switch model, and can also be configured by sending a message with the switch type in the msg.payload.switchtype field. This accepts the integer value of the effect paramter(s), and also the switch model (eg. lzw36, LZW31-sn, 8, dimmer, switch, fan).

### Color

Choose a value between 0 and 360 to determine the hue of your notification. This node will automatically convert that value to Inovelli's hue range (0-255), and it also accepts RGB arrays (255,0,0), color names (Red), or hexadecimals (#ff0000) through msg.payload.color. Range 0-360

### Brightness Level

The brightness of your LED Notification, also configurable through msg.payload.brightness. Range: 0-10

### Duration

The duration of your LED Notification. The list provided in the node are some generic values, however you can send several format through msg.payload.duration to be more exact (eg. 2 hours, 4 days, 47 seconds). Range: 1-255.

### Effect Type

Based on your switch choice, choose between Off, Solid, Chase, Fast Blink, Slow Blink, or Pulse. Also configurable through msg.payload.effect.

### Clear Notification

A checkbox to toggle clearing the the current LED Notification, when checked this will clear the current notification for your specified switch. Also configurable by setting msg.payload.clear to a boolean value of true or false.