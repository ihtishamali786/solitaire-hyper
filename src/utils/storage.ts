export const getStoredCoins = (): number => {
  return parseInt(localStorage.getItem('shcg_coins') || '500', 10);
};

export const saveCoins = (amount: number): void => {
  localStorage.setItem('shcg_coins', amount.toString());
};

export const getStoredStats = () => {
  const defaults = { gamesPlayed: 0, gamesWon: 0, streak: 0 };
  try {
    const raw = localStorage.getItem('shcg_stats');
    return raw ? JSON.parse(raw) : defaults;
  } catch {
    return defaults;
  }
};

export const saveStats = (stats: any) => {
  localStorage.setItem('shcg_stats', JSON.stringify(stats));
};
