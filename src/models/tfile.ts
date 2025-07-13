export interface Thumbnail {
    fileSize: number;
    dcId: number;
    width: number | null;
    height: number | null;
    isVideo: boolean;
    type: string;
    fileId: string;
    uniqueFileId: string;
  }
  
 export interface Media {
    fileSize: number;
    dcId: number;
    fileName: string;
    mimeType: string;
    date: string;
    thumbnails: Thumbnail[];
    fileId: string;
    uniqueFileId: string;
  }

  interface AccessHash {
    low: number;
    high: number;
    unsigned: boolean;
  }
  
  interface InputPeer {
    _: string;
    userId: number;
    accessHash: AccessHash;
  }
  
  interface PhotoSize {
    dcId: number;
    big: boolean;
    fileId: string;
    uniqueFileId: string;
  }
  
  interface UserPhoto {
    isPersonal: boolean;
    small: PhotoSize;
    big: PhotoSize;
  }
  
  interface ColorInfo {
    color: number;
    backgroundEmojiId: string | null;
  }

  interface TUser {
    id: number;
    isMin: boolean;
    isSelf: boolean;
    isContact: boolean;
    isMutualContact: boolean;
    isCloseFriend: boolean;
    isDeleted: boolean;
    isBot: boolean;
    isBusinessBot: boolean;
    isBotWithHistory: boolean;
    isBotWithoutChats: boolean;
    isBotWithAttachmentMenu: boolean;
    isBotAttachmentMenuEnabled: boolean;
    isBotWithInlineGeo: boolean;
    isBotEditable: boolean;
    isVerified: boolean;
    customVerificationEmojiId: string | null;
    isRestricted: boolean;
    restrictionReason: any[];
    isScam: boolean;
    isFake: boolean;
    isSupport: boolean;
    isPremium: boolean;
    isPremiumRequired: boolean;
    botActiveUsers: number | null;
    hasMainApp: boolean;
    firstName: string;
    lastName: string;
    status: string;
    statusHiddenByMe: boolean;
    lastOnline: string;
    nextOffline: string | null;
    username: string | null;
    usernames: any | null;
    language: string | null;
    dcId: number;
    phoneNumber: string;
    inputPeer: InputPeer;
    photo: UserPhoto;
    restrictions: any | null;
    displayName: string;
    emojiStatus: any | null;
    storiesHidden: boolean;
    storiesUnavailable: boolean;
    storiesMaxId: number;
    color: ColorInfo;
    profileColors: any | null;
    paidMessagePrice: any | null;
  }
  
  export interface TMessage {
    isScheduled: boolean;
    id: number;
    views: number | null;
    forwards: number | null;
    signature: string | null;
    isOutgoing: boolean;
    isService: boolean;
    isContentProtected: boolean;
    isFromOffline: boolean;
    isSilent: boolean;
    hasUnreadMedia: boolean;
    isChannelPost: boolean;
    isFromScheduled: boolean;
    isPinned: boolean;
    hideEditMark: boolean;
    invertMedia: boolean;
    groupedId: number | null;
    groupedIdUnique: number | null;
    sender: TUser;
    senderBoostCount: number;
    chat: TUser;
    date: string;
    editDate: string | null;
    forward: any | null;
    isAutomaticForward: boolean;
    replies: any | null;
    replyToMessage: any | null;
    replyToStory: any | null;
    isTopicMessage: boolean;
    isMention: boolean;
    quickReplyShortcutId: number | null;
    viaBot: any | null;
    viaBusinessBot: any | null;
    text: string;
    entities: any[];
    textWithEntities: { text: string };
    action: any | null;
    media: Media | null;
    isForwardedPremiumMedia: boolean;
    ttlPeriod: number | null;
    markup: any | null;
    canBeForwarded: boolean;
    canBeReacted: boolean;
    reactions: any | null;
    factCheck: any | null;
    effectId: number | null;
    videoProcessingPending: boolean;
    sendPrice: any | null;
  }
  