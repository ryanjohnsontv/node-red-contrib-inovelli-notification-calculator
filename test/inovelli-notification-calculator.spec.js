var helper = require("node-red-node-test-helper");
var assert = require("assert");
var statusNode = require("../../node-red-contrib-inovelli-test/inovelli-notification-calculator");

helper.init(require.resolve("node-red"));

describe("inovelli-notification-calculator node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    var flow = [
      {
        id: "n1",
        type: "inovelli-notification-calculator",
        name: "inovelli-notification-calculator",
      },
    ];
    helper.load(statusNode, flow, function () {
      var n1 = helper.getNode("n1");
      assert.equal(n1.name, "inovelli-notification-calculator");
      done();
    });
  });

  it("should always send parameter of 8", function (done) {
    var flow = [
      {
        id: "n1",
        type: "inovelli-notification-calculator",
        name: "inovelli-notification-calculator",
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(statusNode, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        assert.equal(msg.payload.data && msg.payload.data.parameter, 8);
        done();
      });
      n1.receive({ payload: {} });
    });
  });

  it("should allow setting of all the status properties from the receiving payload", function (done) {
    var flow = [
      {
        id: "n1",
        type: "inovelli-notification-calculator",
        name: "inovelli-notification-calculator",
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(statusNode, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        assert.equal(msg.payload.data.node_id, 20);
        done();
      });
      n1.receive({
        payload: {
          nodeId: 20,
          color: 1,
          duration: 10,
          effect: 1,
          brightness: 10,
          switchtype: 8,
        },
      });
    });
  });
});
