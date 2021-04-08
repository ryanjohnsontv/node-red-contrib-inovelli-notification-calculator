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
    } = config;

    this.zwave = zwave;
    this.entityid = entityid;
    this.nodeid = parseInt(nodeid, 10);
    this.color = parseInt(color, 10);
    this.brightness = parseInt(brightness, 10);
    this.duration = parseInt(duration, 10);
    this.effect = parseInt(effect, 10);
    this.switchtype = parseInt(switchtype, 10);

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
      } = node;
      const { payload } = msg;
      const zwave = payload.zwave || presetZwave;
      const brightness = payload.brightness || presetBrightness;
      var color = payload.color || presetColor;
      var duration = payload.duration || presetDuration;
      var effect = payload.effect || presetEffect;
      var switchtype = payload.switchtype || presetSwitchtype;
      var error = 0;

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

      var inputSwitchConvert = function (switchtype) {
        if (isNaN(switchtype)) {
          switchtype = switchtype.toLowerCase();
          const switchType = {
            switch: 8,
            dimmer: 16,
            combo_light: 24,
            combo_fan: 25,
          };
          let switchConvert = switchType[switchtype];
          if (switchConvert !== undefined) {
            switchtype = switchConvert;
          } else {
            node.error(`Incorrect Switch Type: ${switchtype}`);
            error++;
          }
        } else if (![8, 16, 24, 25].includes(switchtype)) {
          node.error(`Incorrect Switch Value: ${switchtype}`);
          error++;
        }
        return switchtype;
      };

      var inputDurationConvert = function (duration) {
        if (isNaN(duration)) {
          let value = parseInt(duration);
          let unit = duration.replace(/^[\s\d]+/, "").toLowerCase();
          if (
            ["second", "seconds"].includes(unit) &&
            value >= 0 &&
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
          } else if (["off", "silent"].includes(unit)) {
            duration = 0;
          } else {
            node.error(`Incorrect Duration Format: ${duration}`);
            error++;
          }
        } else if (duration < 0 || duration > 255) {
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
            [16, 24, 25].includes(switchtype) &&
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
      inputColorConvert(color);
      duration = inputDurationConvert(duration);
      effect = inputEffectConvert(effect, switchtype);

      const hsl = convert.rgb.hsl(rgb);
      const keyword = convert.rgb.keyword(rgb);
      color = parseInt((hsl[0] * (17 / 24)).toFixed(0));
      if (error === 0) {
        switch (zwave) {
          case "zwave_js":
            const entityId = payload.entity_id || entityid;
            const entity_id = entityId ? { entity_id: entityId } : {};
            const color_value = color ? { 255: color } : {};
            const brightness_value = brightness ? { 65280: brightness } : {};
            const duration_value = duration ? { 16711680: duration } : {};
            const effect_value = effect ? { 2130706432: effect } : {};
            node.send({
              ...msg,
              payload: {
                domain: zwave,
                service: "bulk_set_partial_config_parameters",
                data: {
                  ...entity_id,
                  parameter: switchtype,
                  value: {
                    ...color_value,
                    ...brightness_value,
                    ...duration_value,
                    ...effect_value,
                  },
                },
              },
            });
            break;
          case "ozw":
            const value =
              color + brightness * 255 + duration * 65536 + effect * 16777216;
            const nodeId = payload.node_id || nodeid;
            const node_id = nodeId ? { node_id: nodeId } : {};
            node.send({
              ...msg,
              payload: {
                domain: zwave,
                service: "set_config_parameter",
                data: { ...node_id, parameter: switchtype, value },
              },
            });
            break;
        }
        node.status({ text: `Sent color: ${keyword}` });
      } else {
        node.status({ text: `Error! Check debug window for more info` });
      }
    });
  }
  RED.nodes.registerType("inovelli-notification-calculator", InovelliNotificationCalculator);
};
