---
name: lrs-atomic-design
description: Architecture React 19+ avec Layer React Structure (LRS) et Atomic Design adapté. Utiliser pour structurer des composants React/Next.js en Éléments/Composites/Sections avec pattern Smart/Dumb (Container/Presentational). Déclencher lors de création de composants, refactoring d'architecture, design systems, séparation logique/UI, data fetching patterns, ou organisation de composants. Inclut syntaxe React 19 (ref as prop), React Query integration, et testing strategy.
---

# LRS - Layer React Structure

Architecture React 19+ combinant Atomic Design adapté et pattern Smart/Dumb pour séparation claire des responsabilités.

## Hiérarchie des Composants

```
/features/[feature]/
├── components/                    # Smart Components (Containers)
│   ├── [feature]-list-container.tsx
│   ├── [feature]-detail-container.tsx
│   └── ui/                        # Dumb Components (Presentational)
│       ├── elements/              # Primitifs atomiques (Dumb uniquement)
│       ├── composites/            # Assemblages d'éléments (Dumb)
│       └── sections/              # Blocs UI complets (Dumb)
├── hooks/                         # Custom Hooks (useQuery, useMutation)
│   ├── use-[feature].ts
│   └── use-[feature]-actions.ts
└── types/
    └── [feature].types.ts
```
### Partie Publique

```
/src/components/pages/public/[page-name]
├── sections/              
│   ├── [section-name].tsx
│   ├── [section-name].tsx
├── [specific-component]
│   ├── [specific-component].ts

```


**Principe clé:** Les Smart Components (containers) orchestrent, les Dumb Components (ui/) présentent.

## Pattern Smart/Dumb - Vue d'Ensemble

| Aspect | Dumb (Presentational) | Smart (Container) |
|--------|----------------------|-------------------|
| **Purpose** | Pure UI | Logique + Data |
| **État** | Props uniquement | useState, useQuery, stores |
| **Data** | Reçoit via props | Fetch, mutations |
| **Logique** | UI uniquement | Métier + orchestration |
| **Localisation** | `elements/`, `composites/`, `ui/` | `sections/`, `components/` |
| **Test** | Snapshot + props | Integration + mocks |

### Identification Rapide

```
Doit fetch des données ?      → Smart
Gère un état complexe ?       → Smart
Réutilisable across features? → Dumb
Contient logique métier ?     → Smart
Pure présentation ?           → Dumb
```

**Règle d'or:** Commencer Dumb, extraire en Smart uniquement si nécessaire.

Pour pattern Smart/Dumb complet → voir [./references/smart-dumb.md](references/smart-dumb.md)

## Éléments (Atoms) - Toujours Dumb

Composants primitifs sans logique métier. Props `Readonly<{}>` obligatoire.

```tsx
// lib/features/cards/components/ui/elements/base-input.tsx
import type { LucideIcon } from "lucide-react";
import { useId } from "react";
import { Input } from "@/lib/components/ui/input";
import { cn } from "@/lib/utils";

export type BaseInputProps = Readonly<{
  id?: string;
  name?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  // React 19: ref as prop (NO forwardRef)
  ref?: React.Ref<HTMLInputElement>;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}>;

export function BaseInput({
  id,
  type = "text",
  icon: Icon,
  iconPosition = "left",
  className,
  ref,
  ...props
}: BaseInputProps) {
  const autoId = useId();
  const inputId = id || `input-${type}-${autoId}`;

  if (Icon) {
    return (
      <div className="relative">
        <Input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(iconPosition === "left" ? "pl-9" : "pr-9", className)}
          {...props}
        />
        <Icon className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
          iconPosition === "left" ? "left-3" : "right-3"
        )} />
      </div>
    );
  }

  return <Input ref={ref} id={inputId} type={type} className={className} {...props} />;
}
```

**Règles Éléments** :
- ❌ Aucun `useState`, aucun fetch, aucune logique métier
- ❌ Pas de useEffect avec API calls
- ✅ Props `Readonly<{}>` avec types exhaustifs
- ✅ `ref` comme prop directe (React 19)
- ✅ `useId()` pour IDs auto-générés
- ✅ Variants via CVA (`class-variance-authority`)

## Composites (Molecules) - Dumb par défaut

Assemblages d'éléments. État UI local autorisé, pas de fetch.

