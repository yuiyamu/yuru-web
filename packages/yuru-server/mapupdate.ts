import fs from 'node:fs';
import { colourizeHex } from 'osu-colourizer';
import dotenv from 'dotenv';

dotenv.config();

const osuURL = "https://osu.ppy.sh/api/get_beatmaps";

function findWipCount(mapStatus: gd[]) {
  let wipCount = 0;
  for (let i = 0; i < mapStatus.length; i++) {
    if (mapStatus[i].status === "wip") {
      wipCount++;
    }
  }
  return wipCount;
}

function findStatus(statusNum: string) {
  let status;
  switch (statusNum) {
    case "-2":
      status = "graved";
      break;
    case "-1":
      status = "set wip";
      break;
    case "0":
      status = "pending";
      break;
    case "1":
      status = "ranked";
      break;
    case "3": //case 2 should never be used as none of my maps can get approved now :p
      status = "qualified";
      break;
    case "4":
      status = "loved"; //if this ever happens ill shit myself
      break;
  }

  return status;
}

function findMode(modeNum: string) {
  let mode;
  switch (modeNum) {
    case "0":
      mode = 'osu';
      break;
    case "1":
      mode = 'taiko';
      break;
    case "2":
      mode = 'fruits';
      break;
    case "3":
      mode = 'mania';
      break;
  }
  
  return mode;
}

export async function grabSongInfo(id: number, type: string) {
  let apiResponse;
  let mapInfo: gd = {} as gd;
  let apiUrl;
  if (type === "beatmapset") {
    apiUrl = osuURL+`?k=${process.env.OSU_KEY}&s=${id}`
  } else if (type === "beatmap" || type === "updateBeatmap") {
    apiUrl = osuURL+`?k=${process.env.OSU_KEY}&b=${id}`;
  }

  let response = await fetch(apiUrl); //looks up the beatmap (diff) using osu apiv1 (not oauth, but lets us do things without having to deal with any logging in~)
  if (!response.ok) {
    throw new Error(`Response from osu API: ${response.status}`);
  }
  apiResponse = await response.json();

  if (type === "updateBeatmap") {
    return apiResponse;
  } else if (type === "beatmap") {
      Object.assign(mapInfo, {
        bgLink: `https://assets.ppy.sh/beatmaps/${apiResponse[0].beatmapset_id}/covers/cover.jpg`,
        title: apiResponse[0].title,
        titleUnicode: apiResponse[0].title_unicode,
        artist: apiResponse[0].artist,
        artistUnicode: apiResponse[0].artist_unicode,
        creator: apiResponse[0].creator,
        mapId: apiResponse[0].beatmapset_id,
        status: findStatus(apiResponse[0].approved),
        bns: [],
        maps: [{
          url: `https://osu.ppy.sh/beatmapsets/${apiResponse[0].beatmapset_id}#${findMode(apiResponse[0].mode)}/${apiResponse[0].beatmap_id}`,
          id: apiResponse[0].beatmap_id,
          diffname: apiResponse[0].version,
          sr: Math.round(apiResponse[0].difficultyrating * 100) / 100,
        }]
      });

    //we aren't adding in isForRank, amountMapped, and dateFinished here - we'll need to get those from the user
    return mapInfo;
  } else if (type === "beatmapset") {
      Object.assign(mapInfo, {
        bgLink: `https://assets.ppy.sh/beatmaps/${apiResponse[0].beatmapset_id}/covers/cover.jpg`,
        title: apiResponse[0].title,
        titleUnicode: apiResponse[0].title_unicode,
        artist: apiResponse[0].artist,
        artistUnicode: apiResponse[0].artist_unicode,
        url: `https://osu.ppy.sh/beatmapsets/${apiResponse[0].beatmapset_id}`,
        mapId: apiResponse[0].beatmapset_id,
        status: findStatus(apiResponse[0].approved)
      });

      //similarly, we aren't getting a lot of things here - description, creator (since this is always yurukyan), dateFinished, and personCreator
      return mapInfo;
  }
}

