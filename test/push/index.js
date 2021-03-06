const expect = require('chai').expect;
const axios = require('axios');
const mobileServices = require('../../config/mobile-services');
const sender = require("unifiedpush-node-sender");

describe('Push', function () {
  this.timeout(0);

  // skip push tests in ios
  if (process.env.MOBILE_PLATFORM === "ios") {
    return;
  }

  let upsUrl;
  let pushApplicationID;
  let masterSecret;

  before("create ups application", async () => {
    const serverKey = process.env.FIREBASE_SERVER_KEY;
    const senderId = process.env.FIREBASE_SENDER_ID;

    if (serverKey === undefined || senderId == undefined) {
      throw new Error("FIREBASE_SERVER_KEY and/or FIREBASE_SENDER_ID are not defined")
    }

    const config = mobileServices.services.find(service => service.name === 'ups');

    upsUrl = config.url;

    // set sender id in config
    config.config.android.senderId = senderId;

    // create test application
    const application = await axios({
      method: 'post',
      url: `${upsUrl}/rest/applications`,
      data: {
        name: "test",
      },
    });
    pushApplicationID = application.data.pushApplicationID;
    masterSecret = application.data.masterSecret;

    // create android variant
    const variant = await axios({
      method: 'post',
      url: `${upsUrl}/rest/applications/${pushApplicationID}/android`,
      data: {
        name: "android",
        googleKey: serverKey,
        projectNumber: senderId,
      },
    });

    // set variant and secret in config
    config.config.android.variantId = variant.data.variantID;
    config.config.android.variantSecret = variant.data.secret;
  })

  after("delete ups application", async () => {

    // delete test application
    await axios({
      method: "delete",
      url: `${upsUrl}/rest/applications/${pushApplicationID}`
    });
  })

  it('send and receive test notification', async function () {

    // register the app to the UPS server 
    await client.executeAsync((config, done) => {
      const { agPush, agApp } = window.aerogear;
      const { init } = agApp;
      const { PushRegistration } = agPush;

      const app = init(config);

      const push = window.PushNotification.init({
        android: {},
        ios: {},
      });

      push.on('registration', data => {

        const push = new PushRegistration(app.config);

        push.register(data.registrationId, "alias")
          .then(() => {
            done();
          }).catch(e => {
            throw e;
          });
      });

      push.on("error", e => {
        throw e;
      });

      window.push = push;
    }, mobileServices);

    // start listening for notifications
    const message = client.executeAsync((done) => {
      const push = window.push;

      push.on("notification", (notification) => {
        done(notification.message);
      });

      push.on("error", e => {
        throw e;
      })
    });

    // send test notification
    sender({
      url: upsUrl,
      applicationId: pushApplicationID,
      masterSecret: masterSecret,
    }).then(client => {
      client.sender.send({ alert: "test" }, { criteria: { alias: ["alias"] } });
    });

    // wait for the notification
    expect(await message).to.equal("test");
  });
});
