// ================= BOTIFY - DYNAMIC TEMPLATE SENDER =================
// Used by WhatsApp Marketing (bulk). Takes the template name entered by the
// user on the Marketing screen. It now shares ONE sender with the lead
// messages (utils/botifyWhatsapp.js) so both behave identically:
// cleaned env values, template-name normalising, parameter cleaning,
// body-level failure detection, timeout and full error logging.
//
// returns { ok: boolean, error?: string, data?: any }

const { sendBotifyTemplate } = require("./botifyWhatsapp");

const sendTemplate = async ({
  phone,
  templateName,
  templateData = [],
  category,
}) => {
  const result = await sendBotifyTemplate({
    phone,
    templateName,
    templateData,
    category,
  });

  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
};

module.exports = { sendTemplate };