
export type SessionEventType = 'content_view' | 'screen_view' | 'tool_view' | 'share_use'

export type SessionEventData = SessionEventContent | SessionEventScreen | SessionEventShare

export type SessionEventContent = {
    content_id: number
    started_at: string
    ended_at: string
    id_user_registered_formation: number | null
}

export type SessionEventScreen = {
    screen_name: string
    started_at: string
    ended_at: string
}

export type SessionEventShare = {
    share_type: string
    content_id: number | null
    occured_at: string
}