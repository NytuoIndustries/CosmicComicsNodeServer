// GET THE BACKEND AND FRONT END (BFE) FROM GITHUB RELEASES
const https = require('https');
const fs = require('fs');
const { promisify } = require('util');

const username = 'NytuoIndustries';
const repoFront = 'CosmicComicsReactClient';
const assetNameFront = 'CC_RC.zip';
const extractDestinationFront = './public';

const apiUrlFront = `https://api.github.com/repos/${username}/${repoFront}/releases/latest`;


async function DownloadAsset() {
    console.log('Downloading latest release...');
    for (let i = 0; i < 1; i++) {
        switch (i) {
            case 0:
                await downloadLatestRelease(apiUrlFront);
                if (fs.existsSync(assetNameFront) && fs.statSync(assetNameFront).isFile() && fs.statSync(assetNameFront).size > 0) {
                    unZip(assetNameFront, extractDestinationFront)
                } else {
                    console.log('No file downloaded or file size is 0 (empty)')
                }
                break;
            default:
                console.log('No more releases to download');
                break;
        }
    }
}

async function downloadZipBallFromLatestRelease(URL) {
    const release = await getLatestRelease(URL);
    const zipBallURL = release.zipball_url;
    console.log(`Found release: ${release.tag_name} with zipball URL: ${zipBallURL}`);
    await downloadFile(zipBallURL, assetNameBack);
}

async function downloadLatestRelease(URL) {
    const release = await getLatestRelease(URL);
    console.log(`Found release: ${release.tag_name} with ${release.assets.length} assets`);
    const asset = release.assets.find(asset => asset.name === assetNameFront);
    if (!asset) {
        throw new Error(`Unable to find asset with name ${assetNameFront}`);
    }
    await downloadFile(asset.browser_download_url, assetNameFront);
}

function getLatestRelease(URL) {
    return new Promise((resolve, reject) => {
        https.get(URL, {
            headers: {
                'User-Agent': 'node'
            }
        }, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
    });
}

const downloadFile = async (url, outputPath) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const fileStream = fs.createWriteStream(outputPath);
        const pipeline = promisify(require('stream').pipeline);
        await pipeline(response.body, fileStream);
        console.log(`File downloaded to ${outputPath}`);
    } catch (error) {
        console.error('Error:', error);
    }
};

function unZip(zipName, outputPath) {
    const Seven = require('node-7z');
    const SevenBin = require("7zip-bin");
    const Path27Zip = SevenBin.path7za;
    const myStream = Seven.extractFull(zipName, outputPath, {
        recursive: true,
        $bin: Path27Zip
    });
    myStream.on('end', () => {
        console.log('Extraction done');
        deleteZip(zipName);
    });
}

function deleteZip(zipName) {
    fs.unlink(zipName, (err) => {
        if (err) throw err;
        console.log('successfully deleted');
    });
}

DownloadAsset()