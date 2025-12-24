import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { grabSongInfo, modifySets, modifyDiffs, updateAllMaps } from './mapupdate.js';

dotenv.config();

const app = express();

app.listen(3333, () => {
    console.log(`\x1b[45myuru.ca server\x1b[0m - currently listening on port 3333~`);
    console.log(`\x1b[45myuru.ca server\x1b[0m - launched from ${path.resolve()}`);
    initialize();
});
app.use(cors());
app.use(express.json());
app.use(express.static('page/assets/')); //serves the assets for the api page ^-^
app.use(express.urlencoded({ extended: true }));

var mapStatusSydney;
var mapStatusLilac;
function refreshMapStatuses() {
    mapStatusSydney = JSON.parse(fs.readFileSync('./assets/sydneygds.json', 'utf8'));
    mapStatusLilac = JSON.parse(fs.readFileSync('./assets/lilacgds.json', 'utf8'));
}

refreshMapStatuses(); //initializes map statuses, in this case~

let refreshInterval = process.env.UPDATE_EVERY? parseInt(process.env.UPDATE_EVERY) : 12;
async function initialize() {
    setInterval(async () => {
        console.log(`Automatically updating all maps...`);
        await updateAllMaps('sydney', mapStatusSydney);
        await updateAllMaps('lilac', mapStatusLilac);
        refreshMapStatuses();
    }, refreshInterval*1000*60*60); //autoupdateEvery is in hours, so we're converting to ms for setInterval to be happy
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get('/', (req, res) => { //serves the basic api webpage~
    res.sendFile(__dirname+'/page/index.html');
});

function filterSearchResults(data: any, query: string, type: string) { //this could be a gd or a map
    let filteredData;
    
    if (type === 'gd') {
        //gds should filter by title, diffname, host, and bns
        //bns was too buggy for now, so i removed it >_>
        //(map.bns.findIndex((bn) => bn.includes(query)) !== -1)
        filteredData = data.filter((map) => 
            map.title.toLowerCase().includes(query) 
        || map.artist.toLowerCase().includes(query) 
        || map.maps.some((diff) => diff.diffname.toLowerCase().includes(query))
        || map.creator.toLowerCase().includes(query));
    } else {
        //sets should filter by title and creator (that's all that really is practical)
        filteredData = data.filter((map) => 
            map.title.toLowerCase().includes(query) 
        || map.artist.toLowerCase().includes(query)
        || map.creator.toLowerCase().includes(query));
    }
    
    return filteredData;
}

app.get('/gds', (req, res) => { //sends back the gd info we have stored
    let person = req.query.person;
    let query = req.query.search;
    let gdInfo;

    if (person === 'sydney' || person === 'syd') {
        gdInfo = JSON.parse(fs.readFileSync('./assets/sydneygds.json', 'utf-8'));
        if (query) {
            res.send(filterSearchResults(gdInfo, query, 'gd'));
        } else {
            res.send(gdInfo);
        }
    } else if (person === 'lilac') {
        gdInfo = JSON.parse(fs.readFileSync('./assets/lilacgds.json', 'utf-8'))
        if (query) {
            res.send(filterSearchResults(gdInfo, query, 'gd'));
        } else {
            res.send(gdInfo);
        }
    } else {
        res.send('no person specified >_<;;');
    }
});

app.get('/sets', (req, res) => { //sends back set info we have stored c:
    let query = req.query.search;
    let sets = JSON.parse(fs.readFileSync('./assets/sets.json', 'utf-8'));

    if (query) {
        res.send(filterSearchResults(sets, query, 'set'));
    } else {
        res.send(sets);
    }
});

app.get('/lastfm', async(req, res) => {
    let isKanojo = req.query.isKanojo ?? false;
    try {
        let songInfo;
        if (isKanojo) {
            songInfo = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=meowpurrmrrp&api_key=${process.env.LAST_FM_KEY}&format=json&limit=1`);
        } else {
            songInfo = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=yurukyan&api_key=${process.env.LAST_FM_KEY}&format=json&limit=1`);
        }
        res.send(await songInfo.json());
    } catch (err) {
        console.log(err.message);
        res.send(err.message);
    }
});

app.get('/newMapData', async(req, res) => {
    let beatmapId = req.query.beatmapId;
    let beatmapsetId = req.query.beatmapsetId;

    if (beatmapId && !beatmapsetId) {
        let songInfo = await grabSongInfo(beatmapId, "beatmap");
        res.send(songInfo);
    } else if (!beatmapId && beatmapsetId) {
        let songInfo = await grabSongInfo(beatmapsetId, "beatmapset");
        res.send(songInfo);
    } else {
        res.send('invalid beatmap or beatmapset id provided >_<;;')
    }
});

