"use client";

import { useState } from "react";
import { Card, CardTitle } from "./Card";
import { ShoppingItemForm } from "./ShoppingItemForm";
import { groupByAisle, remainingCount } from "@/lib/shopping";
import { useShoppingList } from "@/lib/useShoppingList";
import type { ShoppingItem } from "@/lib/types";

export function ShoppingListView() {
  const { items, addItem, updateItem, toggleItem, deleteItem, clearChecked } = useShoppingList();
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [quickLabel, setQuickLabel] = useState("");

  const groups = groupByAisle(items);
  const left = remainingCount(items);
  const hasChecked = items.some((item) => item.checked);

  function handleQuickAdd(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    const label = quickLabel.trim();
    if (!label) return;
    addItem({ label });
    setQuickLabel("");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4 pb-28 sm:p-6 md:pb-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            {left === 0 ? "Tout est dans le caddie 🎉" : `${left} article${left > 1 ? "s" : ""} à prendre`}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            🛒 Liste de courses
          </h1>
        </div>
        {hasChecked ? (
          <button
            type="button"
            onClick={clearChecked}
            className="min-h-11 rounded-pill bg-white px-4 text-sm font-bold text-ink-soft hover:bg-cream-deep"
          >
            Vider les articles cochés
          </button>
        ) : null}
      </header>

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          type="text"
          value={quickLabel}
          onChange={(changeEvent) => setQuickLabel(changeEvent.target.value)}
          placeholder="Ajouter un article…"
          className="min-h-14 w-full flex-1 rounded-pill border border-line bg-white px-5 text-base font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-sage focus:ring-2 focus:ring-sage-soft"
        />
        <button
          type="submit"
          className="min-h-14 shrink-0 rounded-pill bg-sage px-5 text-base font-extrabold text-white hover:brightness-95"
        >
          ＋
        </button>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="hidden min-h-14 shrink-0 rounded-pill bg-white px-4 text-sm font-bold text-ink-soft hover:bg-cream-deep sm:block"
        >
          Détails
        </button>
      </form>

      {items.length === 0 ? (
        <Card>
          <p className="px-2 py-8 text-center text-base font-semibold text-ink-soft">
            La liste est vide. 🌿
          </p>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.aisle}>
            <CardTitle title={group.aisle} />
            <ul className="flex flex-col gap-2">
              {group.items.map((item) => (
                <li key={item.id}>
                  <div
                    className={`flex items-center gap-3 rounded-3xl border px-4 py-3 ${
                      item.checked ? "border-line bg-cream-deep/50" : "border-line bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      aria-pressed={item.checked}
                      aria-label={item.checked ? "Décocher cet article" : "Cocher cet article"}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-lg ${
                        item.checked
                          ? "border-sage bg-sage text-white"
                          : "border-line bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span
                        className={`block truncate text-base font-extrabold ${
                          item.checked ? "text-ink-faint line-through" : "text-ink"
                        }`}
                      >
                        {item.label}
                        {item.quantity ? (
                          <span className="ml-2 text-xs font-semibold text-ink-faint">
                            {item.quantity}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}

      {editing || creating ? (
        <ShoppingItemForm
          item={editing ?? undefined}
          onSave={(values) => {
            if (editing) {
              updateItem(editing.id, values);
            } else {
              addItem(values);
            }
            setEditing(null);
            setCreating(false);
          }}
          onDelete={
            editing
              ? () => {
                  deleteItem(editing.id);
                  setEditing(null);
                }
              : undefined
          }
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      ) : null}
    </div>
  );
}
