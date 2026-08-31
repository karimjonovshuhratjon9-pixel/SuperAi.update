import React, { useState, useEffect } from "react";
import { Flashcard, FlashcardDeck } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Badge,
  EmptyState,
} from "./ui/SharedUI";

interface FlashcardsViewProps {
  userId: string;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ userId }) => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [deckName, setDeckName] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const loadDecks = async () => {
    const items = await dbService.getFlashcardDecksByUserId(userId);
    setDecks(items);
  };

  const loadCards = async () => {
    const items = await dbService.getFlashcardsByUserId(userId);
    setCards(items);
  };

  useEffect(() => {
    loadDecks();
    loadCards();
  }, [userId]);

  const handleCreateDeck = async () => {
    if (!deckName.trim()) return;
    const deck: FlashcardDeck = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      userId,
      name: deckName.trim(),
      cards: [],
      createdAt: Date.now(),
    };
    await dbService.saveFlashcardDeck(deck);
    setDeckName("");
    loadDecks();
  };

  const handleAddCard = async () => {
    if (!front.trim() || !back.trim() || !activeDeck) return;
    const card: Flashcard = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      userId,
      front: front.trim(),
      back: back.trim(),
      deckId: activeDeck.id,
      createdAt: Date.now(),
    };
    await dbService.saveFlashcard(card);
    activeDeck.cards.push(card.id);
    await dbService.saveFlashcardDeck(activeDeck);
    setFront("");
    setBack("");
    loadCards();
  };

  const handleDeleteDeck = async (id: string) => {
    if (window.confirm("Bu deck'ni o'chirishni tasdiqlaysizmi?")) {
      await dbService.deleteFlashcardDeck(id);
      if (activeDeck?.id === id) setActiveDeck(null);
      loadDecks();
    }
  };

  const deckCards = activeDeck
    ? cards.filter((c) => c.deckId === activeDeck.id)
    : [];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Flashcards"
          title="🧠 Flashkartalar"
          description="Yodlash uchun interaktiv kartalar yarating"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-black text-white mb-3">
                📚 Deck yaratish
              </h3>
              <div className="flex gap-2">
                <Input
                  value={deckName}
                  onChange={setDeckName}
                  placeholder="Deck nomi"
                />
                <Button onClick={handleCreateDeck} disabled={!deckName.trim()}>
                  +
                </Button>
              </div>
            </Card>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-white">
                Deck'lar ({decks.length})
              </h3>
              {decks.length === 0 ? (
                <EmptyState
                  icon="📚"
                  title="Deck'lar yo'q"
                  description="Yangi deck yarating va kartalar qo'shing."
                />
              ) : (
                decks.map((deck) => (
                  <Card
                    key={deck.id}
                    className="hover:border-blue-500/30 transition cursor-pointer"
                    onClick={() => setActiveDeck(deck)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-white">
                          {deck.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {deck.cards.length} karta
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Badge
                          color={activeDeck?.id === deck.id ? "blue" : "slate"}
                        >
                          {activeDeck?.id === deck.id ? "Faol" : "Tanlash"}
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeck(deck.id);
                          }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            {activeDeck ? (
              <>
                <Card>
                  <h3 className="text-sm font-black text-white mb-3">
                    ➕ Karta qo'shish — {activeDeck.name}
                  </h3>
                  <div className="space-y-2">
                    <Input
                      value={front}
                      onChange={setFront}
                      placeholder="Old tomon (savol)"
                    />
                    <Input
                      value={back}
                      onChange={setBack}
                      placeholder="Orqa tomon (javob)"
                    />
                    <Button
                      onClick={handleAddCard}
                      disabled={!front.trim() || !back.trim()}
                      className="w-full"
                    >
                      + Karta qo'shish
                    </Button>
                  </div>
                </Card>

                {deckCards.length > 0 && (
                  <Card>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black text-white">
                        O'rganish
                      </h3>
                      <Badge color="blue">
                        {currentCard + 1}/{deckCards.length}
                      </Badge>
                    </div>
                    <div
                      className="min-h-[200px] p-6 rounded-xl bg-slate-800/60 border border-white/10 cursor-pointer flex items-center justify-center text-center"
                      onClick={() => setFlipped(!flipped)}
                    >
                      <div>
                        <p className="text-xs text-slate-500 mb-2">
                          {flipped ? "Javob" : "Savol"}
                        </p>
                        <p className="text-lg font-black text-white">
                          {flipped
                            ? deckCards[currentCard].back
                            : deckCards[currentCard].front}
                        </p>
                        <p className="text-xs text-slate-500 mt-4">
                          Bosing — aylantirish
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setCurrentCard((c) => Math.max(0, c - 1));
                          setFlipped(false);
                        }}
                        disabled={currentCard === 0}
                      >
                        ← Oldingi
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setCurrentCard((c) =>
                            Math.min(deckCards.length - 1, c + 1),
                          );
                          setFlipped(false);
                        }}
                        disabled={currentCard === deckCards.length - 1}
                      >
                        Keyingi →
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <EmptyState
                icon="🃏"
                title="Deck tanlang"
                description="Chapdagi ro'yxatdan deck tanlang va kartalar bilan ishlang."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
