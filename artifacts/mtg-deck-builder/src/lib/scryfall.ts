import { useState, useEffect } from "react";

export interface ScryfallCard {
  name: string;
  image_uris?: {
    normal: string;
    small: string;
  };
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  card_faces?: Pick<ScryfallCard, "name" | "image_uris" | "oracle_text" | "type_line">[];
  legalities?: Record<string, string>;
  color_identity?: string[];
  oracle_id?: string;
}

const cache = new Map<string, ScryfallCard>();

export function useScryfallCard(cardName: string) {
  const [card, setCard] = useState<ScryfallCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setCard(null);
    setError(null);
    setLoading(Boolean(cardName));
    if (!cardName) return;

    if (cache.has(cardName)) {
      setCard(cache.get(cardName)!);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`)
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
