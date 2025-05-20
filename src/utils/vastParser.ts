import { XMLParser } from 'fast-xml-parser';
import { IVASTObject } from '../utils/interfaces';

export const constructVASTObjectWithUrlFromAdButler = async (url: string): Promise<IVASTObject> => {
    var vastObject: IVASTObject = {
        adSystem: "",
        adTitle: "",
        adDescription: "",
        impressions: [],
        linearMedia: null,
        companionAds: [],
        nonLinearAds: [],
        onError: "",
        extansion: null
    };
    const response = await fetch(url);
    const xmlText = await response.text();
    const parser = new XMLParser();
    const json = parser.parse(xmlText);
    
    const getImpressions = (impressions: string | string[]) : string[] => {
        if (typeof impressions === 'string') {
            return [impressions];
        } else if (Array.isArray(impressions)) {
            return impressions;
        } else {
            return [];
        }
    }
    //IVASTObject['linearMedia'] | IVASTObject['nonLinearAds'] | IVASTObject['companionAds']
    const getCreative = (creativeType: 'Linear' | 'NonLinearAds' | 'CompanionAds', creatives: any[]) : any => {

        console.log("Creative Type", creativeType);
        console.log("Creatives", creatives);
        const currentCreative = creatives.find((creative) => Object.keys(creative).find((key) => key === creativeType));
        console.log("Current Creative", currentCreative);
        
        

        switch (creativeType) {
            case 'Linear':
                
                break;
            case 'NonLinearAds':
                break;
            case 'CompanionAds':
                break;
        
            default:
                break;
        }

        return {
            
        }
    }



    console.log(json?.VAST?.Ad?.InLine.Creatives);
    
    try {
        vastObject.adSystem = json?.VAST?.Ad?.InLine?.AdSystem;
        vastObject.adTitle = json?.VAST?.Ad?.InLine?.AdTitle;
        vastObject.adDescription = json?.VAST?.Ad?.InLine?.Description;
        vastObject.impressions = getImpressions(json?.VAST?.Ad?.InLine?.Impression);
        vastObject.onError = json?.VAST?.Ad?.InLine?.Error;
        vastObject.linearMedia = getCreative('Linear', json?.VAST?.Ad?.InLine?.Creatives?.Creative);
        
    } catch (error) {
        console.log(error);
        
    }

    // console.log("Returning VAST Object", vastObject);
    return vastObject // retourne un
};