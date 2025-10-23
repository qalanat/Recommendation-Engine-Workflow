export interface UserProfile {
    name: string;
}

export interface CardArtifact {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
}

export interface ChipArtifact {
    id: string;
    label: string;
}

export interface MapArtifact {
    query: string;
    userLocation?: {
        latitude: number;
        longitude: number;
    }
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    sources?: GroundingSource[];
    artifacts?: {
        cards?: CardArtifact[];
        chips?: ChipArtifact[];
        map?: MapArtifact;
    };
    file?: {
        name: string;
        type: string;
        url: string; // Object URL for preview
        base64: string; // Base64 content for API
    };
    isLoading?: boolean;
}

export interface GroundingSource {
    uri: string;
    title: string;
    type: 'web' | 'maps';
    reviewSnippets?: {
        text: string;
        author: string;
        rating: number;
    }[];
}

export interface Category {
    id: string;
    name: string;
    systemPrompt: string;
    messages: ChatMessage[];
    parentId?: string | null;
    isPinned?: boolean;
    icon?: string; // e.g. emoji
    interactionMode: 'conversational' | 'card';
}

export type Theme = 'light' | 'dark' | 'sunset';

export interface PersonalContextItem {
    id: string;
    question: string;
    answer: string;
}
