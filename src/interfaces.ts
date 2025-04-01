import { ReactNode } from "react";


export interface IContent {
    id_content: number;
    odoo_id: number | null;
    title: string;
    type: string;
    author: string;
    duration: string;
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

export interface IEvent {
    id: number;
    name: string;
    description: string;
    logo_url: string;
}

export interface IPastEvent {
    id: number;
    id_event: number;
    edition_year: string;
    start_date: string;
    end_date: string;
    description: string;
}