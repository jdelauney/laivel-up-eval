import { useForm } from '@tanstack/react-form'
import { GroupRail } from '../../../../components/group-rail/composites/group-rail'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { useOnboarding } from '../../hooks/use-onboarding.hook'
import { onboardingFormSchema } from '../../schema/onboarding-form.schema'
import { ResumeRun } from '../composites/resume-run'

/**
 * L'accueil, en carnet de vol. La rampe des groupes tient l'axe vertical et
 * dit la forme de ce qui va être mesuré ; la carte de relevé porte
 * l'engagement.
 *
 * Le contrat énonce le cadre, jamais les critères : un joueur prévenu de ce
 * qu'on note joue un personnage.
 */

/** Les erreurs d'un champ, rendues au même endroit et de la même façon. */
const FieldErrors = ({
  errors,
}: {
  errors: readonly (string | { message?: string } | undefined)[]
}) => (
  <p className="font-medium text-missed text-sm">
    {errors
      .map((error) => (typeof error === 'string' ? error : error?.message))
      .join(', ')}
  </p>
)

export const OnboardingView = () => {
  const { start, resume, discard, storedRun, rail } = useOnboarding()
  const totalGames = rail.reduce((sum, group) => sum + group.gameCount, 0)

  const form = useForm({
    defaultValues: { playerName: '', repository: '' },
    validators: { onChange: onboardingFormSchema },
    /**
     * TanStack Form ne rend que l'entrée brute : le dépôt repasse par le
     * schéma pour ressortir normalisé, sans quoi l'URL collée partirait telle
     * quelle jusque dans la session persistée.
     */
    onSubmit: ({ value }) => {
      const { playerName, repository } = onboardingFormSchema.parse(value)
      start(playerName, repository)
    },
  })

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(11rem,16rem)_1fr] md:gap-12">
      <div className="md:pt-1">
        <p className="mb-3 font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
          Le parcours
        </p>
        <GroupRail groups={rail} />
      </div>

      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <h2 className="max-w-[22ch] font-semibold text-3xl leading-[1.1] tracking-tight md:text-4xl">
            Vous n'allez pas déclarer votre niveau. Vous allez le démontrer.
          </h2>
          <p className="max-w-[52ch] text-plane-foreground/70">
            Chaque situation enregistre ce que vous faites, pas ce que vous
            dites faire. Le verdict se calcule&nbsp;; il ne se négocie pas.
          </p>
        </header>

        <dl className="grid grid-cols-3 gap-px border-plane-rule border-y bg-plane-rule">
          <div className="bg-background py-4 pr-4">
            <dt className="text-plane-foreground/50 text-xs uppercase tracking-[0.12em]">
              Groupes
            </dt>
            <dd className="mt-1 font-semibold text-2xl tabular-nums">
              {rail.length}
            </dd>
          </div>
          <div className="bg-background px-4 py-4">
            <dt className="text-plane-foreground/50 text-xs uppercase tracking-[0.12em]">
              Situations
            </dt>
            <dd className="mt-1 font-semibold text-2xl tabular-nums">
              {totalGames}
            </dd>
          </div>
          <div className="bg-background py-4 pl-4">
            <dt className="text-plane-foreground/50 text-xs uppercase tracking-[0.12em]">
              Données
            </dt>
            <dd className="mt-1 font-semibold text-2xl">Locales</dd>
          </div>
        </dl>

        {storedRun ? (
          <ResumeRun
            playerName={storedRun.playerName}
            repository={storedRun.repository}
            submitted={storedRun.submitted}
            total={storedRun.total}
            onResume={resume}
            onDiscard={discard}
          />
        ) : null}

        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <form.Field name="playerName">
            {(field) => (
              <div className="flex max-w-sm flex-col gap-2">
                <Label
                  htmlFor={field.name}
                  className="text-plane-foreground/60 text-xs uppercase tracking-[0.12em]"
                >
                  {storedRun ? 'Ou démarrer sous un autre nom' : 'Votre nom'}
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  autoComplete="off"
                  aria-invalid={
                    !field.state.meta.isValid && field.state.meta.isTouched
                  }
                />
                {!field.state.meta.isValid && field.state.meta.isTouched ? (
                  <FieldErrors errors={field.state.meta.errors} />
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name="repository">
            {(field) => (
              <div className="flex max-w-sm flex-col gap-2">
                <Label
                  htmlFor={field.name}
                  className="text-plane-foreground/60 text-xs uppercase tracking-[0.12em]"
                >
                  Votre dépôt (facultatif)
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  autoComplete="off"
                  placeholder="proprietaire/depot"
                  aria-describedby={`${field.name}-aide`}
                  aria-invalid={
                    !field.state.meta.isValid && field.state.meta.isTouched
                  }
                />
                <p
                  id={`${field.name}-aide`}
                  className="text-plane-foreground/60 text-sm"
                >
                  L'URL GitHub complète ou la forme{' '}
                  <code className="bg-plane px-1 text-plane-foreground">
                    proprietaire/depot
                  </code>
                  . Rien n'est vérifié à cet instant.
                </p>
                {!field.state.meta.isValid && field.state.meta.isTouched ? (
                  <FieldErrors errors={field.state.meta.errors} />
                ) : null}
              </div>
            )}
          </form.Field>

          <div>
            <Button type="submit" size="lg">
              Commencer l'évaluation
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
