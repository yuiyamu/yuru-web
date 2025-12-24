# yuru-web

yurukyan△ system personal website~

![yuru-web](https://yui.yuru.ca/trn0rcd3o2.png)

## localization
our system (mostly lilac) is currently working on translating every page on our site into japanese, as well as a ton of other people maintaining translations into various different translations, shown below. however, none of these translations will include any of sydney's pages, as those are no longer being maintained.

> english: 100% | pages are translated from english~

> japanese: every page except for `lilac/whoami`, `yurukyan/sets`, and `yurukyan/system` (maintained by [yurukyan](https://github.com/sydnmc))

> hebrew: only `yurukyan/home` and the error page (maintained by anne)

> mandarin: same completion as japanese (maintained by [pearl](https://github.com/pearlwrap))

> vietnamese: same completion as japanese (maintained by [glitchy](https://github.com/Walker37712))

> german: every page except for `yurukyan/sets` and `yurukyan/system` (maintained by toki/yesoyai)

## dev notes
since this project now utilizes sveltekit as its framework, installation and development are relatively simple. just go to the root of the project, run `pnpm install` to install all of the dev dependencies, then `pnpm run dev` to start a local server.

note: because of how individual servers are run for each web page (due to turborepo), you must make sure you have ports `1414` through `1417` open before running, as well as port `3333` for the api.

in order to run a local server, you must also have the required .json files that the api serves by default, which can be fetched from [here](https://api.yuru.ca/sets), [here](https://api.yuru.ca/gds?person=lilac), and [here](https://api.yuru.ca/gds?person=sydney). these should be added to `packages/yuru-server-assets/`, along with a proper .env. instructions on how to make one are in the section below.

### .env

in the server folder, there's a few enviornment variables you can configure to make the server operate however you may like. 

`LAST_FM_KEY` - key to access the last.fm api, which you can get [here](https://www.last.fm/api/account/create)

`OSU_KEY` - your personal legacy osu! api key, which can be found [here](https://osu.ppy.sh/home/account/edit#legacy-api)

`UPDATE_LAST` - the amount of gds you'd like to update with every automatic update, which by default is set to 10. older gds generally don't need to be updated ever, which is why this setting exists.

`UPDATE_EVERY` - the interval in which you'd like maps to update in hours, by default set to 12 hours.

`VALID_ACCESS_KEY` - your access token to modify the set and gd data on the server. this can be whatever you'd like, but make it secure :3

### docker

`yuru-server` now supports running via docker~!!

in order to build and use the image, first make sure that your `yuru-server-assets` folder has all the necessary files. then, simply `docker compose up --build`, and you're good to go~

### api info

more information on the api can be found at [api.yuru.ca](https://api.yuru.ca), as it serves a page explaining all the endpoints at its root~
