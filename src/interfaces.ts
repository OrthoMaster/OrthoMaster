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
    id_event: number | null;
    event: string | null;
    event_start_date: string;
    event_end_date: string;
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