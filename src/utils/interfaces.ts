import { ReactNode } from "react";


export interface IContent {
    id_content: number;
    odoo_id: number | null;
    title: string;
    type: string;
    author: string;
    duration: string;
    module_num: number;
    description: string;
    order: number | null;
    tags: string;
    s3_path: string;
    aws_object_path: string;
    published: boolean;
    creation: string;
    id_past_event: number | null;
    event: string | null;
    event_edition_year: string | null;
    id_media_category: number | null;
    category_name: string;
}

export interface ISearchContent extends IContent {
    demo_access: boolean;
    id_formation_catalog: number;
    formation_name: string;
    enabled: boolean; // FORMATION
    id_product_odoo: number;
    id_user_formation: number;
    certifying: boolean;
    is_paid: boolean;
    score_title: number;
    score_author: number;
    score_tags: number;
}

export interface IEvent {
    id: number;
    name: string;
    description: string;
    logo_url: string;
    website: string;
}

export interface IPastEvent {
    id: number;
    id_event: number;
    edition_year: string;
    start_date: string;
    end_date: string;
    description: string;
}

export interface IVASTObject {
    adSystem: string;
    adTitle: string;
    adDescription: string;
    impressions: string[];
    linearMedia: {
        duration: string;
        trackingEvents: object;
        clickThrough: string;
        clickTracking: string;
        //     mediaFiles: {
        //         type: string;
        //         width: number;
        //         height: number;
        //         bitrate: number;
        //         delivery: string;
        //         accessUrl: string;
        //     }[];
        mediaFiles: string[]
    }
    companionAd: {
        staticRessource: string;
        companionClickThrough: string;
        trackingEvents: object;
    };
    nonLinearAd: {
        staticRessource: string;
        nonLinearClickThrough: string;
        trackingEvents: object;
    };
    onError: string;
    extansion: any;
}

// export interface ILinarMediaAd 

// export interface IMediaFile 

// export interface ICompanionAd 

// export interface INonLinearAd 