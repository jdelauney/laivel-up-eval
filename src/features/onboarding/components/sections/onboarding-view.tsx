import { useForm } from '@tanstack/react-form'
import { GroupRail } from '../../../../components/group-rail/composites/group-rail'
import { Button } from '../../../../components/ui/button'
import { useOnboarding } from '../../hooks/use-onboarding.hook'
import {
  type OnboardingFormInput,
  onboardingFormSchema,
} from '../../schema/onboarding-form.schema'
import { MissingRepositoryNotice } from '../composites/missing-repository-notice'
import { ResumeRun } from '../composites/resume-run'
import { TextField } from '../elements/text-field'

/**
 * L'accueil, en carnet de vol. La rampe des groupes tient l'axe vertical et
 * dit la forme de ce qui va être mesuré ; la carte de relevé porte
 * l'engagement.
 *
 * Le contrat énonce le cadre, jamais les critères : un joueur prévenu de ce
 * qu'on note joue un personnage.
 */

/** Le formulaire vide, typé sur l'entrée du schéma et non sur sa sortie. */
const emptyForm: OnboardingFormInput = { playerName: '', repository: '' }

export const OnboardingView = () => {
  const {
    start,
    resume,
    discard,
    storedRun,
    rail,
    totalSituations,
    estimatedMinutes,
    repositoryProvenAxes,
  } = useOnboarding()

  const form = useForm({
    defaultValues: emptyForm,
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

        <div className="flex flex-col gap-3">
          {/*
           * Quatre colonnes à partir de `lg` et non de `md` : entre 768 et
           * 825 px, une colonne ne laisse que 71 px utiles. « SITUATIONS » et
           * « ESTIMATION » y débordent leur boîte et « 30 min » y passe sur
           * deux lignes. Deux colonnes tiennent jusque-là.
           */}
          <dl className="grid grid-cols-2 gap-px border-plane-rule border-y bg-plane-rule lg:grid-cols-4">
            <div className="bg-background py-4 pr-4">
              <dt className="text-plane-foreground/50 text-xs uppercase tracking-[0.12em]">
                Groupes
              </dt>
              <dd className="mt-1 font-semibold text-2xl tabular-nums">
                {rail.length}
              </dd>
            </div>
            <div className="bg-background py-4 pl-4 lg:px-4">
              <dt className="text-plane-foreground/50 text-xs uppercase tracking-[0.12em]">
                Situations
              </dt>
              <dd className="mt-1 font-semibold text-2xl tabular-nums">
                {totalSituations}
              </dd>
            </div>
            {/*
             * « Durée estimée » passe sur deux lignes à quatre colonnes (103 px
             * utiles) et fait descendre son chiffre sous les trois autres.
             * « Estimation » tient sur une seule ligne et dit, dans l'intitulé,
             * que la valeur n'est pas un chronomètre.
             */}
            <div className="bg-background py-4 pr-4 lg:px-4">
              <dt className="text-plane-foreground/50 text-xs uppercase tracking-[0.12em]">
                Estimation
              </dt>
              <dd className="mt-1 font-semibold text-2xl tabular-nums">
                {estimatedMinutes} min
              </dd>
            </div>
            <div className="bg-background py-4 pl-4">
              <dt className="text-plane-foreground/50 text-xs uppercase tracking-[0.12em]">
                Données
              </dt>
              <dd className="mt-1 font-semibold text-2xl">Locales</dd>
            </div>
          </dl>

          {/*
           * La durée annoncée sans cette ligne fait passer le parcours pour
           * un bloc insécable. La reprise existe et elle est testée, mais la
           * carte de reprise ne s'affiche qu'à qui a déjà joué : le primo-
           * arrivant, seul lecteur de ce cadre, ne la verrait jamais.
           */}
          <p className="text-plane-foreground/60 text-sm">
            Une partie interrompue se reprend dans ce navigateur.
          </p>
        </div>

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
              <TextField
                name={field.name}
                label={
                  storedRun ? 'Ou démarrer sous un autre nom' : 'Votre nom'
                }
                value={field.state.value}
                invalid={
                  !field.state.meta.isValid && field.state.meta.isTouched
                }
                errors={field.state.meta.errors}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
              />
            )}
          </form.Field>

          <form.Field name="repository">
            {(field) => (
              <>
                <TextField
                  name={field.name}
                  label="Votre dépôt (facultatif)"
                  value={field.state.value}
                  invalid={
                    !field.state.meta.isValid && field.state.meta.isTouched
                  }
                  errors={field.state.meta.errors}
                  placeholder="proprietaire/depot"
                  help={
                    <>
                      L'URL GitHub complète ou la forme{' '}
                      <code className="bg-plane px-1 text-plane-foreground">
                        proprietaire/depot
                      </code>
                      . Rien n'est vérifié à cet instant.
                    </>
                  }
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
                {field.state.value.trim() === '' ? (
                  <MissingRepositoryNotice axes={repositoryProvenAxes} />
                ) : null}
              </>
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
