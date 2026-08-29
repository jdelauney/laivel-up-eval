# Exemples Concrets LRS (React 19)

## Table des Matières
1. [Élément : BaseInput avec Icon](#element-baseinput)
2. [Élément : Button avec CVA](#element-button)
3. [Composite : DialogHeader](#composite-dialogheader)
4. [Composite : SearchFormField](#composite-searchformfield)
5. [Smart Container : CardsListContainer](#smart-cardslist)
6. [Smart Container : StandardDialogContainer](#smart-dialog)
7. [Smart Container : ContactFormContainer](#smart-contact)
8. [Composite : FormField Réutilisable](#composite-formfield)
9. [Structure Projet Complète](#structure-projet)

---

## Élément : BaseInput avec Icon {#element-baseinput}

```
lib/features/forms/components/ui/elements/
├── base-input.tsx
├── email-input.tsx
├── password-input.tsx
└── index.ts
```

```tsx
// lib/features/forms/components/ui/elements/base-input.tsx
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
  autoComplete?: string;
  autoFocus?: boolean;
  className?: string;
  
  // Icon support
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  iconClassName?: string;
  
  // Event handlers
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  
  // React 19: ref as prop (NO forwardRef)
  ref?: React.Ref<HTMLInputElement>;
  
  // Accessibility
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  
  // Number input specific
  min?: number;
  max?: number;
  step?: number;
}>;

export function BaseInput({
  id,
  type = "text",
  icon: Icon,
  iconPosition = "left",
  iconClassName = "h-4 w-4 text-muted-foreground",
  className,
  ref,
  ...props
}: BaseInputProps) {
  const autoId = useId();
  const inputId = id || `input-${type}-${autoId}`;

  if (Icon) {
    const iconSpacing = iconPosition === "left" ? "pl-9" : "pr-9";
    const iconPositionClass = iconPosition === "left" ? "left-3" : "right-3";

    return (
      <div className="relative">
        <Input 
          ref={ref}
          className={cn(iconSpacing, className)} 
          id={inputId} 
          type={type} 
          {...props} 
        />
        <Icon className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2",
          iconPositionClass,
          iconClassName
        )} />
      </div>
    );
  }

  return <Input ref={ref} className={className} id={inputId} type={type} {...props} />;
}
```

```tsx
// lib/features/forms/components/ui/elements/email-input.tsx
import { Mail } from "lucide-react";
import { BaseInput, type BaseInputProps } from "./base-input";

export type EmailInputProps = Omit<BaseInputProps, "type">;

export function EmailInput({
  placeholder = "nom@exemple.com",
  autoComplete = "email",
  icon = Mail,
  ...props
}: EmailInputProps) {
  return (
    <BaseInput
      type="email"
      autoComplete={autoComplete}
      icon={icon}
      placeholder={placeholder}
      {...props}
    />
  );
}
```

---

## Élément : Button avec CVA {#element-button}

```
lib/components/ui/Button/
├── button.tsx
├── button.variants.ts
└── index.ts
```

```tsx
// lib/components/ui/Button/button.variants.ts
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
```

```tsx
// lib/components/ui/Button/button.tsx
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonVariants } from './button.variants';

export type ButtonProps = Readonly<
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonVariants & {
    asChild?: boolean;
    isLoading?: boolean;
    // React 19: ref as prop
    ref?: React.Ref<HTMLButtonElement>;
  }
>;

export function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading,
  children,
  disabled,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Chargement...
        </>
      ) : (
        children
      )}
    </Comp>
  );
}
```

---

## Composite : DialogHeader {#composite-dialogheader}

```tsx
// lib/features/dialogs/components/ui/composites/dialog-header.tsx
import type { LucideIcon } from 'lucide-react';
import { DialogTitle, DialogDescription } from "@/lib/components/ui/dialog";
import { Button } from "@/lib/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogHeaderProps = Readonly<{
  title: string;
  description?: string;
  descriptionId?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive' | 'warning';
  showCloseButton?: boolean;
  onClose?: () => void;
}>;

const variantStyles = {
  default: "border-b border-border",
  destructive: "border-b border-destructive/20 bg-destructive/5",
  warning: "border-b border-warning/20 bg-warning/5",
};

const iconVariantStyles = {
  default: "text-muted-foreground",
  destructive: "text-destructive",
  warning: "text-warning",
};

export function DialogHeader({
  title,
  description,
  descriptionId,
  icon: Icon,
  variant = 'default',
  showCloseButton = false,
  onClose,
}: DialogHeaderProps) {
  return (
    <div className={cn("flex items-start gap-4 p-6", variantStyles[variant])}>
      {Icon && (
        <Icon className={cn("h-6 w-6 flex-shrink-0", iconVariantStyles[variant])} />
      )}
      
      <div className="flex-1">
        <DialogTitle className="text-lg font-semibold">
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription id={descriptionId} className="mt-1 text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        )}
      </div>
      
      {showCloseButton && onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

---

## Composite : SearchFormField {#composite-searchformfield}

```tsx
// lib/features/search/components/ui/composites/search-form-field.tsx
import { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { BaseInput } from '../elements/base-input';
import { Button } from "@/lib/components/ui/button";
import { useDebounce } from "@/lib/hooks/use-debounce";

type SearchFormFieldProps = Readonly<{
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
}>;

export function SearchFormField({
  value,
  onSearch,
  placeholder = "Rechercher...",
  debounceMs = 300,
  disabled = false
}: SearchFormFieldProps) {
  const [internalValue, setInternalValue] = useState(value);
  const debouncedValue = useDebounce(internalValue, debounceMs);

  // Sync avec valeur externe
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Déclencher recherche sur valeur debounced
  useEffect(() => {
    if (debouncedValue !== value) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, value, onSearch]);

  const handleClear = useCallback(() => {
    setInternalValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="relative">
      <BaseInput
        type="search"
        icon={Search}
        iconPosition="left"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={internalValue ? "pr-10" : ""}
      />
      {internalValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={disabled}
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
```

---

## Smart Container : CardsListContainer {#smart-cardslist}

```tsx
// lib/features/cards/components/cards-list-container.tsx (Smart)
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCards } from "../hooks/use-cards";
import { useCardActions } from "../hooks/use-card-actions";
import { CardsListDisplay } from "./ui/composites/cards-list-display";
import { CardsListSkeleton } from "./ui/composites/cards-list-skeleton";
import { ErrorMessage } from "@/lib/components/ui/error-message";
import { EmptyState } from "@/lib/components/ui/empty-state";

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

```tsx
// lib/features/cards/components/ui/composites/cards-list-display.tsx (Dumb)
import { Card } from "../../types/cards.types";
import { CardItem } from "./card-item";

type CardsListDisplayProps = Readonly<{
  cards: Card[];
  onCardClick: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}>;

export function CardsListDisplay({ 
  cards, 
  onCardClick, 
  onDelete,
  isDeleting 
}: CardsListDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <CardItem 
          key={card.id} 
          card={card} 
          onClick={() => onCardClick(card.id)}
          onDelete={() => onDelete(card.id)}
          isDeleting={isDeleting}
        />
      ))}
    </div>
  );
}
```

```tsx
// lib/features/cards/hooks/use-cards.ts
import { useQuery } from '@tanstack/react-query';
import { getCards } from '../actions/cards';

export function useCards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cards'],
    queryFn: getCards,
  });
  
  return { cards: data ?? [], isLoading, error };
}
```

```tsx
// lib/features/cards/hooks/use-card-actions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCard } from '../actions/cards';
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

---

## Smart Container : StandardDialogContainer {#smart-dialog}

```tsx
// lib/features/dialogs/components/standard-dialog-container.tsx (Smart)
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AlertDialog, AlertDialogContent } from "@/lib/components/ui/alert-dialog";
import { DialogHeader } from "./ui/composites/dialog-header";
import { DialogFooter } from "./ui/composites/dialog-footer";
import { DialogContentBody } from "./ui/composites/dialog-content-body";
import type { LucideIcon } from "lucide-react";

type StandardDialogContainerProps = Readonly<{
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive' | 'warning';
  input?: {
    defaultValue?: string;
    placeholder?: string;
    label?: string;
  };
  confirmText?: string;
  action?: {
    label: string;
    onClick: (value: string) => void | Promise<void>;
  };
  cancel?: {
    label: string;
    onClick: () => void;
  };
  loading?: boolean;
}>;

export function StandardDialogContainer({
  title,
  description,
  icon,
  variant = 'default',
  input,
  confirmText,
  action,
  cancel,
  loading = false
}: StandardDialogContainerProps) {
  // État local géré par le Smart component
  const [confirmValue, setConfirmValue] = useState("");
  const [inputValue, setInputValue] = useState(input?.defaultValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionId = "alert-dialog-description";

  // Focus management (side effect)
  useEffect(() => {
    if (input && inputRef.current) {
      const timeoutId = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [input]);

  const isConfirmDisabled = confirmText ? confirmValue !== confirmText : false;

  // Handlers définis dans le Smart component
  const handleSubmit = useCallback(() => {
    if (!loading && !isConfirmDisabled && action) {
      action.onClick(inputValue);
    }
  }, [action, inputValue, loading, isConfirmDisabled]);

  // Délègue le rendu aux Dumb components
  return (
    <AlertDialog open>
      <AlertDialogContent aria-describedby={descriptionId}>
        <DialogHeader
          title={title}
          description={description}
          descriptionId={descriptionId}
          icon={icon}
          variant={variant}
        />

        <DialogContentBody
          input={input}
          inputValue={inputValue}
          inputRef={inputRef}
          onInputChange={setInputValue}
          onInputEnterPress={handleSubmit}
          confirmText={confirmText}
          confirmValue={confirmValue}
          onConfirmChange={setConfirmValue}
        />

        <DialogFooter
          action={action ? { label: action.label, onClick: handleSubmit } : undefined}
          cancel={cancel}
          loading={loading}
          isActionDisabled={isConfirmDisabled}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## Smart Container : ContactFormContainer {#smart-contact}

Exemple complet de formulaire avec TanStack Form et les composants shadcn/ui.

> **Note:** Utilise `Field`, `FieldGroup`, `FieldLabel`, `FieldError` de shadcn/ui.
> Voir [documentation officielle](https://ui.shadcn.com/docs/forms/tanstack-form).

```tsx
// lib/features/contact/components/contact-form-container.tsx (Smart)
"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";
import { useSendMessage } from "../hooks/use-send-message";
import { ContactFormDisplay } from "./ui/composites/contact-form-display";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/components/ui/card";

const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères"),
  message: z.string().min(20, "Le message doit contenir au moins 20 caractères").max(500, "Maximum 500 caractères"),
});

export function ContactFormContainer() {
  const { sendMessage, isLoading } = useSendMessage();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    validators: {
      onSubmit: contactSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await sendMessage(value);
        toast.success("Message envoyé avec succès");
        form.reset();
      } catch (error) {
        toast.error("Erreur lors de l'envoi du message");
      }
    },
  });

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Nous contacter</CardTitle>
        <CardDescription>
          Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ContactFormDisplay form={form} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}
```

```tsx
// lib/features/contact/components/ui/composites/contact-form-display.tsx (Dumb)
import type { ReactFormExtendedApi } from "@tanstack/react-form";
import { User, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/lib/components/ui/field";
import { Input } from "@/lib/components/ui/input";
import { Textarea } from "@/lib/components/ui/textarea";

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type ContactFormDisplayProps = Readonly<{
  form: ReactFormExtendedApi<ContactFormData, undefined>;
  isLoading: boolean;
}>;

export function ContactFormDisplay({ form, isLoading }: ContactFormDisplayProps) {
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
                    autoComplete="name"
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
                    autoComplete="email"
                    className="pl-9"
                  />
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Subject Field */}
        <form.Field
          name="subject"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Sujet</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Objet de votre message"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Message Field */}
        <form.Field
          name="message"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Message</FieldLabel>
                <div className="relative">
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Décrivez votre demande..."
                    rows={5}
                    className="resize-none pl-9"
                  />
                  <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
                <FieldDescription>
                  {field.state.value.length}/500 caractères
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>

      <div className="mt-6 flex flex-col gap-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Envoi en cours..." : "Envoyer le message"}
        </Button>
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Réinitialiser
        </Button>
      </div>
    </form>
  );
}
```

```tsx
// lib/features/contact/hooks/use-send-message.ts
import { useMutation } from "@tanstack/react-query";
import { sendMessageAction } from "../actions/contact";

export function useSendMessage() {
  const mutation = useMutation({
    mutationFn: sendMessageAction,
  });

  return {
    sendMessage: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
```

---

## Composite : FormField Réutilisable {#composite-formfield}

Composant Dumb générique pour créer des champs de formulaire réutilisables.

```tsx
// lib/features/forms/components/ui/composites/text-form-field.tsx (Dumb)
import type { FieldApi } from "@tanstack/react-form";
import type { LucideIcon } from "lucide-react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/lib/components/ui/field";
import { Input } from "@/lib/components/ui/input";
import { cn } from "@/lib/utils";

type TextFormFieldProps = Readonly<{
  field: FieldApi<any, any, any, any, string>;
  label: string;
  type?: "text" | "email" | "password" | "tel" | "url";
  placeholder?: string;
  description?: string;
  icon?: LucideIcon;
  autoComplete?: string;
  disabled?: boolean;
}>;

export function TextFormField({
  field,
  label,
  type = "text",
  placeholder,
  description,
  icon: Icon,
  autoComplete,
  disabled,
}: TextFormFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={field.name}
          name={field.name}
          type={type}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={cn(Icon && "pl-9")}
        />
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
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
    <TextFormField
      field={field}
      label="Email"
      type="email"
      icon={Mail}
      placeholder="nom@exemple.com"
      autoComplete="email"
    />
  )}
/>
```

```tsx
// lib/features/forms/components/ui/composites/select-form-field.tsx (Dumb)
import type { FieldApi } from "@tanstack/react-form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/lib/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";

type Option = {
  value: string;
  label: string;
};

type SelectFormFieldProps = Readonly<{
  field: FieldApi<any, any, any, any, string>;
  label: string;
  options: Option[];
  placeholder?: string;
  description?: string;
  disabled?: boolean;
}>;

export function SelectFormField({
  field,
  label,
  options,
  placeholder = "Sélectionner...",
  description,
  disabled,
}: SelectFormFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        name={field.name}
        value={field.state.value}
        onValueChange={field.handleChange}
        disabled={disabled}
      >
        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

// Usage
<form.Field
  name="country"
  children={(field) => (
    <SelectFormField
      field={field}
      label="Pays"
      options={[
        { value: "ch", label: "Suisse" },
        { value: "fr", label: "France" },
        { value: "de", label: "Allemagne" },
      ]}
      placeholder="Choisir un pays"
    />
  )}
/>
```

```tsx
// lib/features/forms/components/ui/composites/checkbox-form-field.tsx (Dumb)
import type { FieldApi } from "@tanstack/react-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/lib/components/ui/field";
import { Checkbox } from "@/lib/components/ui/checkbox";

type CheckboxFormFieldProps = Readonly<{
  field: FieldApi<any, any, any, any, boolean>;
  label: string;
  description?: string;
  disabled?: boolean;
}>;

export function CheckboxFormField({
  field,
  label,
  description,
  disabled,
}: CheckboxFormFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field orientation="horizontal" data-invalid={isInvalid}>
      <Checkbox
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        aria-invalid={isInvalid}
        disabled={disabled}
      />
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor={field.name} className="font-normal">
          {label}
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </div>
    </Field>
  );
}

// Usage
<form.Field
  name="acceptTerms"
  children={(field) => (
    <CheckboxFormField
      field={field}
      label="J'accepte les conditions d'utilisation"
      description="Vous devez accepter pour continuer"
    />
  )}
/>
```

---

## Structure Projet Complète {#structure-projet}

```
lib/
├── features/
│   ├── cards/
│   │   ├── components/
│   │   │   ├── cards-list-container.tsx      # Smart
│   │   │   ├── card-detail-container.tsx     # Smart
│   │   │   ├── card-form-container.tsx       # Smart (TanStack Form)
│   │   │   └── ui/
│   │   │       ├── elements/
│   │   │       │   ├── card-avatar.tsx
│   │   │       │   ├── card-badge.tsx
│   │   │       │   └── index.ts
│   │   │       ├── composites/
│   │   │       │   ├── card-item.tsx
│   │   │       │   ├── cards-list-display.tsx
│   │   │       │   ├── card-form-display.tsx  # Dumb (reçoit form)
│   │   │       │   └── index.ts
│   │   │       ├── sections/
│   │   │       │   ├── card-header-section.tsx
│   │   │       │   └── index.ts
│   │   │       └── index.ts
│   │   ├── hooks/
│   │   │   ├── use-cards.ts
│   │   │   └── use-card-actions.ts
│   │   ├── actions/
│   │   │   └── cards.ts                      # Server Actions
│   │   ├── types/
│   │   │   └── cards.types.ts
│   │   └── index.ts
│   │
│   ├── contact/
│   │   ├── components/
│   │   │   ├── contact-form-container.tsx    # Smart (TanStack Form)
│   │   │   └── ui/
│   │   │       └── composites/
│   │   │           └── contact-form-display.tsx # Dumb (reçoit form)
│   │   ├── hooks/
│   │   │   └── use-send-message.ts
│   │   ├── actions/
│   │   │   └── contact.ts                    # Server Actions
│   │   └── types/
│   │       └── contact.types.ts
│   │
│   ├── forms/
│   │   └── components/
│   │       └── ui/
│   │           └── composites/               # Form Fields réutilisables
│   │               ├── text-form-field.tsx
│   │               ├── select-form-field.tsx
│   │               ├── checkbox-form-field.tsx
│   │               ├── switch-form-field.tsx
│   │               └── index.ts
│   │
│   └── dialogs/
│       ├── components/
│       │   ├── standard-dialog-container.tsx # Smart
│       │   ├── confirm-dialog-container.tsx  # Smart
│       │   └── ui/
│       │       ├── elements/
│       │       │   └── dialog-icon.tsx
│       │       ├── composites/
│       │       │   ├── dialog-header.tsx
│       │       │   ├── dialog-footer.tsx
│       │       │   └── dialog-content-body.tsx
│       │       └── index.ts
│       └── types/
│           └── dialog.types.ts
│
├── components/
│   └── ui/                                   # Composants shadcn/ui
│       ├── button.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── field.tsx                         # Field, FieldGroup, FieldLabel, FieldError
│       ├── select.tsx
│       ├── checkbox.tsx
│       ├── switch.tsx
│       └── ...
│
├── hooks/                                    # Hooks globaux
│   ├── use-debounce.ts
│   └── index.ts
│
└── stores/                                   # État global (Zustand)
    └── ui-store.ts

app/
├── (marketing)/
│   ├── page.tsx
│   └── contact/
│       └── page.tsx
├── (dashboard)/
│   ├── cards/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   └── page.tsx
└── layout.tsx
```

### Page Contact Exemple

```tsx
// app/(marketing)/contact/page.tsx
import { ContactFormContainer } from "@/lib/features/contact/components/contact-form-container";

export default function ContactPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-lg">
        <ContactFormContainer />
      </div>
    </div>
  );
}
```

### Page Cards Exemple

```tsx
// app/(dashboard)/cards/page.tsx
import { CardsListContainer } from "@/lib/features/cards/components/cards-list-container";

export default function CardsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Mes Cartes</h1>
      <CardsListContainer />
    </div>
  );
}
```

### Page Création Card Exemple

```tsx
// app/(dashboard)/cards/new/page.tsx
import { CardFormContainer } from "@/lib/features/cards/components/card-form-container";

export default function NewCardPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Nouvelle Carte</h1>
      <CardFormContainer />
    </div>
  );
}
```

Le Smart Container gère la logique (useForm, mutations), le Dumb Display reçoit le form en prop et rend l'UI.
