# Smart/Dumb Component Pattern

## Table des Matières
1. [Définitions](#definitions)
2. [Identification Smart vs Dumb](#identification)
3. [Data Flow](#data-flow)
4. [State Management](#state-management)
5. [Props Patterns](#props-patterns)
6. [React Query Integration](#react-query)
7. [Performance](#performance)
8. [Testing Strategy](#testing)
9. [Common Patterns](#common-patterns)
10. [Checklist](#checklist)

---

## Définitions {#definitions}

### Smart Component (Container)

**Purpose:** Logique, état, data fetching

**Caractéristiques:**
- Contient la logique métier
- Fetch data (React Query, hooks)
- Gère l'état local (useState, useReducer)
- Handle events (onClick, onSubmit)
- Orchestre les composants enfants
- Situé dans `components/` ou `sections/`

**Ce qu'il FAIT:**
- ✅ Appeler hooks (useQuery, useMutation, custom hooks)
- ✅ Gérer états (loading, error, data)
- ✅ Handle side effects (useEffect)
- ✅ Transformer data (map, filter, format)
- ✅ Passer data et handlers aux Dumb components

**Ce qu'il NE FAIT PAS:**
- ❌ Render UI complexe (délègue au Dumb)
- ❌ Manipulation DOM directe
- ❌ Logique de styling (délègue au Dumb)

---

### Dumb Component (Presentational)

**Purpose:** Pure UI presentation

**Caractéristiques:**
- Aucune logique métier
- Reçoit tout via props
- Stateless (ou état UI minimal)
- Réutilisable across features
- Facile à tester (snapshot tests)
- Situé dans `elements/`, `composites/`, ou `ui/`

**Ce qu'il FAIT:**
- ✅ Render éléments UI
- ✅ Appliquer styling (Tailwind classes)
- ✅ Afficher data passée via props
- ✅ Appeler prop functions (onClick, onChange)
- ✅ Gérer état UI uniquement (hover, focus)

**Ce qu'il NE FAIT PAS:**
- ❌ Fetch data (pas de hooks data)
- ❌ Logique métier (pas de calculs)
- ❌ Global state management
- ❌ Side effects avec API calls

---

## Identification Smart vs Dumb {#identification}

**Questions à se poser:**

| Question | Oui → | Non → |
|----------|-------|-------|
| Doit fetch des données ? | Smart | Dumb |
| Gère un état complexe ? | Smart | Dumb |
| Réutilisable across features ? | Dumb | Peut être les deux |
| Contient logique métier ? | Smart | Dumb |
| Transforme/calcule des données ? | Smart | Dumb |
| Pure présentation ? | Dumb | Smart |

**Règle d'or:** En cas de doute, commencer Dumb. Extraire en Smart uniquement quand nécessaire.

---

## Data Flow {#data-flow}

### Flow Typique

```
Server → React Query → Hook → Smart Component → Dumb Component → UI
```

**1. Server fournit data**
- Server Action ou API endpoint
- Retourne JSON

**2. React Query fetch**
- useQuery hook
- Cache data
- Handle loading/error

**3. Custom Hook encapsule (optionnel)**
- Wrap useQuery
- Transforme data si besoin
- Retourne interface clean

**4. Smart Component consomme**
- Appelle hook
- Récupère data, loading, error
- Prépare data pour UI

**5. Dumb Component render**
- Reçoit data via props
- Affiche UI
- Appelle prop functions sur events

### Exemple Concret

```tsx
// lib/features/cards/hooks/use-cards.ts
export function useCards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cards'],
    queryFn: getCards
  });
  return { cards: data ?? [], isLoading, error };
}

// lib/features/cards/components/cards-list-container.tsx (Smart)
"use client";
export function CardsListContainer() {
  const { cards, isLoading, error } = useCards();
  const handleCardClick = useCallback((id: string) => {
    router.push(`/cards/${id}`);
  }, []);
  
  if (isLoading) return <CardsListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!cards.length) return <EmptyState message="Aucune carte" />;
  
  return <CardsListDisplay cards={cards} onCardClick={handleCardClick} />;
}

// lib/features/cards/components/ui/composites/cards-list-display.tsx (Dumb)
type CardsListDisplayProps = Readonly<{
  cards: Card[];
  onCardClick: (id: string) => void;
}>;

export function CardsListDisplay({ cards, onCardClick }: CardsListDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} onClick={() => onCardClick(card.id)} />
      ))}
    </div>
  );
}
```

---

## State Management {#state-management}

### Local State (Smart Component)

**useState pour:**
- État UI (modal open, selected items)
- État form (si pas TanStack Form)
- État temporaire (search query, filters)

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [isModalOpen, setIsModalOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
```

### Server State (React Query)

**useQuery pour:**
- Data du server (GET requests)
- Cache management
- Background refetching

**useMutation pour:**
- Mutations (POST, PUT, DELETE)
- Optimistic updates
- Error handling

```tsx
// Query
const { data, isLoading } = useQuery({
  queryKey: ['cards', filters],
  queryFn: () => getCards(filters)
});

// Mutation
const mutation = useMutation({
  mutationFn: createCard,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['cards'] });
    toast.success('Carte créée');
  }
});
```

### Global State (Zustand)

**Utiliser pour:**
- User session
- Theme
- i18n locale
- Global UI state (sidebar open)

**Éviter pour:**
- Server data (utiliser React Query)
- Feature-specific state (utiliser local state)

```tsx
// stores/ui-store.ts
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

---

## Props Patterns {#props-patterns}

### Types de Props

```tsx
type ComponentProps = Readonly<{
  // Data Props - données à afficher
  title: string;
  count: number;
  card: Card;
  items: Item[];
  
  // Handler Props - fonctions d'événements
  onClick: () => void;
  onSelect: (id: string) => void;
  onSubmit: () => Promise<void>;
  
  // UI Props - états visuels
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  
  // Children - composition
  children?: React.ReactNode;
  
  // Ref - React 19
  ref?: React.Ref<HTMLDivElement>;
}>;
```

### Patterns de Props

```tsx
// Pattern 1: Props avec defaults
function Button({
  variant = 'default',
  size = 'md',
  disabled = false,
  ...props
}: ButtonProps) { }

// Pattern 2: Props conditionnelles
type CardProps = Readonly<
  | { variant: 'link'; href: string; onClick?: never }
  | { variant: 'button'; onClick: () => void; href?: never }
>;

// Pattern 3: Props génériques (forms)
type FormFieldProps<T extends FieldValues> = Readonly<{
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
}>;

// Pattern 4: Polymorphic props
type BoxProps<C extends React.ElementType> = {
  as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, 'as'>;
```

---

## React Query Integration {#react-query}

### Queries (Data Fetching)

```tsx
// hooks/use-products.ts
export function useProducts(categoryId?: string) {
  return useQuery({
    queryKey: ['products', { categoryId }],
    queryFn: () => getProducts(categoryId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Avec pagination
export function useProductsPaginated(page: number) {
  return useQuery({
    queryKey: ['products', 'list', page],
    queryFn: () => getProductsPage(page),
    placeholderData: keepPreviousData, // Garde data précédente pendant fetch
  });
}
```

### Mutations

```tsx
// hooks/use-card-actions.ts
export function useCardActions() {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: createCard,
    onSuccess: (newCard) => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Carte créée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Carte supprimée');
    }
  });
  
  return {
    createCard: createMutation.mutate,
    deleteCard: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

### Optimistic Updates

```tsx
const updateMutation = useMutation({
  mutationFn: updateCard,
  onMutate: async (updatedCard) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['cards'] });
    
    // Snapshot previous value
    const previousCards = queryClient.getQueryData(['cards']);
    
    // Optimistically update
    queryClient.setQueryData(['cards'], (old: Card[]) =>
      old.map((card) => card.id === updatedCard.id ? updatedCard : card)
    );
    
    return { previousCards };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['cards'], context?.previousCards);
    toast.error('Erreur lors de la mise à jour');
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['cards'] });
  }
});
```

---

## Performance {#performance}

### React.memo

**Quand utiliser:**
- Dumb component re-render inutilement
- Props identiques fréquemment
- Rendering coûteux

```tsx
export const CardDisplay = memo(function CardDisplay({ card }: CardDisplayProps) {
  return <div>{/* ... */}</div>;
});

// Avec comparaison custom
export const ExpensiveList = memo(
  function ExpensiveList({ items }: Props) { /* ... */ },
  (prevProps, nextProps) => prevProps.items.length === nextProps.items.length
);
```

### useMemo / useCallback

```tsx
// useMemo pour calculs coûteux
const sortedCards = useMemo(
  () => cards.sort((a, b) => a.name.localeCompare(b.name)),
  [cards]
);

const filteredCards = useMemo(
  () => cards.filter((card) => card.status === filter),
  [cards, filter]
);

// useCallback pour handlers passés à composants mémoïsés
const handleClick = useCallback((id: string) => {
  setSelectedId(id);
}, []);

const handleSubmit = useCallback(async (data: FormData) => {
  await mutation.mutateAsync(data);
}, [mutation]);
```

### Code Splitting

```tsx
import { lazy, Suspense } from 'react';

// Lazy load composants lourds
const HeavyChart = lazy(() => import('./heavy-chart'));
const PDFViewer = lazy(() => import('./pdf-viewer'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

---

## Testing Strategy {#testing}

### Testing Dumb Components

**Approche:** Snapshot + Props testing

**Quoi tester:**
- Render correct avec props
- Affiche data correctement
- Appelle event handlers
- Gère edge cases (empty, null)

```tsx
// __tests__/card-display.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardDisplay } from '../card-display';

describe('CardDisplay', () => {
  const mockCard = { id: '1', name: 'John', title: 'CEO' };
  
  it('renders card data correctly', () => {
    render(<CardDisplay card={mockCard} />);
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<CardDisplay card={mockCard} onClick={handleClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith('1');
  });
  
  it('handles empty state', () => {
    render(<CardDisplay card={null} />);
    expect(screen.getByText('No card')).toBeInTheDocument();
  });
});
```

### Testing Smart Components

**Approche:** Integration testing avec mocks

**Quoi tester:**
- Data fetching fonctionne
- Loading state s'affiche
- Error state s'affiche
- Data passée correctement au Dumb
- Event handlers trigger mutations

```tsx
// lib/features/cards/components/__tests__/cards-list-container.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { CardsListContainer } from '../cards-list-container';

// Mock the hook
vi.mock('../../hooks/use-cards', () => ({
  useCards: vi.fn()
}));

describe('CardsListContainer', () => {
  const queryClient = new QueryClient();
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('shows loading state', () => {
    useCards.mockReturnValue({ cards: [], isLoading: true, error: null });
    render(<CardsListContainer />, { wrapper });
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });
  
  it('shows error state', () => {
    useCards.mockReturnValue({ cards: [], isLoading: false, error: new Error('Failed') });
    render(<CardsListContainer />, { wrapper });
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
  
  it('renders cards when loaded', async () => {
    useCards.mockReturnValue({
      cards: [{ id: '1', name: 'Card 1' }],
      isLoading: false,
      error: null
    });
    render(<CardsListContainer />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Card 1')).toBeInTheDocument();
    });
  });
});
```

---

## Common Patterns {#common-patterns}

### Pattern 1: List with Items

```
lib/features/products/
├── components/
│   ├── products-list-container.tsx     # Smart
│   └── ui/composites/
│       ├── products-list-display.tsx   # Dumb
│       └── product-card.tsx            # Dumb

Smart: ProductsListContainer
├── Fetch products
├── Handle pagination
├── Handle selection
└── Render → ProductsListDisplay

Dumb: ProductsListDisplay (ui/composites/)
├── Render grid/list
├── Map products → ProductCard
└── Show empty state

Dumb: ProductCard (ui/composites/)
├── Render single product
├── Receive via props
└── Reusable
```

### Pattern 2: Detail View

```
lib/features/contacts/
├── components/
│   ├── contact-detail-container.tsx    # Smart
│   └── ui/
│       ├── composites/
│       │   └── contact-detail-display.tsx
│       └── sections/
│           └── contact-info-section.tsx

Smart: ContactDetailContainer
├── Fetch contact by ID
├── Handle tabs (info, notes, activity)
├── Manage edit mode
└── Render → ContactDetailDisplay

Dumb: ContactDetailDisplay (ui/composites/)
├── Display contact info
├── Tabs navigation
└── Action buttons

Dumb: ContactInfoSection (ui/sections/)
├── Pure info display
└── Reusable in other views
```

### Pattern 3: Form with Preview

```
lib/features/cards/
├── components/
│   ├── card-form-container.tsx         # Smart
│   └── ui/composites/
│       ├── card-form-fields.tsx        # Dumb
│       └── card-preview.tsx            # Dumb

Smart: CardFormContainer
├── Manage form state
├── Handle submission
├── Generate preview data
└── Render → CardFormFields + CardPreview

Dumb: CardFormFields (ui/composites/)
├── Input fields
├── Validation errors
└── Submit button

Dumb: CardPreview (ui/composites/)
├── Live preview
└── Updates as user types
```

---

## Checklist {#checklist}

### Dumb Component ✓
- [ ] Pure UI component (pas de logique)
- [ ] Props interface `Readonly<{}>` définie
- [ ] Utilise shadcn/ui components
- [ ] Responsive (mobile-first)
- [ ] Accessible (semantic HTML, ARIA)
- [ ] Réutilisable (pas feature-specific)
- [ ] Pas de hooks data (useQuery, etc.)

### Smart Component ✓
- [ ] Utilise React Query pour data
- [ ] Handle loading/error/empty states
- [ ] Event handlers définis avec useCallback
- [ ] Passe data au Dumb component
- [ ] Pas de rendering UI direct (délègue)
- [ ] `"use client"` si client-side

### Integration ✓
- [ ] Smart render Dumb avec props corrects
- [ ] Data flow correct
- [ ] Events trigger correctement
- [ ] Performance optimisée (memo si besoin)
- [ ] Tests couvrent les états

### Accessibilité ✓
- [ ] Semantic HTML (`<article>`, `<section>`, `<nav>`)
- [ ] Heading hierarchy (`<h1>`, `<h2>`)
- [ ] ARIA attributes quand nécessaire
- [ ] Keyboard navigation
- [ ] Focus management