```tsx
// lib/features/cards/components/ui/composites/search-form-field.tsx (Dumb avec état UI)
import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { BaseInput } from '../elements/base-input';
import { Button } from "@/lib/components/ui/button";

type SearchFormFieldProps = Readonly<{
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}>;

export function SearchFormField({
  value,
  onSearch,
  placeholder = "Rechercher...",
  disabled = false
}: SearchFormFieldProps) {
  // État UI local OK dans Dumb
  const [internalValue, setInternalValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    onSearch(e.target.value);
  };

  const handleClear = useCallback(() => {
    setInternalValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="relative">
      <BaseInput
        type="search"
        icon={Search}
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      {internalValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
```

**Règles Composites Dumb** :
- ✅ État UI local (hover, open, internal value)
- ✅ Combiner 2-5 éléments maximum
- ❌ Pas de useQuery, useMutation
- ❌ Pas de logique métier

## Sections (Organisms) - Smart, Orchestration

Blocs complets avec fetch, mutations, et logique métier.

```tsx
// lib/features/cards/components/cards-list-container.tsx (Smart)
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCards } from "../hooks/use-cards";
import { useCardActions } from "../hooks/use-card-actions";
import { CardsListDisplay } from "./ui/composites/cards-list-display";
import { CardsListSkeleton } from "./ui/composites/cards-list-skeleton";
import { ErrorMessage } from "@/components/ui/error-message";
import { EmptyState } from "@/components/ui/empty-state";

export function CardsListContainer() {
  const router = useRouter();
  const { cards, isLoading, error } = useCards();
  const { deleteCard, isDeleting } = useCardActions();

  const handleCardClick = useCallback((id: string) => {
    router.push(`/cards/${id}`);
  }, [router]);

  const handleDelete = useCallback((id: string) => {
    deleteCard(id);
  }, [deleteCard]);

  // États clairement séparés
  if (isLoading) return <CardsListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!cards.length) return <EmptyState message="Aucune carte trouvée" />;

  // Délègue le rendu au Dumb component
  return (
    <CardsListDisplay
      cards={cards}
      onCardClick={handleCardClick}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    />
  );
}
```

**Règles Sections Smart** :
- ✅ `"use client"` obligatoire
- ✅ useQuery, useMutation, custom hooks
- ✅ Handle loading/error/empty states
- ✅ `useCallback` pour handlers passés aux enfants
- ✅ Orchestration de plusieurs composants
- ❌ Pas de rendu UI complexe (délègue au Dumb)

## Custom Hooks Pattern

Encapsuler logique data fetching pour réutilisabilité.

```tsx
// hooks/use-cards.ts
import { useQuery } from '@tanstack/react-query';
import { getCards } from '../actions/cards';

export function useCards(filters?: CardFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cards', filters],
    queryFn: () => getCards(filters),
  });
  
  return { cards: data ?? [], isLoading, error };
}

// hooks/use-card-actions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCard, updateCard } from '../actions/cards';
import { toast } from 'sonner';

export function useCardActions() {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Carte supprimée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
  
  return {
    deleteCard: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
```

## Data Flow

```
Server → React Query → Hook → Smart (Section) → Dumb (Composite/Element) → UI
                                    ↓
                              Handle events
                                    ↓
                              Mutations → Server
```

## React 19 : ref comme Prop

```tsx
// ❌ AVANT (React 18) - DÉPRÉCIÉ
const Input = forwardRef<HTMLInputElement, Props>((props, ref) => (
  <input ref={ref} {...props} />
));

// ✅ APRÈS (React 19) - ref comme prop standard
type InputProps = Readonly<{
  ref?: React.Ref<HTMLInputElement>;
  // autres props...
}>;

function Input({ ref, ...props }: InputProps) {
  return <input ref={ref} {...props} />;
}
```

## Base UI : Hydration SSR et IDs Stables

Les composants Base UI (Tabs, Menu, Dialog) génèrent des IDs internes via `useId()`. Sans `id` explicite, ces IDs peuvent différer entre SSR et hydration client, causant des erreurs.

### Problème : Hydration Mismatch

```
❌ Erreur console :
A tree hydrated but some attributes of the server rendered HTML
didn't match the client properties.
id="base-ui-_R_5klritqitperqlb_" vs id="base-ui-_R_minebnaitperqlb_"
```

### Solution : Prop `id` Explicite

**Toujours passer un `id` stable aux composants Base UI racines :**

