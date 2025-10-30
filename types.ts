export interface UserProfile {
    name: string;
}

export interface CardArtifact {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    explanation?: string;
    rating?: number;
    socialProof?: string;
}

export interface RecommendationGroup {
    title: string;
    cards: CardArtifact[];
}

export interface ChipArtifact {
    id:string;
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
        recommendationGroups?: RecommendationGroup[];
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

export interface WhiteboardNode {
    id: string;
    content: string;
    parentId: string | null;
}

export interface Category {
    id:string;
    name: string;
    systemPrompt: string;
    messages: ChatMessage[];
    parentId?: string | null;
    isPinned?: boolean;
    isFolder?: boolean;
    icon?: string; // e.g. emoji
    interactionMode: 'conversational' | 'card' | 'whiteboard';
    whiteboardData?: WhiteboardNode[];
}

export type Theme = 'light' | 'dark' | 'sunset' | 'ocean' | 'meadow';

export interface PersonalContextItem {
    id: string;
    question: string;
    answer: string;
}