/* this route requires yuru.ca authentication */
app.post('/changeInfo', (req, res) => {
    let key = req.headers["authorization"];
    let type = req.query.type;
    let data = req.body;
    let person;

    if (key === process.env.VALID_ACCESS_KEY) {
        switch (type) {
            case 'setadd':
                modifySets(data, true);
                break;
            case 'diffadd':
                person = req.query.person;
                modifyDiffs(data, true, person);
                break;
            case 'setedit':
                modifySets(data, false);
                break;
            case 'diffedit':
                person = req.query.person;
                modifyDiffs(data, false, person);
                break;
        }
        res.send('successfully changed info~');
    } else {
        res.send(`invalid key!! this likely means you aren't supposed to be messing with this... >_<;;`);
    }
});

function parseDate(timestamp: number) {
    let days = Math.floor(timestamp/(1000*60*60*24));
    let hours = Math.floor(timestamp/(1000*60*60)) - days*24;
    let minutes = Math.floor(timestamp/(1000*60)) - days*24*60 - hours*60;
    return {
        days,
        hours,
        minutes
    }
}

function constructAlterInfo(apiData: any, imaTs: number, limitTs: number, memberMap: Map<string, string>, isHistory: boolean) {
    let alterInfo: alter[] = [];
    let checkTs = imaTs; //starting from the top, working our way down until we hit limitTs - checkTs will always be bigger than currentFrontTs
    let totalTotal = 0;

    for (let i = 0; i < apiData.length; i++) {
        let currentFrontTs = new Date(apiData[i].timestamp).getTime();
        let alterIndex = alterInfo.findIndex(e => e.id  === apiData[i].members[0]); //finding which alter this switch is related to
        let frontDuration = checkTs-currentFrontTs;

        if (alterIndex === -1) { //if the alter isn't tracked yet, then we add them here~
            let memberName = memberMap.get(apiData[i].members[0]) ?? '(no fronter)';
            if (!isHistory) {
                alterInfo.push({
                    name: memberName,
                    id: apiData[i].members[0],
                    fronting: false,
                    totalFrontTime: frontDuration,
                    lastFrontTime: frontDuration,
                    lastFrontTimestamp: new Date(currentFrontTs),
                    percent: -1
                });
            } else { //reduced if we are sending back frontHistory
                alterInfo.push({
                    name: memberName,
                    id: apiData[i].members[0],
                    fronting: false,
                    totalFrontTime: frontDuration,
                    percent: -1,
                    frontHistory: [{timestamp: currentFrontTs, length: frontDuration}],
                    firstAppearance: currentFrontTs
                });
            }
            totalTotal = totalTotal + frontDuration;
        } else {
            if (i < apiData.length-1) {
                alterInfo[alterIndex].totalFrontTime = alterInfo[alterIndex].totalFrontTime + frontDuration;
                totalTotal = totalTotal + frontDuration;
            } else { //on the last one, we need to add in additional time~ but not the whole duration of the front c:
                alterInfo[alterIndex].totalFrontTime = alterInfo[alterIndex].totalFrontTime + (imaTs - limitTs - totalTotal); //extra time to limit
            }
            if (isHistory) {
                alterInfo[alterIndex].frontHistory!.push({timestamp: currentFrontTs, length: frontDuration});
                alterInfo[alterIndex].firstAppearance = currentFrontTs;
            }
        }

        if (i === 0) {
            alterInfo[0].fronting = true; //if we're at the very start, we know the first person is fronting :p
        }
        checkTs = currentFrontTs;
    }

    for (let i = 0; i < alterInfo.length; i++) {
        alterInfo[i].percent = Math.round(alterInfo[i].totalFrontTime/(imaTs-limitTs)*100);
        if (!isHistory) { alterInfo[i].lastFrontTimes = parseDate(alterInfo[i].lastFrontTime!); }
        alterInfo[i].totalFrontTimes = parseDate(alterInfo[i].totalFrontTime);
    }

    return alterInfo;
}

const pluralkitEndpoint = "https://api.pluralkit.me/v2";
const systemId = "ytcvss";

app.get('/recentFronts', async(req, res) => {
    let limitDays = req.query.days ?? 30;
    let imaTs = new Date().getTime(); //ts as in timestamp :p i'm sick of looking at the word timestamp bro..
    let limitTs = imaTs - limitDays*1000*60*60*24;
    let memberMap = new Map([
        ['ckccgs', 'sydney'],
        ['tfprjx', 'lilac'],
        ['yaangx', 'hazel'],
        ['ayaxfc', 'may']
    ]);

    try {
        let apiResp = await fetch(`${pluralkitEndpoint}/systems/${systemId}/switches`); //unfortunately can't access after= with api, have to get all 100 switches from the past however long ago
        let parsedResp = await apiResp.json();

        //cutting off the array to just how long ago we want c:
        let foundDate = false;
        let j = 0;
        while (!foundDate && j < parsedResp.length) {
            if (new Date(parsedResp[j].timestamp).getTime() < limitTs) {
                foundDate = true;
                parsedResp.splice(j+1, parsedResp.length-j+1);
            }
            j++;
        }

        let alterInfo = constructAlterInfo(parsedResp, imaTs, limitTs, memberMap, false);

        for (const [alterId, alterName] of memberMap) { //checking to see if any of our core members haven't fronted in the last 30 days
            let alterIndex = alterInfo.findIndex(alter => alter.name === alterName);
            if (alterIndex === -1) { //if we encounter an alter that isn't there (:OO)
                let frontData = JSON.parse(fs.readFileSync('./assets/switches.json', 'utf-8'));
                let lastFrontIndex = frontData.findIndex(front => front.members[0] === alterId);

                alterInfo.push({
                    name: alterName,
                    id: alterId,
                    fronting: false,
                    totalFrontTime: 0,
                    lastFrontTime: 0,
                    lastFrontTimestamp: new Date(frontData[lastFrontIndex].timestamp),
                    percent: 0 //zettai 0%, since they have no fronts in the past 30 days
                })
            }
        }

        res.send(alterInfo);
    } catch (err) {
        console.log(err.message);
        res.send(err.message);
    }
});

