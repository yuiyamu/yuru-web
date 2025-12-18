<script lang="ts">
    //TODO: header elements still aren't FREAKING translated when changing the page language despite doing so many reactive things bro
    let { person, page } = $props();

    import { _, locale } from "svelte-i18n";
    import Locale from "./Locale.svelte";
    import { pageLocales, localeInfo } from "./langSupport";
    import { getPageRoot } from "../pageHelper";
    //import mayPfp from '@repo/yuru-static/assets/maypfp.png';
    //import lilacPfp from '@repo/yuru-static/assets/lilacPfp.png';
    //vercel doesn't seem to fw these,,

    let prevPage = "";
    if (page === "home") {
        prevPage = getPageRoot("yurukyan");
    } else {
        prevPage = getPageRoot(person);
    }

    interface buttonInfo {
        name: string;
        link: string;
    }
    let buttonInfo: buttonInfo[] = $state([ //each person has at least a link back to our sets
        {
            name: $_("common.header.ourSets"),
            link: getPageRoot("yurukyan") + "sets",
        }
    ]);

    let pfpAlt = $state(""); //only this really needs to be updated
    let pfpLink = "";
    let username = "";
    switch (person) {
        case "lilac":
            pfpAlt = $_("lilac.header.pfpAlt");
            pfpLink = "/lilacpfp.png";
            username = "yuiyamu";
            buttonInfo.push({
                name: $_("common.header.myGds"),
                link: getPageRoot("lilac") + "gds",
            });
            buttonInfo.push({
                name: $_("lilac.header.whoAmI"),
                link: getPageRoot("lilac") + "whoami",
            });
            break;
        case "may":
            pfpAlt = $_("may.header.pfpAlt");
            pfpLink = "/maypfp.png";
            username = "mayniaria";
            break;
    }

    let hambugerOpen = $state(false);
    function openHambuger() {
        hambugerOpen = true;
    }
    function closeHambuger() {
        hambugerOpen = false;
    }

    function changeLocale(localeString: string) {
        locale.set(localeString);
        buttonInfo[1].name = $_("common.header.myGds");
    }
</script>

<div id="header">
    <a id="pfp-container" href={prevPage}>
        <img src={pfpLink} alt={pfpAlt} />
        <span>{username}</span>
    </a>
    {#each buttonInfo as option, i}
        <a class="option" href={option.link}>{option.name}</a>
        {#if i < buttonInfo.length - 1}
            <span class="flower-divider">ꕤ</span>
        {/if}
    {/each}

    <span id="hamburger-button" onclick={() => openHambuger()}>&#9776;</span>
    <div id="locale-position">
        <Locale mode="header" {person} {page} />
    </div>
    <div id="burger-menu" style="width: {hambugerOpen? '265px' : '0px'}; background-color: var(--{person}-main)">
        <a id="close-button" onclick={() => closeHambuger()}>&times;</a>
        <div id="burger-text">
            {#each buttonInfo as button}
                <a href={button.link}>{button.name}</a>
            {/each}
        </div>
        <div id="localization">
            <p>ꕤ languages</p>
            {#each pageLocales[person][page] as lang}
                <button onclick={() => changeLocale(lang)}>
                    <img src={localeInfo[lang].flag} alt={lang} />
                    <span>{localeInfo[lang].name}</span>
                </button>
            {/each}
        </div>
    </div>
</div>

<style>
    #header {
        font-family: "Raleway", sans-serif;
        font-size: 18px;
        display: flex;
        position: relative;
        align-items: center;
        padding: 15px;
        background: linear-gradient(
            360deg,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.4) 100%
        );
    }

    #pfp-container {
        display: flex;
        align-items: center;
        margin-right: 20px;
        text-decoration: none;
    }
    #pfp-container img {
        width: 60px;
        border-radius: 50%;
        margin-right: 10px;
    }
    #pfp-container span {
        color: white;
    }

    .option {
        text-decoration: none;
    }
    .option:hover {
        transition: 0.15s;
        text-shadow: -5px 4px 14px rgba(0, 0, 0, 1);
    }

    .flower-divider {
        margin-left: 20px;
        margin-right: 20px;
    }

    #locale-position {
        position: absolute;
        top: 10px;
        right: 2px; /* 10 total */
    }

    /* burger menu (shouldn't display on desktop */
    #hamburger-button {
        display: none;
    }

    #burger-menu {
        display: none;
    }

    /* mobile - burger menu */
    @media only screen and (max-device-width: 768px) {
        .option {
            display: none;
        }

        .flower-divider {
            display: none;
        }

        #locale-position {
            display: none;
        }

        /* displaying hamburger menu */
        #hamburger-button {
            display: grid;
            color: white;
            font-size: 26px;
            cursor: pointer;
            margin-left: auto;
        }

        #burger-menu {
            display: flex;
            flex-direction: column;
            position: fixed;
            overflow: hidden;
            height: 100%;
            width: 0; /* width gets changed when it's opened, 0 by default */
            top: 0;
            right: 0;
            text-align: right;
            border-top-left-radius: 5px;
            border-bottom-left-radius: 5px;
            transition: 0.25s ease; /* makes the slide out animation~ */
            z-index: 1;
        }

        #burger-text {
            font-size: 20px;
            text-align: center;
        } #burger-text a {
            font-family: "Raleway", sans-serif;
            display: block;
            color: var(--background);
            text-decoration: none;
            margin-bottom: 20px;
            cursor: pointer;
        }

        #localization {
            display: flex;
            flex-direction: column;
            margin-top: auto;
            margin-bottom: 10px;
        } #localization p {
            color: var(--background);
            text-align: left;
            padding-left: 5px;
            border-bottom: 2px solid var(--link);
            margin-bottom: 8px;
        } #localization button {
            font-family: "Raleway", sans-serif;
            color: var(--background);
            border: none;
            background-color: transparent;
            font-size: 18px;
            text-align: left;
            cursor: pointer;
        } #localization img {
            width: 22px;
            vertical-align: middle;
        }

        #close-button {
            font-size: 36px;
            margin-right: 10px;
            cursor: pointer;
        }
    }
</style>
