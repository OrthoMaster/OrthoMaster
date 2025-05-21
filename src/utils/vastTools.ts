import { XMLParser } from 'fast-xml-parser';
import { IVASTObject } from './interfaces';
import { URLSearchParams } from 'url';
const XML = `<VAST version="2.0">
<Ad id="87492">
<InLine>
<AdSystem version="1.0.0.0">Ad Butler</AdSystem>
<AdTitle>
<![CDATA[ Video Exo-feet : Comment ? vous ne l'avez pas ? ]]>
</AdTitle>
<Description>
<![CDATA[ ]]>
</Description>
<Impression id="AB">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=views&_abdk%5BJob+Function%5D=pharmacien ]]>
</Impression>
<Error>
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&_abdk%5BJob+Function%5D=pharmacien&error=[ERRORCODE]&ts=657434402 ]]>
</Error>
<Creatives>
<Creative id="87492">
<Linear>
<Duration>00:00:10</Duration>
<TrackingEvents>
<Tracking event="creativeView">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=creativeView&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="start">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=start&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="firstQuartile">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=firstQuartile&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="thirdQuartile">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=thirdQuartile&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="midpoint">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=midpoint&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="complete">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=complete&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="mute">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=mute&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="unmute">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=unmute&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="pause">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=pause&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="rewind">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=rewind&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="resume">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=resume&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="fullscreen">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=fullscreen&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="expand">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=expand&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="collapse">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=collapse&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="acceptInvitation">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=acceptInvitation&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
<Tracking event="close">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=close&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
</TrackingEvents>
<VideoClicks>
<ClickThrough>
<![CDATA[ https://www.orthomaster.fr ]]>
</ClickThrough>
<ClickTracking>
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=clicks&_abdk%5BJob+Function%5D=pharmacien ]]>
</ClickTracking>
</VideoClicks>
<MediaFiles>
<MediaFile type="video/mp4" width="2560" height="1440" bitrate="6589" delivery="progressive">
<![CDATA[ https://servedbyadbutler.com/getad.img/?libBID=4557233 ]]>
</MediaFile>
</MediaFiles>
</Linear>
</Creative>
<Creative sequence="1" id="87492">
<CompanionAds>
<Companion width="800" height="800" id="15723">
<StaticResource creativeType="static">
<![CDATA[ https://servedbyadbutler.com/getad.img/?libBID=4557237 ]]>
</StaticResource>
<TrackingEvents>
<Tracking event="creativeView">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&companionID=15723&type=companionViews1&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
</TrackingEvents>
<CompanionClickThrough>
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&companionID=15723&type=companionClicks1&_abdk%5BJob+Function%5D=pharmacien ]]>
</CompanionClickThrough>
</Companion>
</CompanionAds>
</Creative>
<Creative id="87492">
<NonLinearAds>
<NonLinear id="43240" width="1458" height="1352">
<StaticResource creativeType="progressive">
<![CDATA[ https://servedbyadbutler.com/getad.img/?libBID=4557234 ]]>
</StaticResource>
<NonLinearClickThrough>
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=clicks&redirect=https%3A%2F%2Fwww.orthomaster.fr&_abdk%5BJob+Function%5D=pharmacien&nlClick=1 ]]>
</NonLinearClickThrough>
</NonLinear>
<TrackingEvents>
<Tracking event="creativeView">
<![CDATA[ https://servedbyadbutler.com/callback.spark?ID=188636&bannerID=87492&publisherID=376392&campaignID=32764&setID=63510&advertiserID=328572&scheduleID=109390&placementID=110669&type=nlCreativeView&_abdk%5BJob+Function%5D=pharmacien ]]>
</Tracking>
</TrackingEvents>
</NonLinearAds>
</Creative>
</Creatives>
<Extensions>
<Extension id="placementID">110669</Extension>
</Extensions>
</InLine>
</Ad>
</VAST>`