app.get('/frontData', async(req, res) => {
    let startPeriod = new Date().getTime();
    let frontData;
    let endPeriod;
    let customSystemId = req.query.id ?? systemId;
    let memberMap = new Map([
        ['ckccgs', 'sydney'],
        ['tfprjx', 'lilac'],
        ['yaangx', 'hazel'],
        ['ayaxfc', 'may']
    ]);

    let alterInfo;

    try {
        if (customSystemId === systemId) {
            frontData = JSON.parse(fs.readFileSync('./assets/switches.json', 'utf-8'));
            endPeriod = new Date(frontData[frontData.length-1].timestamp).getTime();

            //before we make our alter info object, we need to make sure our pk data is up to date~
            //whether we get 1 or 100 switches doesn't really seem to matter too much? so we'll just fetch and add in the extra we find, if any
            let apiResp = await fetch(`${pluralkitEndpoint}/systems/${customSystemId}/switches`);
            let parsedResp = await apiResp.json();

            let foundSameSwitch = false;
            let firstId = frontData[0].id;
            let newSwitches: any = []; //whatever,,
            let i = 0;
            while (!foundSameSwitch && i < parsedResp.length) {
                if (parsedResp[i].id === firstId) {
                    frontData = newSwitches.concat(frontData);
                    fs.writeFile('./assets/switches.json', JSON.stringify(frontData, null, 2), 'utf8', (err) => {
                        if (err) {
                            console.log('something went wrong writing to switches.json >_<;;');
                        }
                    }); //doesn't have to be awaited since we don't care when this finishes, just want it to get done sometime
                    foundSameSwitch = true;
                } else {
                    newSwitches.push(parsedResp[i]);
                }
                i++;
            }

            alterInfo = constructAlterInfo(frontData, startPeriod, endPeriod, memberMap, true);
        } else {
            let apiResp = await fetch(`${pluralkitEndpoint}/systems/${customSystemId}/switches`);
            frontData = await apiResp.json();

            //this is. nanka yabai city but to get the entire front history,,
            if (frontData.length === 100) { //if we fill up all 100, we know there's more to fetch
                let foundEarliestSwitches = false;
                while (!foundEarliestSwitches) {
                    let earliestSwitch = frontData[frontData.length-1].timestamp;
                    apiResp = await fetch(`${pluralkitEndpoint}/systems/${customSystemId}/switches?before=${earliestSwitch}`);
                    let newSwitches = await apiResp.json();

                    if (newSwitches.length < 100) {
                        foundEarliestSwitches = true; //we can stop~~
                    }
                    frontData = frontData.concat(newSwitches);
                }
            }

            endPeriod = new Date(frontData[frontData.length-1].timestamp).getTime();

            apiResp = await fetch(`${pluralkitEndpoint}/systems/${customSystemId}/members`); //we also need to know who's in this custom system~ :0
            let memberData = await apiResp.json();

            memberMap = new Map([]);
            let otherMemberData = new Map([]);
            for (let i = 0; i < memberData.length; i++) {
                memberMap.set(memberData[i].id, memberData[i].name);
                otherMemberData.set(memberData[i].id, {pfp: memberData[i].avatar_url, colour: memberData[i].color});
            }

            alterInfo = constructAlterInfo(frontData, startPeriod, endPeriod, memberMap, true);
            for (let i = 0; i < alterInfo.length; i++) {
                if (otherMemberData.get(alterInfo[i].id)) { //isn't defined when we have no fronter - for whatever reason, only this seems to really work :p
                    alterInfo[i].pfpLink =  otherMemberData.get(alterInfo[i].id).pfp; //would make sense to have a default pfp... but i think it's fine
                    alterInfo[i].colour = otherMemberData.get(alterInfo[i].id).colour ?? 'ffffff'; //sets it to white if none
                }
            }
        }

        res.send(alterInfo);
    } catch (err) {
        console.log(err.message);
        res.send(err.message);
    }
});