module.exports = function (RED) {
  var convert = require("color-convert");
  function InovelliNotificationCalculator(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    const {
      zwave,
      entityid,
      nodeid,
      color,
      brightness,
      duration,
      effect,
      switchtype,
      clear,
    } = config;

    this.zwave = zwave;
    this.entityid = entityid;
    this.nodeid = parseInt(nodeid, 10);
    this.color = parseInt(color, 10);
    this.brightness = parseInt(brightness, 10);
    this.duration = parseInt(duration, 10);
    this.effect = parseInt(effect, 10);
    this.switchtype = parseInt(switchtype, 10);
    this.clear = clear;

    node.on("input", (msg) => {
      const {
        zwave: presetZwave,
        entityid,
        nodeid,
        color: presetColor,
        brightness: presetBrightness,
        duration: presetDuration,
        effect: presetEffect,
        switchtype: presetSwitchtype,
        clear: presetClear,
      } = node;
      const { payload } = msg;
      const domain = payload.zwave || presetZwave;
      const brightness = payload.brightness || presetBrightness;
      var color = payload.color || presetColor;
      var duration = payload.duration || presetDuration;
      var effect = payload.effect || presetEffect;
      var switchtype = payload.switchtype || presetSwitchtype;
      var clear;
      if (payload.clear === undefined) {
        clear = presetClear;
      } else {
        clear = payload.clear;
      }
      var error = 0;

      var inputSwitchConvert = function (switchtype) {
        if (isNaN(switchtype)) {
          switchtype = switchtype.toLowerCase();
          var switchConvert;
          if (["switch", "lzw30", "lzw30-sn"].includes(switchtype)) {
            switchConvert = 8;
          } else if (["dimmer", "lzw31", "lzw31-sn"].includes(switchtype)) {
            switchConvert = 16;
          } else if (["combo_light", "lzw36_light"].includes(switchtype)) {
            switchConvert = 24;
          } else if (["combo_fan", "lzw36_fan", "fan"].includes(switchtype)) {
            switchConvert = 25;
          } else if (
            ["lzw36", "fan and light", "light and fan"].includes(switchtype)
          ) {
            switchConvert = 49;
          }
          if (switchConvert !== undefined) {
            switchtype = switchConvert;
          } else {
            node.error(`Incorrect Switch Type: ${switchtype}`);
            error++;
          }
        } else if (![8, 16, 24, 25, 49].includes(switchtype)) {
          node.error(`Incorrect Switch Value: ${switchtype}`);
          error++;
        }
        return switchtype;
      };

      var inputColorConvert = function (color) {
        if (Array.isArray(color) && typeof color === "object") {
          if (color.length === 3) {
            rgb = color;
          } else {
            node.error(`Check your RGB values: ${color}`);
            error++;
          }
        } else if (typeof color === "string") {
          if (color.startsWith("#") === true) {
            rgb = convert.hex.rgb(color);
          } else {
            color = color.replace(" ", "").toLowerCase();
            rgb = convert.keyword.rgb(color);
          }
        } else if (typeof color === "number") {
          if (color >= 0 && color <= 360) {
            let conv_hsv = [color, 100, 100];
            rgb = convert.hsv.rgb(conv_hsv);
          } else {
            node.error(`Incorrect Hue Value: ${color}`);
            error++;
          }
        } else {
          node.error(`Incorrect Color: ${color}. Using default color: Red`);
        }
        if (rgb === undefined) {
          node.error(
            `Incorrect Color: ${color}. Using preset color value: ${presetColor}`
          );
          let conv_hsv = [presetColor, 100, 100];
          rgb = convert.hsv.rgb(conv_hsv);
        }
        return rgb;
      };

      var inputBrightnessCheck = function (brightness) {
        if (brightness < 0 || brightness > 11) {
          node.error(
            `Invalid brightness value: ${brightness}. Please enter a value between 0 and 10.`
          );
          error++;
        }
      };

      var inputDurationConvert = function (duration) {
        if (isNaN(duration)) {
          let value = parseInt(duration);
          let unit = duration.replace(/^[\s\d]+/, "").toLowerCase();
          if (
            ["second", "seconds"].includes(unit) &&
            value > 0 &&
            value <= 60
          ) {
            duration = value;
          } else if (
            ["minute", "minutes"].includes(unit) &&
            value > 0 &&
            value <= 60
          ) {
            duration = value + 60;
          } else if (
            ["hour", "hours"].includes(unit) &&
            value > 0 &&
            value <= 134
          ) {
            duration = value + 120;
          } else if (
            ["day", "days"].includes(unit) &&
            value > 0 &&
            value <= 5
          ) {
            duration = value * 24 + 120;
          } else if (["forever", "indefinite", "indefinitely"].includes(unit)) {
            duration = 255;
          } else {
            node.error(`Incorrect Duration Format: ${duration}`);
            error++;
          }
        } else if (duration < 1 || duration > 255) {
          node.error(`Incorrect Duration: ${duration}`);
          error++;
        }
        return duration;
      };

      var inputEffectConvert = function (effect, switchtype) {
        if (isNaN(effect)) {
          effect = effect.toLowerCase();
          const switchOptions = {
            off: 0,
            solid: 1,
            "fast blink": 2,
            "slow blink": 3,
            pulse: 4,
          };
          const dimmerOptions = {
            off: 0,
            solid: 1,
            chase: 2,
            "fast blink": 3,
            "slow blink": 4,
            pulse: 5,
          };
          if (switchtype === 8 && switchOptions[effect] !== undefined) {
            effect = switchOptions[effect];
          } else if (
            [16, 24, 25, 49].includes(switchtype) &&
            dimmerOptions[effect] !== undefined
          ) {
            effect = dimmerOptions[effect];
          } else {
            node.error(`Incorrect Effect: ${effect}`);
            error++;
          }
        } else if (![0, 1, 2, 3, 4, 5].includes(effect)) {
          node.error(`Incorrect Effect: ${effect}`);
          error++;
        }
        return effect;
      };

      switchtype = inputSwitchConvert(switchtype);
      color = inputColorConvert(color);
      inputBrightnessCheck(brightness);
      duration = inputDurationConvert(duration);
      effect = inputEffectConvert(effect, switchtype);

      sendNotification = function (domain, service, id, switchtype, value) {
        var parameter = switchtype;
        if (parameter === 49) {
          for (parameter = 24; parameter < 26; parameter++) {
            node.send({
              payload: {
                domain,
                service,
                data: { ...id, parameter, value },
              },
            });
          }
        } else {
          node.send({
            payload: {
              domain,
              service,
              data: { ...id, parameter, value },
            },
          });
        }
      };

      if (error === 0) {
        const hsl = convert.rgb.hsl(color);
        const keyword = convert.rgb.keyword(color);
        const hue = parseInt((hsl[0] * (17 / 24)).toFixed(0));
        var value =
          hue + brightness * 255 + duration * 65536 + effect * 16777216;
        var service, id;
        switch (domain) {
          case "zwave_js":
            const entityId = payload.entity_id || entityid;
            id = entityId ? { entity_id: entityId } : {};
            service = "bulk_set_partial_config_parameters";
            switch (clear) {
              case true:
                value = 65536;
                node.status(`Cleared notification!`);
                break;
              case false:
                node.status(`Sent Color: ${keyword}`);
                break;
            }
            break;
          case "ozw":
            const nodeId = payload.node_id || nodeid;
            id = nodeId ? { node_id: nodeId } : {};
            service = "set_config_parameter";
            switch (clear) {
              case true:
                value = 0;
                node.status(`Cleared notification!`);
                break;
              case false:
                node.status(`Sent Color: ${keyword}`);
                break;
            }
            break;
        }
        sendNotification(domain, service, id, switchtype, value);
      } else {
        node.status(`Error! Check debug window for more info`);
      }
    });
  }
  RED.nodes.registerType(
    "inovelli-notification-calculator",
    InovelliNotificationCalculator
  );
};
