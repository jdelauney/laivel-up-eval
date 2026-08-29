# Patterns Avancés LRS

## Table des Matières
1. [React 19 Ref Pattern](#react-19-ref)
2. [Compound Components](#compound-components)
3. [Render Props](#render-props)
4. [HOC et Wrappers Smart](#hoc-wrappers)
5. [State Management par Couche](#state-management)
6. [Form Field Generics](#form-generics)

---

## React 19 Ref Pattern {#react-19-ref}

React 19 simplifie les refs : plus besoin de `forwardRef`.

```tsx
// ❌ AVANT (React 18) - DÉPRÉCIÉ
import { forwardRef } from 'react';

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input ref={ref} {...props} />
));
Input.displayName = "Input";

// ✅ APRÈS (React 19) - ref comme prop standard
type InputProps = Readonly<{
  ref?: React.Ref<HTMLInputElement>;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}>;

function Input({ ref, className, ...props }: InputProps) {
  return <input ref={ref} className={className} {...props} />;
}
```

### Ref Cleanup (React 19)

```tsx
// React 19 supporte les cleanup functions pour les refs
function Component() {
  return (
    <input
      ref={(node) => {
        if (node) {
          console.log('Mounted:', node);
        }
        // Cleanup function appelée au unmount
        return () => {
          console.log('Cleanup');
        };
      }}
    />
  );
}
```

### useImperativeHandle avec React 19

```tsx
import { useRef, useImperativeHandle } from 'react';

type InputHandle = {
  focus: () => void;
  clear: () => void;
};

type CustomInputProps = Readonly<{
  ref?: React.Ref<InputHandle>;
  placeholder?: string;
}>;

function CustomInput({ ref, placeholder }: CustomInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { if (inputRef.current) inputRef.current.value = ''; }
  }));

  return <input ref={inputRef} placeholder={placeholder} />;
}

// Usage
function Parent() {
  const inputRef = useRef<InputHandle>(null);
  return (
    <>
      <CustomInput ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </>
  );
}
```

---

## Compound Components {#compound-components}

Pattern pour composants avec sous-éléments interdépendants.

> **Note:** Cet exemple utilise un Stepper custom. Pour Tabs, Accordion, Dialog, etc., utiliser les composants shadcn/ui.

```tsx
// lib/features/wizard/components/ui/composites/stepper.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type StepperContextValue = {
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isCompleted: (step: number) => boolean;
};

const StepperContext = createContext<StepperContextValue | null>(null);

const useStepperContext = () => {
  const ctx = useContext(StepperContext);
  if (!ctx) throw new Error('Stepper components must be within Stepper');
  return ctx;
};

type StepperProps = Readonly<{
  defaultStep?: number;
  children: ReactNode;
  onStepChange?: (step: number) => void;
}>;

export function Stepper({ defaultStep = 0, children, onStepChange }: StepperProps) {
  const [currentStep, setCurrentStep] = useState(defaultStep);
  const steps = Array.isArray(children) ? children : [children];
  const totalSteps = steps.filter(
    (child) => (child as React.ReactElement)?.type === Stepper.Step
  ).length;

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
      onStepChange?.(step);
    }
  };

  const nextStep = () => goToStep(currentStep + 1);
  const prevStep = () => goToStep(currentStep - 1);
  const isCompleted = (step: number) => step < currentStep;

  return (
    <StepperContext.Provider value={{ currentStep, totalSteps, goToStep, nextStep, prevStep, isCompleted }}>
      <div className="stepper-container">{children}</div>
    </StepperContext.Provider>
  );
}

type StepperListProps = Readonly<{ children: ReactNode }>;
Stepper.List = function StepperList({ children }: StepperListProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {children}
    </div>
  );
};

type StepperStepProps = Readonly<{ 
  index: number; 
  title: string;
  description?: string;
}>;
Stepper.Step = function StepperStep({ index, title, description }: StepperStepProps) {
  const { currentStep, isCompleted, goToStep } = useStepperContext();
  const isActive = currentStep === index;
  const completed = isCompleted(index);

  return (
    <button
      type="button"
      onClick={() => completed && goToStep(index)}
      className={cn(
        "flex items-center gap-3",
        completed && "cursor-pointer",
        !completed && !isActive && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center border-2",
        isActive && "border-primary bg-primary text-primary-foreground",
        completed && "border-primary bg-primary text-primary-foreground",
        !isActive && !completed && "border-muted-foreground"
      )}>
        {completed ? <Check className="h-5 w-5" /> : index + 1}
      </div>
      <div className="text-left">
        <p className={cn("font-medium", isActive && "text-primary")}>{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </button>
  );
};

type StepperContentProps = Readonly<{ step: number; children: ReactNode }>;
Stepper.Content = function StepperContent({ step, children }: StepperContentProps) {
  const { currentStep } = useStepperContext();
  if (currentStep !== step) return null;
  return <div className="stepper-content">{children}</div>;
};

type StepperActionsProps = Readonly<{ children: ReactNode }>;
Stepper.Actions = function StepperActions({ children }: StepperActionsProps) {
  return <div className="flex justify-between mt-8">{children}</div>;
};

// Hook pour accéder au contexte depuis l'extérieur
export function useStepperActions() {
  return useStepperContext();
}

// Usage
function WizardForm() {
  return (
    <Stepper defaultStep={0} onStepChange={(step) => console.log('Step:', step)}>
      <Stepper.List>
        <Stepper.Step index={0} title="Informations" description="Détails personnels" />
        <Stepper.Step index={1} title="Adresse" description="Localisation" />
        <Stepper.Step index={2} title="Confirmation" description="Vérification" />
      </Stepper.List>

      <Stepper.Content step={0}>
        <PersonalInfoForm />
      </Stepper.Content>
      
      <Stepper.Content step={1}>
        <AddressForm />
      </Stepper.Content>
      
      <Stepper.Content step={2}>
        <ConfirmationStep />
      </Stepper.Content>

      <StepperNavigation />
    </Stepper>
  );
}

function StepperNavigation() {
  const { currentStep, totalSteps, nextStep, prevStep } = useStepperActions();
  
  return (
    <Stepper.Actions>
      <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
        Précédent
      </Button>
      <Button onClick={nextStep} disabled={currentStep === totalSteps - 1}>
        {currentStep === totalSteps - 1 ? 'Terminer' : 'Suivant'}
      </Button>
    </Stepper.Actions>
  );
}
```

---

## Render Props {#render-props}

Pour logique réutilisable avec UI flexible.

```tsx
// composites/DataFetcher.tsx
import { useState, useEffect, type ReactNode } from 'react';

type FetchState<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
};

type DataFetcherProps<T> = Readonly<{
  queryFn: () => Promise<T>;
  children: (state: FetchState<T>) => ReactNode;
}>;

export function DataFetcher<T>({ queryFn, children }: DataFetcherProps<T>) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    queryFn()
      .then((data) => { if (!cancelled) setState({ data, isLoading: false, error: null }); })
      .catch((error) => { if (!cancelled) setState({ data: null, isLoading: false, error }); });
    return () => { cancelled = true; };
  }, [queryFn]);

  return <>{children(state)}</>;
}

// Usage
<DataFetcher queryFn={fetchUsers}>
  {({ data, isLoading, error }) => {
    if (isLoading) return <Skeleton />;
    if (error) return <ErrorMessage error={error} />;
    return <UserList users={data} />;
  }}
</DataFetcher>
```

---

## HOC et Wrappers Smart {#hoc-wrappers}

Transformer un Dumb en Smart via wrapper.

```tsx
// Pattern: Smart Wrapper explicite
// composites/ProductCard/ProductCard.tsx (Dumb)
type ProductCardProps = Readonly<{
  product: Product;
  onAddToCart: (id: string) => void;
}>;

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card>
      <ProductImage src={product.image} />
      <ProductInfo product={product} />
      <Button onClick={() => onAddToCart(product.id)}>Ajouter</Button>
    </Card>
  );
}

// composites/ProductCard/ProductCard.smart.tsx
type ProductCardSmartProps = Readonly<{ productId: string }>;

export function ProductCardSmart({ productId }: ProductCardSmartProps) {
  const { data: product } = useProduct(productId);
  const { addToCart } = useCart();
  
  if (!product) return <ProductCardSkeleton />;
  return <ProductCard product={product} onAddToCart={addToCart} />;
}
```

```tsx
// Pattern: withData HOC (usage avancé)
function withData<P extends object, D>(
  Component: React.ComponentType<P & { data: D }>,
  useDataHook: () => { data: D | undefined; isLoading: boolean }
) {
  return function WithDataComponent(props: Omit<P, 'data'>) {
    const { data, isLoading } = useDataHook();
    if (isLoading) return <ComponentSkeleton />;
    if (!data) return null;
    return <Component {...(props as P)} data={data} />;
  };
}
```

---

## State Management par Couche {#state-management}

### Éléments
Jamais d'état. UI transitoire géré par CSS (hover, focus).

### Composites
État local pour interactions UI uniquement :

```tsx
function Dropdown({ options, onSelect }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false); // ✅ État UI local OK
  // ...
}
```

### Sections
Connexion aux stores globaux + orchestration :

```tsx
// sections/CartSection.tsx
"use client";

export function CartSection() {
  const { items, total } = useCartStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleCheckout = useCallback(async () => {
    setIsProcessing(true);
    try {
      await processCheckout(items, user);
    } finally {
      setIsProcessing(false);
    }
  }, [items, user]);
  
  return (
    <section>
      <CartItemList items={items} />
      <CartSummary total={total} />
      <CheckoutButton onClick={handleCheckout} loading={isProcessing} />
    </section>
  );
}
```

### Zustand Pattern

```tsx
// stores/cartStore.ts
import { create } from 'zustand';

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  total: number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ 
    items: state.items.filter((i) => i.id !== id) 
  })),
  get total() {
    return get().items.reduce((sum, item) => sum + item.price, 0);
  },
}));
```

---

## Form Field Generics {#form-generics}

Pattern pour form fields réutilisables avec TanStack Form et shadcn/ui.

> **Note:** Utilise les composants `Field`, `FieldGroup`, `FieldLabel`, `FieldError` de shadcn/ui.
> Voir [documentation officielle](https://ui.shadcn.com/docs/forms/tanstack-form).

```tsx
// lib/features/profile/components/profile-form-container.tsx (Smart)
"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/lib/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/lib/components/ui/field";
import { Input } from "@/lib/components/ui/input";
import { User, Mail } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide"),
});

export function ProfileFormContainer() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
    validators: {
      onSubmit: profileSchema,
    },
    onSubmit: async ({ value }) => {
      // Logique de sauvegarde
      toast.success("Profil mis à jour");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        {/* Name Field */}
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Nom</FieldLabel>
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Jean Dupont"
                    className="pl-9"
                  />
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Email Field */}
        <form.Field
          name="email"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="nom@exemple.com"
                    className="pl-9"
                  />
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <FieldDescription>Votre adresse de contact</FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>

      <Button type="submit" className="mt-4 w-full">
        Enregistrer
      </Button>
    </form>
  );
}
```

### Composant Field Réutilisable (Dumb)

```tsx
// lib/features/forms/components/ui/composites/email-form-field.tsx (Dumb)
import { Mail } from "lucide-react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/lib/components/ui/field";
import { Input } from "@/lib/components/ui/input";
import type { FieldApi } from "@tanstack/react-form";

type EmailFormFieldProps = Readonly<{
  field: FieldApi<any, any, any, any, string>;
  label?: string;
  placeholder?: string;
  description?: string;
}>;

export function EmailFormField({
  field,
  label = "Email",
  placeholder = "nom@exemple.com",
  description,
}: EmailFormFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={field.name}
          name={field.name}
          type="email"
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          placeholder={placeholder}
          className="pl-9"
        />
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

// Usage dans un Smart Container
<form.Field
  name="email"
  children={(field) => (
    <EmailFormField field={field} label="Adresse email" />
  )}
/>
```

### Validation Modes

TanStack Form supporte différents modes de validation :

```tsx
const form = useForm({
  defaultValues: { email: "" },
  validators: {
    onSubmit: schema,    // Validation au submit
    onChange: schema,    // Validation à chaque changement
    onBlur: schema,      // Validation au blur
  },
});
```

### Array Fields

Pour les champs dynamiques (liste d'emails, etc.) :

```tsx
<form.Field
  name="emails"
  mode="array"
  children={(field) => (
    <FieldGroup>
      {field.state.value.map((_, index) => (
        <form.Field
          key={index}
          name={`emails[${index}].address`}
          children={(subField) => (
            <Field>
              <Input
                value={subField.state.value}
                onChange={(e) => subField.handleChange(e.target.value)}
              />
              <Button onClick={() => field.removeValue(index)}>
                Supprimer
              </Button>
            </Field>
          )}
        />
      ))}
      <Button onClick={() => field.pushValue({ address: "" })}>
        Ajouter un email
      </Button>
    </FieldGroup>
  )}
/>
```
