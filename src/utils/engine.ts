import { Card, GameState, HintResult, Suit } from '../types/solitaire';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const suitColor = (suit: Suit): 'red' | 'black' => {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let value = 1; value <= 13; value++) {
      deck.push({
        id: `${suit}-${value}`,
        suit,
        value,
        isFaceUp: false,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function initGame(drawMode: 1 | 3 = 1, vegasMode: boolean = false): GameState {
  const deck = shuffleDeck(createDeck());
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let deckIndex = 0;

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[deckIndex++] };
      if (row === col) card.isFaceUp = true;
      tableau[col].push(card);
    }
  }

  const stock = deck.slice(deckIndex).map(c => ({ ...c, isFaceUp: false }));

  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    score: vegasMode ? -52 : 0,
    moves: 0,
    timeElapsed: 0,
    drawMode,
    vegasMode,
    isWon: false,
    hintsUsed: 0,
    gameId: `game-${Date.now()}`,
    isDaily: false,
  };
}

export function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) return card.value === 1;
  const top = foundation[foundation.length - 1];
  return top.suit === card.suit && card.value === top.value + 1;
}

export function canPlaceOnTableau(card: Card, targetCol: Card[]): boolean {
  if (targetCol.length === 0) return card.value === 13;
  const top = targetCol[targetCol.length - 1];
  if (!top.isFaceUp) return false;
  return suitColor(card.suit) !== suitColor(top.suit) && top.value === card.value + 1;
}

export function isGameWon(foundations: [Card[], Card[], Card[], Card[]]): boolean {
  return foundations.every(f => f.length === 13);
}

export function canAutoComplete(state: GameState): boolean {
  if (state.stock.length > 0 || state.waste.length > 0) return false;
  for (const col of state.tableau) {
    for (const card of col) {
      if (!card.isFaceUp) return false;
    }
  }
  return true;
}

export function findBestMove(state: GameState): HintResult | null {
  if (state.waste.length > 0) {
    const card = state.waste[state.waste.length - 1];
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, state.foundations[f])) {
        return {
          from: { type: 'waste', card },
          to: { type: 'foundation', colIndex: f },
          explanation: `Move ${card.value} of ${card.suit} to foundation.`,
        };
      }
    }
  }

  for (let c = 0; c < 7; c++) {
    const col = state.tableau[c];
    if (col.length > 0) {
      const card = col[col.length - 1];
      for (let f = 0; f < 4; f++) {
        if (canPlaceOnFoundation(card, state.foundations[f])) {
          return {
            from: { type: 'tableau', colIndex: c, cardIndex: col.length - 1, card },
            to: { type: 'foundation', colIndex: f },
            explanation: `Advance ${card.value} of ${card.suit} to foundation.`,
          };
        }
      }
    }
  }

  if (state.stock.length > 0 || state.waste.length > 0) {
    return {
      from: { type: 'stock', card: state.stock[0] || state.waste[0] },
      to: { type: 'waste' },
      explanation: 'Draw new cards from the stock pile.',
    };
  }

  return null;
}
