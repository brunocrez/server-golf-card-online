import axios from 'axios'
import { IDeck } from '../models/deck'

const DECK_API_URL = 'https://www.deckofcardsapi.com/api/deck'

export const createNewDeck = async (deckCount = 1) => {
  try {
    const response = await axios.get<IDeck>(
      `${DECK_API_URL}/new/shuffle/?deck_count=${deckCount}&jokers_enabled=true`,
    )
    return response.data
  } catch (error) {
    throw new Error('we could not create a new deck, try again later!')
  }
}

export const drawCard = async (deckId: string, drawCount: number) => {
  try {
    const response = await axios.get<IDeck>(
      `${DECK_API_URL}/${deckId}/draw/?count=${drawCount}`,
    )

    return response.data
  } catch (error) {
    throw new Error('we could not draw a card, try again later!')
  }
}

export const shuffleDeck = async (deckId: string) => {
  try {
    const response = await axios.get<IDeck>(`${DECK_API_URL}/${deckId}/shuffle`)
    return response.data
  } catch (error) {
    throw new Error('we could not create a new deck, try again later!')
  }
}
