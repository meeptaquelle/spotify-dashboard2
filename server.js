require("dotenv").config();

const express = require("express");

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
});



const crypto = require("crypto");

app.get("/auth/login", (req, res) => {
    const state = crypto.randomBytes(16).toString("hex");

    const scope = "user-top-read";

    const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        state,
    });

    res.redirect(
        `https://accounts.spotify.com/authorize?${params.toString()}`
    );
});
app.get("/api/top-tracks", async (req, res) => {
    try {
        const accessToken = await getAccessToken();

        const response = await fetch(
            "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        const tracks = data.items.map((track) => ({
            name: track.name,
            artist: track.artists.map((artist) => artist.name).join(", "),
            album: track.album.name,
            image: track.album.images[0]?.url ?? null,
            spotifyUrl: track.external_urls.spotify,
        }));

        res.json(tracks);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch Spotify data",
        });
    }
});
async function getAccessToken() {
    const response = await fetch(
        "https://accounts.spotify.com/api/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization":
                    "Basic " +
                    Buffer.from(
                        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
                    ).toString("base64"),
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(JSON.stringify(data));
    }

    return data.access_token;
}

app.get("/auth/callback", async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.status(400).send(`Spotify authorization failed: ${error}`);
    }

    if (!code) {
        return res.status(400).send("No authorization code.");
    }

    const response = await fetch(
        "https://accounts.spotify.com/api/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization":
                    "Basic " +
                    Buffer.from(
                        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
                    ).toString("base64"),
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
            }),
        }
    );

    const data = await response.json();

    console.log("AQCsrjC_SaTT-HR3dH-Uq_inw--mC5Sytnx7iF2ypFqDrLVWDyIMwQEYEjp9OxkFIvEO2fuGYpeuzAt6opWaKEx74tcK_PCvyihJLoBFKDb2_gEM8MMz7HhZWVy0Xm0y1gM");
    console.log(data.refresh_token);


    res.send("Authorization successful. Check your terminal.");

});
app.use(express.static("public"));