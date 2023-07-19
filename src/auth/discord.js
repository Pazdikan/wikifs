const DiscordOauth2 = require("discord-oauth2");
const { Router } = require("express");
const config = require("../settings");
const router = Router();

router.get("/discord", (req, res) => {
  const oauth2 = new DiscordOauth2();
  const url = oauth2.generateAuthUrl({
    clientId: config.authentication.discord.id,
    scope: ["identify", "email"],
    redirectUri: config.url() + "/api/auth/discord/callback",
  });

  res.redirect(url);
});

router.get("/discord/callback", async (req, res) => {
  const oauth2 = new DiscordOauth2();
  try {
    const tokenData = await oauth2.tokenRequest({
      clientId: config.authentication.discord.id,
      clientSecret: config.authentication.discord.secret,
      code: req.query.code,
      grantType: "authorization_code",
      scope: ["identify"],
      redirectUri: config.url() + "/api/auth/discord/callback",
    });

    const user = await oauth2.getUser(tokenData.access_token);

    if (config.authentication.permitted.includes(user.email)) {
      req.session.user = user;

      const redirectTo = req.session.redirectTo || "/";
      res.redirect(redirectTo);
    } else {
      res.status(401).send({
        message: "Unauthorized",
      });
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
