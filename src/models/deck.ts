interface Images {
  svg: string
  png: string
}

export interface Card {
  code: string
  images: Images
  value: string
  suit: string
  faceUp: boolean
}

export interface IDeck {
  deck_id: string
  remaining: number
  cards: Card[]
}
