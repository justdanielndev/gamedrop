import fetch from 'node-fetch';

export default async ({ req, res, log, error }) => {
  try {
    let bodyData = req.body;
    if (typeof req.body === 'string') {
      try {
        bodyData = JSON.parse(req.body);
      } catch (e) {
      }
    }

    const userId = bodyData?.userId || req.query?.userId;
    
    if (!userId) {
      return res.json({
        ok: false,
        error: 'Missing userId parameter'
      }, 400);
    }

    const slackToken = process.env.SLACK_BOT_TOKEN;
    
    if (!slackToken) {
      error('SLACK_BOT_TOKEN not configured');
      return res.json({
        ok: false,
        error: 'Slack token not configured'
      }, 500);
    }

    const response = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
      headers: {
        'Authorization': `Bearer ${slackToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!data.ok) {
      error(`Slack API error: ${data.error}`);
      return res.json({
        ok: false,
        error: data.error || 'Failed to fetch user info'
      }, 400);
    }

    const profile = data.user?.profile;
    const avatar = {
      image_24: profile?.image_24,
      image_32: profile?.image_32,
      image_48: profile?.image_48,
      image_72: profile?.image_72,
      image_192: profile?.image_192,
      image_512: profile?.image_512,
      image_original: profile?.image_original
    };

    return res.json({
      ok: true,
      avatar,
      displayName: data.user?.profile?.display_name || data.user?.real_name,
      realName: data.user?.real_name
    });

  } catch (err) {
    error(`Error: ${err.message}`);
    return res.json({
      ok: false,
      error: err.message
    }, 500);
  }
};