```tsx
// ✅ Tabs avec id stable
<Tabs id="testimonials-admin-tabs" value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="requests">Demandes</TabsTrigger>
    <TabsTrigger value="testimonials">Témoignages</TabsTrigger>
  </TabsList>
  <TabsContent value="requests">...</TabsContent>
</Tabs>

// ✅ DropdownMenu avec id stable (dans une liste)
{items.map((item) => (
  <DropdownMenu id={`actions-menu-${item.id}`} key={item.id}>
    <DropdownMenuTrigger>...</DropdownMenuTrigger>
    <DropdownMenuContent>...</DropdownMenuContent>
  </DropdownMenu>
))}
```

### Pattern : Prop `id` dans les Composants Wrapper

Pour les composants qui encapsulent Base UI, propager la prop `id` :

```tsx
// components/ui/actions-menu.tsx
export type ActionsMenuProps = Readonly<{
  items: ReadonlyArray<ActionItem>;
  disabled?: boolean;
  id?: string;  // ← Ajouter prop id
}>;

export function ActionsMenu({ items, disabled, id }: ActionsMenuProps) {
  return (
    <DropdownMenu id={id}>  {/* ← Passer l'id */}
      <DropdownMenuTrigger>...</DropdownMenuTrigger>
      <DropdownMenuContent>...</DropdownMenuContent>
    </DropdownMenu>
  );
}

// Utilisation dans une table
<ActionsMenu
  id={`request-actions-${request.id}`}  {/* ← ID unique par ligne */}
  items={actions}
  disabled={isLoading}
/>
```

### Composants Concernés

| Composant Base UI | Prop `id` requise |
|-------------------|-------------------|
| `Tabs` | ✅ Oui - racine |
| `Menu` (DropdownMenu) | ✅ Oui - racine |
| `Dialog` | ✅ Oui - racine |
| `Popover` | ✅ Oui - racine |
| `Select` | ✅ Oui - racine |

**Règle :** Tout composant Base UI avec enfants interactifs (triggers, panels) nécessite un `id` stable pour SSR.

## Structure de Fichiers

```
lib/features/cards/
├── components/
│   ├── cards-list-container.tsx      # Smart - fetch + orchestration
│   ├── cards-detail-container.tsx    # Smart - fetch + orchestration
│   ├── cards-form-container.tsx      # Smart - form state + mutations
│   └── ui/
│       ├── elements/
│       │   ├── card-avatar.tsx       # Dumb - primitif
│       │   ├── card-badge.tsx        # Dumb - primitif
│       │   └── index.ts
│       ├── composites/
│       │   ├── card-item.tsx         # Dumb - assemblage
│       │   ├── cards-list-display.tsx # Dumb - liste
│       │   ├── cards-list-skeleton.tsx
│       │   └── index.ts
│       ├── sections/
│       │   ├── card-header-section.tsx # Dumb - bloc UI
│       │   ├── card-actions-section.tsx
│       │   └── index.ts
│       └── index.ts
├── hooks/
│   ├── use-cards.ts                  # Query hook
│   └── use-card-actions.ts           # Mutation hook
├── types/
│   └── cards.types.ts
└── index.ts
```

## Conventions de Nommage

| Aspect | Convention |
|--------|------------|
| Fichiers | kebab-case (`base-input.tsx`) |
| Composants | PascalCase (`BaseInput`) |
| Props | `type XxxProps = Readonly<{}>` |
| Hooks | `use-xxx.ts` → `useXxx` |
| Smart (containers) | `[feature]-xxx-container.tsx` |
| Dumb elements | descriptif simple (`card-avatar.tsx`) |
| Dumb composites | `-display`, `-item`, `-list` |
| Dumb sections | `-section` (blocs UI) |
| Variants CVA | `.variants.ts` séparé |

### Localisation

| Type | Dossier | Exemple |
|------|---------|---------|
| Smart | `components/` | `cards-list-container.tsx` |
| Dumb Element | `components/ui/elements/` | `card-avatar.tsx` |
| Dumb Composite | `components/ui/composites/` | `cards-list-display.tsx` |
| Dumb Section | `components/ui/sections/` | `card-header-section.tsx` |
| Hook | `hooks/` | `use-cards.ts` |

## Références

| Fichier | Contenu |
|---------|---------|
| [smart-dumb.md](./references/smart-dumb.md) | Pattern complet : data flow, state management, React Query, props patterns, performance, testing, checklist |
| [patterns.md](./references/patterns.md) | React 19 ref, compound components, HOC, form generics |
| [examples.md](./references/examples.md) | BaseInput, Button CVA, DialogHeader, Sections complètes |
