type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

export async function verifyAccessToken(accessToken: string): Promise<LineProfile> {
  // Verify token
  const verifyRes = await fetch(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!verifyRes.ok) {
    throw new Error("Invalid LINE access token");
  }

  const verifyData = await verifyRes.json();

  const channelId = process.env.LINE_CHANNEL_ID;
  if (channelId && verifyData.client_id !== channelId) {
    throw new Error("Token channel ID mismatch");
  }

  // Get profile
  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileRes.ok) {
    throw new Error("Failed to get LINE profile");
  }

  const profile = await profileRes.json();

  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
  };
}
