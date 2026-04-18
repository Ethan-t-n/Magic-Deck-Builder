import { useState, useEffect } from "react";

export interface ScryfallCard {
  name: string;
  image_uris?: {
    normal: string;
    small: string;
  };
  mana_cost?: string;
  type_line?: string;
}

const cache = new Map<string, ScryfallCard>();

export function useScryfallCard(cardName: string) {
  const [card, setCard] = useState<ScryfallCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!cardName) return;

    if (cache.has(cardName)) {
      setCard(cache.get(cardName)!);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Card not found");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setCard(data);
          cache.set(cardName, data);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cardName]);

  return { card, loading, error };
}
