var presence = require('./misc/presence.js');
class youtube {
    constructor(musicEnabled, videosEnabled, updateInterval, superPresence) {

        presence = superPresence;
        main(musicEnabled, videosEnabled);
        setInterval(() => { main(musicEnabled, videosEnabled); }, updateInterval * 1000); // 1000 ms = 1 second
    }
}
module.exports = youtube;

const fetch = require('node-fetch');
const { Innertube, UniversalCache } = require('youtubei.js');

const sharp = require("sharp");
const { encode } = require("blurhash");

const encodeImageToBlurhash = async (url) => {
    try {
        // Fetch the image from the URL
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
        }
        const buffer = await response.buffer();

        // Process the image using sharp
        const { data, info } = await sharp(buffer)
            .raw()
            .ensureAlpha()
            .resize(32, 32, { fit: 'inside' })
            .toBuffer({ resolveWithObject: true });

        // Encode the processed image to BlurHash
        const blurHash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
        return blurHash;
    } catch (error) {
        throw new Error(`Failed to encode image to BlurHash: ${error.message}`);
    }
};

var yt;
async function main(musicEnabled, videosEnabled) {
    // You may want to create a persistent cache instead (on Node and Deno).
    yt = await Innertube.create({
        cache: new UniversalCache(
            // Enables persistent caching
            true,
            // Path to the cache directory. The directory will be created if it doesn't exist
            './modules/.cache'
        )
    });

    // 'auth-pending' is fired with the info needed to sign in via OAuth.
    yt.session.on('auth-pending', (data) => {
        console.log("\x1b[34m", `[YOUTUBE] Go to ${data.verification_url} in your browser and enter code ${data.user_code} to authenticate.`);
    });

    // 'auth' is fired once the authentication is complete
    yt.session.on('auth', ({ credentials }) => {
        console.log("\x1b[34m", `[YOUTUBE] Sign in successful!`);
    });

    // 'update-credentials' is fired when the access token expires, if you do not save the updated credentials any subsequent request will fail 
    yt.session.on('update-credentials', async ({ credentials }) => {
        console.log("\x1b[34m", `[YOUTUBE] Credentials updated!`);
        await yt.session.oauth.cacheCredentials();
    });


    // Attempt to sign in
    await yt.session.signIn();

    // You may cache the session for later use
    // If you use this, the next call to signIn won't fire 'auth-pending' instead just 'auth'.
    await yt.session.oauth.cacheCredentials();

    // ... do something after sign in and caching credentials
    if (musicEnabled) {
        await fetchYTMusicData();
    }
    if (videosEnabled) {
        await fetchYTVideoData();
    }
}

var vTitle, vChannel, vUrl, vThumbnail, vDate, mTitle, mArtist, mUrl, mThumbnail, mDate;
function patchPresenceMusic() {
    encodeImageToBlurhash(mThumbnail)
        .then(hash => {
            console.log("\x1b[31m", "[NETFLIX] Successfully generated blurhash: " + String(hash));
            presence.patchYouTubeMusic(String(mTitle), String(mArtist), String(mUrl), String(mThumbnail), String(hash), (mDate));
        })
        .catch(error => {
            console.error("\x1b[31m", "[NETFLIX] I failed miserably gereating the blurhash. mb fam- " + error)
            presence.patchYouTubeMusic(String(mTitle), String(mArtist), String(mUrl), String(mThumbnail), undefined, (mDate));
        });
}

function patchPresenceVideo() {
    encodeImageToBlurhash(vThumbnail)
        .then(hash => {
            console.log("\x1b[31m", "[NETFLIX] Successfully generated blurhash: " + String(hash));
            presence.patchYouTubeVideo(String(vTitle), String(vChannel), String(vUrl), String(vThumbnail), String(hash), (vDate));
        })
        .catch(error => {
            console.error("\x1b[31m", "[NETFLIX] I failed miserably gereating the blurhash. mb fam- " + error)
            presence.patchYouTubeVideo(String(vTitle), String(vChannel), String(vUrl), String(vThumbnail), undefined, (vDate));
        });
}

async function fetchYTMusicData() {
    try {
        var lastSong = await getLatestYTMusicSong()
        lastStreamURL = getLatestYTMusicURL(lastSong)


        if (lastStreamURL == presence.getYouTubeMusicURL()) {
            console.log("\x1b[34m", `[YOUTUBE] No new song was played`)
        }
        else {

            mTitle = getLatestYTMusicName(lastSong)
            mArtist = getLatestYTMusicArtist(lastSong)
            mUrl = lastStreamURL
            mThumbnail = await getLatestYTMusicThumbnail(lastSong)
            mDate = Date.now()
            patchPresenceMusic()

            console.log("\x1b[34m", `[YOUTUBE] A new song was played and saved`)
        }

    } catch (error) {
        console.log("\x1b[34m", `[YOUTUBE] Something went wrong trying to fetch the latest YTMusic Song: `)
        console.log(error)
    }
}