export function modifySets(newSet: beatmapset, isNew: boolean) {
  let currentSets = JSON.parse(fs.readFileSync('./sets.json', 'utf-8'));
  if (isNew) { //if it's new, we can just append the new set since we automatically sort complete/incomplete on the frontend~
    currentSets.push(newSet);
  } else {
    let setIndex = currentSets.findIndex(set => set.mapId === newSet.mapId);
    currentSets[setIndex] = newSet;
  }

  fs.writeFileSync('./sets.json', JSON.stringify(currentSets, null, 2));
}

export function modifyDiffs(newDiff: gd, isNew: boolean, person: string) {
  let currentDiffs = JSON.parse(fs.readFileSync(`./${person}gds.json`, 'utf-8'));
  if (newDiff.status === 'wip' && isNew) { //new wip gds can simply be appended to the bottom~
    currentDiffs.push(newDiff);
  } else {
    let numWipDiffs = findWipCount(currentDiffs);
    if (isNew) { //if it's new and not wip, we can append before the wip diffs~
      currentDiffs.splice(currentDiffs.length-numWipDiffs, 0, newDiff);
    } else {
      let mapIndex = currentDiffs.findIndex(diff => diff.mapId === newDiff.mapId);
      if (currentDiffs[mapIndex].status === 'wip' && newDiff.status !== 'wip') { //if this update changes the diff status
        console.log('changing diff order~');
        currentDiffs.splice(mapIndex, 1);
        currentDiffs.splice((currentDiffs.length+1)-numWipDiffs, 0, newDiff);
      } else {
        currentDiffs[mapIndex] = newDiff;
      }
    }
  }

  fs.writeFileSync(`./${person}gds.json`, JSON.stringify(currentDiffs, null, 2));
}

export async function updateAllMaps(person: string, mapStatus: gd[]) {
    let wipCount = findWipCount(mapStatus);
    console.log(`\x1b[32mexcluding \x1b[33m${wipCount}\x1b[0m\x1b[32m wip maps from update >w<\x1b[0m`);

    let updateLast = process.env.UPDATE_LAST? parseInt(process.env.UPDATE_LAST) : 10;
    for (let i = mapStatus.length - updateLast - wipCount; i < mapStatus.length - wipCount; i++) { //only updating the last n number of rows, excluding wip maps
        if (!mapStatus[i].mapId) { //if there is no map id (we can't find the url~)
            continue;
        }

        for (let j = 0; j < mapStatus[i].maps.length; j++) {
            console.log(`updating \x1b[36m${mapStatus[i].artist} - ${mapStatus[i].title} | [${mapStatus[i].maps[j].diffname}]\x1b[0m`);
            let curSongInfo = await grabSongInfo(parseInt(mapStatus[i].maps[j].id), 'updateBeatmap');

            if (!curSongInfo[0]) {
              console.log(`somehow didn't seem to find a beatmap associated with this >_<;;`)
              continue;
            }

            if (j === 0) { //just doing it on the first pass so we don't waste resources reassigning it each time~
                Object.assign(mapStatus[i], {
                    title: curSongInfo[0].title,
                    titleUnicode: curSongInfo[0].title_unicode,
                    artist: curSongInfo[0].artist,
                    artistUnicode: curSongInfo[0].artist_unicode,
                    status: findStatus(curSongInfo[0].approved),
                    creator: curSongInfo[0].creator,
                });
            }

            Object.assign(mapStatus[i].maps[j], {
                sr: Math.round(curSongInfo[0].difficultyrating * 100) / 100
            });
        }
    }

    let filename = `${person}gds.json`;
    fs.writeFileSync(filename, JSON.stringify(mapStatus, null, 2));
    console.log(`succesfully wrote to ${filename}~! :D`);
}
