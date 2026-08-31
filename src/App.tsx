import { AppLayout } from './components/layout/app-layout/app-layout'
import { CourseView } from './features/group-navigation/components/sections/course-view'
import { OnboardingView } from './features/onboarding/components/sections/onboarding-view'
import { SummaryView } from './features/scoring-summary/components/sections/summary-view'
import { AbandonRun } from './features/session-restore/components/sections/abandon-run'
import { useRestoreRun } from './features/session-restore/hooks/use-restore-run.hook'
import { useComposition } from './providers/session-context'
import { useSessionStore } from './store/session.store'

/**
 * Aiguille les écrans, sans état propre. La position vient du store, qui la
 * tient de la façade.
 */

const InvalidConfig = ({
  field,
  message,
}: {
  field: string
  message: string
}) => (
  <AppLayout status="configuration refusée">
    <section className="flex max-w-2xl flex-col gap-4">
      <p className="font-medium text-missed text-xs uppercase tracking-[0.14em]">
        Chargement interrompu
      </p>
      <h2 className="font-semibold text-2xl tracking-tight">
        Les données du parcours n'ont pas été acceptées
      </h2>
      <p className="text-plane-foreground/70">
        Aucune session ne peut s'ouvrir tant que la configuration ne respecte
        pas son contrat. Le champ en cause est{' '}
        <code className="bg-plane px-1 py-0.5 text-plane-foreground">
          {field}
        </code>
        .
      </p>
      <pre className="overflow-x-auto border border-plane-rule border-t-4 border-t-missed bg-plane p-4 text-plane-foreground text-sm">
        {message}
      </pre>
    </section>
  </AppLayout>
)

/**
 * Ne se rend qu'une fois la configuration acceptée : la reprise au montage
 * appelle la façade, qui n'existe pas tant que la configuration est refusée.
 * La séparer d'`App` évite d'appeler ce hook sous condition.
 */
const ReadyApp = () => {
  useRestoreRun()

  const screen = useSessionStore((state) => state.screen)
  const progress = useSessionStore((state) => state.progress)
  const identity = useSessionStore((state) => state.identity)

  if (screen === 'onboarding') {
    return (
      <AppLayout>
        <OnboardingView />
      </AppLayout>
    )
  }

  if (screen === 'summary') {
    return (
      <AppLayout
        status="parcours terminé"
        identity={identity}
        action={
          <AbandonRun
            triggerLabel="Effacer ce verdict"
            dialogTitle="Effacer ce verdict ?"
            consequence="Le verdict est acquis ; l'effacer ne laisse aucune trace."
          />
        }
      >
        <SummaryView />
      </AppLayout>
    )
  }

  return (
    <AppLayout
      status={
        progress
          ? `${progress.submitted}/${progress.total} situations`
          : undefined
      }
      identity={identity}
      action={
        <AbandonRun
          triggerLabel="Abandonner cette partie"
          dialogTitle="Abandonner cette partie ?"
          consequence="Rien ne permet de revenir."
        />
      }
    >
      <CourseView />
    </AppLayout>
  )
}

function App() {
  const composition = useComposition()

  if (composition.status === 'invalid-config') {
    return (
      <InvalidConfig field={composition.field} message={composition.message} />
    )
  }

  return <ReadyApp />
}

export default App
