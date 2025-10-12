<svelte:head>
    <meta property="og:title" content="who am i?">
    <meta property="og:description" content=":thinking: hmm">
    <title>yuiyamu | who am i?</title>
</svelte:head>

<script lang="ts">
    import { Header } from "@repo/yuru-assets";
    import "@repo/yuru-static/assets/base.css";
    import { _ } from "@repo/i18n";
</script>

<Header person="lilac" page="whoami"/>
<div id="background"></div>
<section id="page-content">
    <h2>{$_('lilac.whoAmI.title')}</h2>
    <div class="horizontal-divide"></div>
    <p>{$_('lilac.whoAmI.intro')}</p>
    <div id="did-definition">
        <img id="sya-my-beloved" src="https://media1.tenor.com/m/B8PaZ6UGHwYAAAAd/aurora-somnia-goodereste-princess-syalis.gif" alt={$_('lilac.whoAmI.syaAltText')}>
        <p>{@html $_('lilac.whoAmI.didDefinition')}</p>
    </div>
    <p>{$_('lilac.whoAmI.didDefinitionExtra')}</p>
    <p><strong>{$_('lilac.whoAmI.body0Intro')}</strong></p>
    <p>{$_('lilac.whoAmI.body0')} </p>
    <div id="computer-side-img">
        <div id="left-computer-content">
                <p>{$_('lilac.whoAmI.body1')}</p>
                <p>{$_('lilac.whoAmI.body2')}</p>
                <p>{$_('lilac.whoAmI.body3')}</p>
        </div>
        <div id="computer-side-img-container">
                <img src="/computers.jpg" alt={$_('lilac.whoAmI.computersAltText')}>
                <span>{$_('lilac.whoAmI.photoCaption')}</span>
        </div>
    </div>
    <h2>{$_('lilac.whoAmI.faqSection')}</h2>
    <div class="horizontal-divide"></div>
    <p>{$_('lilac.whoAmI.faqIntro')}</p>
    <div class="qna-question">
        <h3>{$_('lilac.whoAmI.faqQuestion0')}</h3>
        <p><strong>a.</strong> {$_('lilac.whoAmI.faqAnswer0')}</p>
    </div>
    <div class="qna-question">
        <h3>{$_('lilac.whoAmI.faqQuestion1')}</h3>
        <p><strong>a.</strong> {$_('lilac.whoAmI.faqAnswer1')}</p>
    </div>
    <div class="qna-question">
        <h3>{$_('lilac.whoAmI.faqQuestion2')}</h3>
        <p><strong>a.</strong> {$_('lilac.whoAmI.faqAnswer2')}</p>
    </div>
    <div class="qna-question">
    <h3>{$_('lilac.whoAmI.faqQuestion3')}</h3>
        <p><strong>a.</strong> {$_('lilac.whoAmI.faqAnswer3')}
        <br><br>{$_('lilac.whoAmI.faqAnswer3_1')}</p>
    </div>
    <h2>{@html $_('lilac.whoAmI.reallySection')}</h2>
    <div class="horizontal-divide"></div>
    <p>{$_('lilac.whoAmI.reallyBody0')}</p>
    <p>{$_('lilac.whoAmI.reallyBody1')}</p>
    <p>{$_('lilac.whoAmI.reallyBody2')}</p>
</section>

<style>
#background {
    position: fixed;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    background-image: url('/bg.jpg');
    background-size: cover;
    background-position: center;
    filter: blur(15px) brightness(0.5);
    z-index: -1;
}

h2 {
    color: white;
}

h3 {
    color: white;
}

#page-content {
    padding-left: 30px;
    padding-right: 30px;
    padding-bottom: 30px;
    padding-top: 1px;
    margin-left: 11%;
    margin-right: 11%;
    margin-bottom: 40px;
    backdrop-filter: brightness(0.6);
}

.horizontal-divide {
    width: 100%;
    background-color: white;
    padding-bottom: 3px;
    border-radius: 5px;
}

#did-definition {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 20%;
    margin-right: 20%;
}

#sya-my-beloved {
    max-width: 160px;
    margin-right: 20px;
}

#computer-side-img {
    display: flex;
    align-items: center;
    justify-content: center;
} #left-computer-content {
    width: 50%;
} #computer-side-img-container {
    width: 50%;
    margin-left: 20px;
} #computer-side-img-container img {
    width: 100%;
} #computer-side-img-container span {
    display: inline-block;
    width: 100%;
    text-align: center;
}

.qna-question h3 {
    margin-bottom: 0;
} .qna-question p {
    margin-top: 0;
}

/* mobile */
@media only screen and (max-device-width: 768px)
{
    #page-content {
        margin: 0;
    }

    #did-definition {
        margin-left: 5%;
        margin-right: 5%;
    }

    #sya-my-beloved {
        display: none;
    }

    #computer-side-img {
        flex-direction: column;
    } #left-computer-content {
        width: 100%;
    } #computer-side-img-container {
        width: 100%;
        margin-right: 20px;
    }
}

    </style>
