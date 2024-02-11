export default interface Root {
    VenID: number
    VenID_: number
    admins: number[]
    groups_old: GroupsOld[]
    channels: Channels
    betaChannels: BetaChannels
    devChannels: DevChannels
  }
  
  export interface GroupsOld {
    name: string
    id: number
  }
  
  export interface Channels {
    channel: Channel
    group: Group
  }
  
  export interface Channel {
    name: string
    id: number
  }
  
  export interface Group {
    name: string
    id: number
  }
  
  export interface BetaChannels {
    channel: Channel2
    group: Group2
  }
  
  export interface Channel2 {
    name: string
    id: number
  }
  
  export interface Group2 {
    name: string
    id: number
  }
  
  export interface DevChannels {
    channel: Channel3
    group: Group3
  }
  
  export interface Channel3 {
    name: string
    id: number
  }
  
  export interface Group3 {
    name: string
    id: number
  }
  