async function fetchYTVideoData() {
    try {
        var lastVideo = await getLatestYTVideo();
        if (lastVideo.videoURL == presence.getYouTubeVideoURL()) {
            console.log("\x1b[34m", `[YOUTUBE] No new video was played`)
        }
        else {
            vTitle = lastVideo.videoName
            vUrl = lastVideo.videoURL
            vThumbnail = lastVideo.videoThumbnailURL
            vChannel = lastVideo.videoChannel
            vDate = Date.now()
            patchPresenceVideo();

            console.log("\x1b[34m", `[YOUTUBE] A new video was played and saved`)
        }
    } catch (error) {
        console.log("\x1b[34m", `[YOUTUBE] Something went wrong trying to fetch the latest YouTube Video: `)
        console.log(error)
    }
}


//YTMusic API functions
async function getLatestYTMusicSong() {
    return await yt.actions.execute('/browse', { client: 'YTMUSIC', browseId: 'FEmusic_history', parse: true });

}

function getLatestYTMusicName(history) {
    return history.contents_memo.get("MusicResponsiveListItem")[0].title
}

function getLatestYTMusicArtist(history) {
    var artists;
    //check if there are multiple artists by checking if the object artists exists
    //if it does not exist, the object is called authors

    //here the function .isArray() is used to check if the object is an array.
    //the function also returns false if the object does not exist wich is perfect for this case
    if (Array.isArray(history.contents_memo.get("MusicResponsiveListItem")[0].artists)) {
        var length = history.contents_memo.get("MusicResponsiveListItem")[0].artists.length
        for (let i = 0; i < length; i++) {
            if (i == 0) {
                artists = history.contents_memo.get("MusicResponsiveListItem")[0].artists[i].name
            }
            else {
                artists = artists + " & " + history.contents_memo.get("MusicResponsiveListItem")[0].artists[i].name
            }
        }
    } else {
        try {
            artists = history.contents_memo.get("MusicResponsiveListItem")[0].authors.name
        } catch (error) {
            artists = "Unknown"
        }
    }
    if (artists == "Unknown" || artists == undefined) {
        try {
            artists = history.contents_memo.get("MusicResponsiveListItem")[0].flex_columns[1].title.text
        } catch (error) {
            artists = "Unknown"
        }
    }
    return artists;
}

function getLatestYTMusicURL(history) {
    return "https://music.youtube.com/watch?v=" + history.contents_memo.get("MusicResponsiveListItem")[0].id
}

//go through all possible thumbnail urls (sorted by quality descending) and return the first one that is not the default thumbnail
async function getLatestYTMusicThumbnail(history) {
    return new Promise((async (res) => {
        const videoId = history.contents_memo.get("MusicResponsiveListItem")[0].id
        const thumbnailURLs = [
            "https://i.ytimg.com/vi/" + videoId + "/maxresdefault.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/hq720.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/sddefault.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/sd1.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/sd2.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/sd3.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/hq1.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/hq2.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/hq3.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/mqdefault.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/mq1.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/mq2.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/mq3.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/default.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/1.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/2.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/3.jpg",
            "https://i.ytimg.com/vi/" + videoId + "/0.jpg"
        ]

        await intialFetchOfDefaultThumbnail();
        for (let i = 0; i < thumbnailURLs.length; i++) {
            try {
                if (await isNotDefault(thumbnailURLs[i])) {
                    console.log("\x1b[34m", `[YOUTUBE] Best thumbnail found: ` + i);
                    return res(thumbnailURLs[i]);
                }
            } catch (error) {
                return res("https://img.youtube.com/vi/0/maxresdefault.jpg");
            }
        }
        return res("https://img.youtube.com/vi/0/maxresdefault.jpg");
    }
    ))
}

var defaultThumbnailUnit8Array;

function intialFetchOfDefaultThumbnail() {
    return new Promise(async (finish) => {
        const defaultResponse = await fetch("https://i.ytimg.com/vi/vi/0/maxresdefault.jpg"); //TODO: only fetch once (or once per iteration)
        const defaultBuffer = await defaultResponse.arrayBuffer();
        defaultThumbnailUnit8Array = new Uint8Array(defaultBuffer);
        finish();
    })
}

function isNotDefault(url) { //get the uint8Array buffer and compare it to the default buffer string ("lorem ipsum")
    return new Promise(async (res) => {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        res(uint8Array.toString() != defaultThumbnailUnit8Array.toString())
    })
}
//End of YTMusic API functions

//YT API functions
async function getLatestYTVideo() {
    var ythistory = await yt.getHistory();
    var videoName;
    var videoURL;
    var videoThumbnailURL;
    var videoChannel;

    //console.log(ythistory.sections[0].contents[1])


    return new Promise((res) => {

        if (ythistory.sections[0].contents[0].type == "ReelShelf") {
            videoName = ythistory.sections[0].contents[1].title.runs[0].text
            videoURL = "https://www.youtube.com/watch?v=" + ythistory.sections[0].contents[1].id
            videoThumbnailURL = ythistory.sections[0].contents[1].thumbnails[0].url
            videoChannel = ythistory.sections[0].contents[1].author.name
            return res({ videoName, videoURL, videoThumbnailURL, videoChannel })
        }
        else {
            videoName = ythistory.sections[0].contents[0].title.runs[0].text
            videoURL = "https://www.youtube.com/watch?v=" + ythistory.sections[0].contents[0].id
            videoThumbnailURL = ythistory.sections[0].contents[0].thumbnails[0].url
            videoChannel = ythistory.sections[0].contents[0].author.name
            return res({ videoName, videoURL, videoThumbnailURL, videoChannel })
        }
    })
}
//End of YT API functions