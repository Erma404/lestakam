"use client";

import { useState } from "react";
import { Card, CardTitle } from "./Card";
import { ShoppingItemForm } from "./ShoppingItemForm";
import { Icon } from "./Icon";
import { useSaveConfirmation } from "./SaveConfirmation";
import { groupByAisle, remainingCount } from "@/lib/shopping";
import { useShoppingList } from "@/lib/useShoppingList";
import type { ShoppingItem } from "@/lib/types";

export function ShoppingListView() {
  const { items, addItem, updateItem, toggleItem, deleteItem, clearChecked } = useShoppingList();
  const { confirm, dialog: confirmationDialog } = useSaveConfirmation();
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
          <p className="text-base text-ink-soft">
            {left === 0 ? "Tout est dans le caddie" : `${left} article${left > 1 ? "s" : ""} à prendre`}
          </p>
          <h1 className="font-display text-3xl font-medium text-ink sm:text-4xl">Liste de courses</h1>
        </div>
        {hasChecked ? (
          <button
            type="button"
            onClick={clearChecked}
            className="min-h-11 px-2 text-sm font-medium text-coral hover:underline"
          >
            Vider les articles cochés
          </button>
        ) : null}
      </header>

      <form onSubmit={handleQuickAdd} className="relative flex gap-2">
        <input
          type="text"
          value={quickLabel}
          onChange={(changeEvent) => setQuickLabel(changeEvent.target.value)}
          placeholder="Ajouter un article…"
          className="min-h-14 w-full flex-1 rounded-pill bg-surface px-5 text-base font-medium text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-coral/30"
        />
        <button
          type="submit"
          aria-label="Ajouter à la liste"
          className="btn-pop btn-pop-coral h-14 w-14 shrink-0"
        >
          <Icon name="plus" className="h-6 w-6" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="hidden min-h-14 shrink-0 rounded-pill bg-surface px-4 text-sm font-medium text-ink-soft hover:bg-cream-deep sm:block"
        >
          Détails
        </button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-card bg-surface px-5 py-8 text-center text-base text-ink-soft">
          La liste est vide. Ajoutez un article ci-dessus, ou depuis une recette.
        </p>
      ) : (
        groups.map((group) => (
          <Card key={group.aisle}>
            <CardTitle title={group.aisle} />
            <ul className="flex flex-col divide-y divide-dashed divide-line">
              {group.items.map((item) => (
                <li key={item.id}>
                  <div className="flex items-center gap-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      aria-pressed={item.checked}
                      aria-label={item.checked ? "Décocher cet article" : "Cocher cet article"}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        item.checked ? "border-sage bg-sage text-white" : "border-line text-transparent"
                      }`}
                    >
                      <Icon name="check" className="h-5 w-5" strokeWidth={2.4} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span
                        className={`block truncate text-base ${
                          item.checked ? "text-ink-faint line-through" : "text-ink"
                        }`}
                      >
                        {item.label}
                        {item.quantity ? (
                          <span className="ml-2 text-sm text-ink-soft">
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
              confirm({ title: "Article modifié", detail: values.label });
            } else {
              addItem(values);
              confirm({ title: "Ajouté à la liste", detail: values.label });
            }
            setEditing(null);
            setCreating(false);
          }}
          onDelete={
            editing
              ? () => {
                  deleteItem(editing.id);
                  confirm({ kind: "deleted", title: "Article supprimé", detail: editing.label });
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

      {confirmationDialog}
    </div>
  );
}