export const constructVASTObjectWithUrlFromAdButler = async (url: string): Promise<IVASTObject> => {
    var vastObject: IVASTObject = {
        adSystem: "",
        adTitle: "",
        adDescription: "",
        impressions: [],
        linearMedia: null,
        companionAd: null,
        nonLinearAd: null,
        onError: "",
        extansion: null
    };
    // const response = await fetch(url);
    // const xmlText = await response.text();
    const parser = new XMLParser();
    const json = parser.parse(XML);

    const getImpressions = (impressions: string | string[]): string[] => {
        if (typeof impressions === 'string') {
            return [impressions.trim()];
        } else if (Array.isArray(impressions)) {
            return impressions;
        } else {
            return [];
        }
    }

    const getCreativeTrackingEvents = (trackingEvents: any): any => {
        let trackingEventsObj = {};

        if (Array.isArray(trackingEvents)) {
            trackingEvents.map((event) => {
                const parsedUrlParams = new URL(event).searchParams;
                const type = parsedUrlParams.get('type');

                trackingEventsObj = {
                    ...trackingEventsObj,
                    [type]: event.trim()
                }
            })
        } else {
            const parsedUrlParams = new URL(trackingEvents).searchParams;
            const type = parsedUrlParams.get('type');
            trackingEventsObj = {
                ...trackingEventsObj,
                [type]: trackingEvents.trim()
            }
        }
        return trackingEventsObj;
    }

    const getLinear = (linear: any): typeof vastObject.linearMedia => {
        const getMediaFiles = (mediaFiles: any): any[] => {
            if (Array.isArray(mediaFiles)) {
                return mediaFiles
            } else {
                return [mediaFiles.MediaFile.trim()];
            }
        }

        return {
            duration: linear?.Linear?.Duration,
            clickThrough: linear?.Linear?.VideoClicks?.ClickThrough?.trim(),
            clickTracking: linear?.Linear?.VideoClicks?.ClickTracking?.trim(),
            trackingEvents: getCreativeTrackingEvents(linear?.Linear?.TrackingEvents?.Tracking),
            mediaFiles: getMediaFiles(linear?.Linear?.MediaFiles)
        } as IVASTObject['linearMedia']
    }

    const getCompanionAds = (config: any): typeof vastObject.companionAd => {
        return {
            staticRessource: config.CompanionAds.Companion.StaticResource.trim(),
            companionClickThrough: config.CompanionAds.Companion.CompanionClickThrough.trim(),
            trackingEvents: getCreativeTrackingEvents(config.CompanionAds.Companion.TrackingEvents.Tracking),
        } as IVASTObject['companionAd']
    }

    const getNonLinearAds = (config: any): typeof vastObject.nonLinearAd => {
        
        return {
            staticRessource: config.NonLinearAds.NonLinear.StaticResource.trim(),
            nonLinearClickThrough: config.NonLinearAds.NonLinear.NonLinearClickThrough.trim(),
            trackingEvents: getCreativeTrackingEvents(config.NonLinearAds.TrackingEvents.Tracking)
        } as IVASTObject['nonLinearAd']
    }

    try {
        vastObject.adSystem = json?.VAST?.Ad?.InLine?.AdSystem;
        vastObject.adTitle = json?.VAST?.Ad?.InLine?.AdTitle;
        vastObject.adDescription = json?.VAST?.Ad?.InLine?.Description;
        vastObject.impressions = getImpressions(json?.VAST?.Ad?.InLine?.Impression);
        vastObject.onError = json?.VAST?.Ad?.InLine?.Error;
        vastObject.linearMedia = getLinear(json?.VAST?.Ad?.InLine?.Creatives?.Creative?.find((creative: {}) => Object.keys(creative).find((key) => key === "Linear")));
        vastObject.companionAd = getCompanionAds(json?.VAST?.Ad?.InLine?.Creatives?.Creative?.find((creative: {}) => Object.keys(creative).find((key) => key === "CompanionAds")));
        vastObject.nonLinearAd = getNonLinearAds(json?.VAST?.Ad?.InLine?.Creatives?.Creative?.find((creative: {}) => Object.keys(creative).find((key) => key === "NonLinearAds")));

    } catch (error) {
        console.log(error);

    }

    return vastObject // retourne un
};

export const saveVastEvent = (callbackURL: string) => {
    fetch(callbackURL)
    .then(response=>{
        console.log(response);
    })
    .catch((e)=>{
        console.log(e);
    })
}